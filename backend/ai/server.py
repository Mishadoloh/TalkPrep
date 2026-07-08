import os
import sqlite3
import uuid
import logging
import time
import requests
import re
import queue
import threading
import contextvars
import hashlib
import json
import shutil
from datetime import datetime
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException, Header, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
from question_bank_data import DEFAULT_QUESTION_BANK

# --- DISTRIBUTED TRACING (GOOGLE DAPPER PATTERN) ---
correlation_id_ctx = contextvars.ContextVar("correlation_id", default="-")

class CorrelationFilter(logging.Filter):
    def filter(self, record):
        record.correlation_id = correlation_id_ctx.get()
        return True

handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] [TraceID: %(correlation_id)s] (%(name)s) %(message)s"))
handler.addFilter(CorrelationFilter())

logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("ai-service")

app = FastAPI(
    title="TalkPrep AI Service (Google Tech Grade)",
    description="Speech analytics with background task queues, custom resumes, and Dapper tracing.",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "interviews.db")
AUTH_SERVICE_URL = "http://localhost:3010"
QUESTION_BANK_HASH = hashlib.sha256(
    json.dumps(DEFAULT_QUESTION_BANK, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
).hexdigest()
QUESTION_BANK_COUNT = len(DEFAULT_QUESTION_BANK)

# Multi-language Filler word regex dictionary
FILLER_PATTERNS = {
    "en-US": [
        re.compile(r"\buh\b", re.IGNORECASE),
        re.compile(r"\bum\b", re.IGNORECASE),
        re.compile(r"\blike\b", re.IGNORECASE),
        re.compile(r"\bbasically\b", re.IGNORECASE),
        re.compile(r"\byou know\b", re.IGNORECASE),
        re.compile(r"\bactually\b", re.IGNORECASE),
    ],
    "uk-UA": [
        re.compile(r"\bну\b", re.IGNORECASE),
        re.compile(r"\bтипу\b", re.IGNORECASE),
        re.compile(r"\bкоротше\b", re.IGNORECASE),
        re.compile(r"\bе-е\b", re.IGNORECASE),
        re.compile(r"\bм-м\b", re.IGNORECASE),
        re.compile(r"\bтак би мовити\b", re.IGNORECASE),
        re.compile(r"\bв принципі\b", re.IGNORECASE),
    ]
}

# --- DATABASE MIGRATIONS ENGINE ---
@contextmanager
def get_db_cursor():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"DB error: {e}", exc_info=True)
        raise e
    finally:
        conn.close()

def seed_question_bank(cursor):
    rows = [
        (
            str(uuid.uuid5(
                uuid.NAMESPACE_URL,
                f"talkprep-question:{item['language']}:{item['role']}:{item['level']}:{item['category']}:{item['question']}"
            )),
            item["language"],
            item["role"],
            item["level"],
            item["category"],
            item["question"],
            item["ideal"],
        )
        for item in DEFAULT_QUESTION_BANK
    ]
    cursor.executemany(
        """
        INSERT INTO question_bank_items
            (id, language, role, level, category, question_text, ideal_answer)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        rows
    )

def upsert_question_bank_meta(cursor):
    cursor.execute("DELETE FROM question_bank_meta WHERE key IN ('content_hash', 'content_count')")
    cursor.executemany(
        "INSERT INTO question_bank_meta (key, value) VALUES (?, ?)",
        [
            ("content_hash", QUESTION_BANK_HASH),
            ("content_count", str(QUESTION_BANK_COUNT)),
        ]
    )

def run_migrations():
    logger.info("Initializing AI database migrations check...")
    with get_db_cursor() as cursor:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        );
        """)
        
        cursor.execute("SELECT MAX(version) as current_version FROM schema_migrations")
        row = cursor.fetchone()
        current_version = row["current_version"] if row and row["current_version"] is not None else 0

        if current_version < 1:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS interviews (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                role TEXT,
                level TEXT,
                language TEXT,
                status TEXT,
                overall_score INTEGER,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                interview_id TEXT,
                question_text TEXT,
                answer_text TEXT,
                score INTEGER,
                critique TEXT,
                ideal_answer TEXT,
                FOREIGN KEY(interview_id) REFERENCES interviews(id)
            );
            """)
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (1, 'Create base schema tables')")

        if current_version < 2:
            cursor.execute("ALTER TABLE questions ADD COLUMN words_per_minute REAL NULL;")
            cursor.execute("ALTER TABLE questions ADD COLUMN lexical_diversity REAL NULL;")
            cursor.execute("ALTER TABLE questions ADD COLUMN filler_count INTEGER NULL;")
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (2, 'Add lexical metrics columns')")

        if current_version < 3:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS question_bank_items (
                id TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                level TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'en-US',
                category TEXT NOT NULL,
                question_text TEXT NOT NULL,
                ideal_answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(language, role, level, question_text)
            );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_role_level ON question_bank_items(role, level);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_category ON question_bank_items(category);")
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (3, 'Create interview question bank')")
        else:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS question_bank_items (
                id TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                level TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'en-US',
                category TEXT NOT NULL,
                question_text TEXT NOT NULL,
                ideal_answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(language, role, level, question_text)
            );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_role_level ON question_bank_items(role, level);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_category ON question_bank_items(category);")

        if current_version < 4:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS question_bank_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_language_role_level ON question_bank_items(language, role, level);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_language_category ON question_bank_items(language, category);")
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (4, 'Add question bank sync metadata and composite indexes')")
        else:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS question_bank_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_language_role_level ON question_bank_items(language, role, level);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_language_category ON question_bank_items(language, category);")

        cursor.execute("PRAGMA table_info(question_bank_items)")
        question_bank_columns = {row["name"] for row in cursor.fetchall()}
        if "language" not in question_bank_columns:
            cursor.execute("ALTER TABLE question_bank_items ADD COLUMN language TEXT NOT NULL DEFAULT 'en-US';")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_language ON question_bank_items(language);")
        cursor.execute("SELECT value FROM question_bank_meta WHERE key = 'content_hash'")
        hash_row = cursor.fetchone()
        stored_hash = hash_row["value"] if hash_row else None
        cursor.execute("SELECT COUNT(*) AS count FROM question_bank_items")
        stored_count = cursor.fetchone()["count"]

        cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ux_question_bank_language_role_level_question
        ON question_bank_items(language, role, level, question_text);
        """)

        if stored_hash != QUESTION_BANK_HASH or stored_count != QUESTION_BANK_COUNT:
            logger.info("Question bank content changed or missing. Rebuilding question bank table...")
            cursor.execute("DELETE FROM question_bank_items;")
            seed_question_bank(cursor)
            upsert_question_bank_meta(cursor)
        else:
            logger.info("Question bank is up to date; skipping reseed.")

        cursor.execute("SELECT COUNT(*) AS count FROM question_bank_items")
        question_bank_count = cursor.fetchone()["count"]

        logger.info(
            f"AI database migrations applied. Current Schema Version: {max(current_version, 4)}. "
            f"Question bank rows: {question_bank_count}"
        )

run_migrations()

# --- HTTP RESILIENCY CLIENT ---
def get_http_session(retries=3, backoff_factor=0.3):
    session = requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

http_client = get_http_session()

# --- TELEMETRY HEALTH DIAGNOSTICS ---
def get_question_bank_diagnostics(cursor):
    cursor.execute("SELECT MAX(version) AS schema_version FROM schema_migrations")
    schema_row = cursor.fetchone()
    schema_version = schema_row["schema_version"] if schema_row else None

    cursor.execute("SELECT COUNT(*) AS total FROM question_bank_items")
    question_bank_total = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(DISTINCT question_text) AS unique_questions FROM question_bank_items")
    unique_questions = cursor.fetchone()["unique_questions"]
    cursor.execute("SELECT COUNT(DISTINCT role) AS roles FROM question_bank_items")
    roles = cursor.fetchone()["roles"]
    cursor.execute("SELECT COUNT(DISTINCT category) AS categories FROM question_bank_items")
    categories = cursor.fetchone()["categories"]
    cursor.execute("SELECT language, COUNT(*) AS count FROM question_bank_items GROUP BY language ORDER BY language")
    languages = {row["language"]: row["count"] for row in cursor.fetchall()}
    cursor.execute("SELECT level, COUNT(*) AS count FROM question_bank_items GROUP BY level ORDER BY level")
    levels = {row["level"]: row["count"] for row in cursor.fetchall()}
    cursor.execute("""
        SELECT role, COUNT(*) AS count
        FROM question_bank_items
        GROUP BY role
        ORDER BY count DESC, role
        LIMIT 12
    """)
    top_roles = [{"role": row["role"], "count": row["count"]} for row in cursor.fetchall()]
    cursor.execute("SELECT value FROM question_bank_meta WHERE key = 'content_hash'")
    hash_row = cursor.fetchone()
    content_hash = hash_row["value"] if hash_row else None

    return {
        "schemaVersion": schema_version,
        "questionBank": {
            "total": question_bank_total,
            "uniqueQuestions": unique_questions,
            "expected": QUESTION_BANK_COUNT,
            "contentHash": content_hash,
            "expectedHash": QUESTION_BANK_HASH,
            "synced": question_bank_total == QUESTION_BANK_COUNT and content_hash == QUESTION_BANK_HASH,
            "coverage": {
                "roles": roles,
                "categories": categories,
                "languages": languages,
                "levels": levels,
                "topRoles": top_roles,
            },
        },
    }

@app.get("/healthz")
def health_check():
    db_status = "healthy"
    db_error = None
    db_details = {
        "schemaVersion": None,
        "questionBank": {
            "total": 0,
            "uniqueQuestions": 0,
            "expected": QUESTION_BANK_COUNT,
            "contentHash": None,
            "expectedHash": QUESTION_BANK_HASH,
            "synced": False,
        },
    }
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT 1")
            db_details = get_question_bank_diagnostics(cursor)
    except Exception as e:
        db_status = "unhealthy"
        db_error = str(e)

    total, used, free = shutil.disk_usage("/")
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "service": "ai-service",
        "timestamp": datetime.now().isoformat(),
        "database": {
            "status": db_status,
            "error": db_error,
            **db_details,
        },
        "background_queue": {
            "size": grading_queue.qsize()
        },
        "system": {
            "disk_free_gb": round(free / (2**30), 2),
            "disk_used_percentage": round((used / total) * 100, 1)
        }
    }

# --- ASYNCHRONOUS TASK WORKER QUEUE ---
grading_queue = queue.Queue()

def calculate_lexical_diversity(text: str) -> float:
    words = re.findall(r"\w+", text.lower())
    if not words:
        return 0.0
    unique_words = set(words)
    return round(len(unique_words) / len(words), 3)

def estimate_speaking_rate(text: str, duration_seconds: float = 30.0) -> float:
    words = re.findall(r"\w+", text)
    if duration_seconds <= 0:
        return 0.0
    return round((len(words) / duration_seconds) * 60, 1)

def run_grammar_critique(answer: str, lang: str) -> str:
    """Check for basic syntax/grammar styles based on simple rules."""
    feedback = []
    if lang == "en-US":
        if re.search(r"\bi is\b|\bi are\b|\byou is\b|\bthey is\b|\bhe do\b", answer, re.I):
            feedback.append("Grammatical agreement error detected.")
        if len(answer.split()) > 25 and not any(mark in answer for mark in [".", ",", ";"]):
            feedback.append("Avoid long run-on sentences without pauses.")
    else:
        if re.search(r"\bя є\b|\bвони є\b|\bвін робить\b", answer, re.I):
            feedback.append("Зверніть увагу на узгодження відмінків.")
        if len(answer.split()) > 20 and not any(mark in answer for mark in [".", ",", ";"]):
            feedback.append("Речення занадто довге, структуруйте відповідь паузами.")
            
    return " ".join(feedback) if feedback else ("Good sentence structure." if lang == "en-US" else "Хороша структура речення.")

def calculate_advanced_metrics(answer: str, reference: str, lang: str) -> dict:
    if not answer or len(answer.strip()) < 5:
        return {
            "score": 0,
            "critique": "Spoken answer transcript is too brief to evaluate.",
            "fillers": 0,
            "lexical_diversity": 0.0,
            "wpm": 0.0
        }

    fillers = FILLER_PATTERNS.get(lang, FILLER_PATTERNS["en-US"])
    filler_count = 0
    for pattern in fillers:
        filler_count += len(pattern.findall(answer))
    filler_count += len(re.findall(r"\b[ea]-+h+\b|\b[um]-+m+\b", answer, re.I))

    lexical_div = calculate_lexical_diversity(answer)
    wpm = estimate_speaking_rate(answer, duration_seconds=25.0)
    grammar_notes = run_grammar_critique(answer, lang)

    ref_words = set(re.findall(r"\w+", reference.lower()))
    ans_words = set(re.findall(r"\w+", answer.lower()))
    matches = ref_words.intersection(ans_words)
    match_ratio = len(matches) / max(len(ref_words), 1)
    
    base_score = int(match_ratio * 100)
    penalty = min(filler_count * 6, 30)
    bonus = 10 if lexical_div > 0.6 else 0
    
    final_score = min(max(base_score - penalty + bonus, 0), 100)

    critique = (
        f"Conceptual match is {int(match_ratio*100)}%. "
        f"Vocabulary diversity is {int(lexical_div*100)}%. "
        f"Detected {filler_count} verbal filler sounds. "
        f"Estimated speaking pace: {wpm} WPM. {grammar_notes}"
    ) if lang == "en-US" else (
        f"Концептуальний збіг: {int(match_ratio*100)}%. "
        f"Різноманітність словникового запасу: {int(lexical_div*100)}%. "
        f"Виявлено {filler_count} слів-паразитів. "
        f"Орієнтовний темп мовлення: {wpm} слів/хв. {grammar_notes}"
    )
    
    return {
        "score": final_score,
        "critique": critique,
        "fillers": filler_count,
        "lexical_diversity": lexical_div,
        "wpm": wpm
    }

def query_gemini_api(question: str, answer: str, ideal: str, lang: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    metrics = calculate_advanced_metrics(answer, ideal, lang)
    if not api_key:
        return metrics
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    prompt = f"""
    You are an AI interviewer grading coding answers.
    Language: {lang}
    Technical Question: "{question}"
    Candidate Spoken Answer: "{answer}"
    Reference Ideal Answer: "{ideal}"

    Return a strict JSON object with this schema:
    {{
      "score": <integer from 0 to 100>,
      "critique": "<2-3 sentence technical critique explaining correctness and missing keywords>"
    }}
    Do not wrap in markdown block formatting.
    """
    
    try:
        res = http_client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=8)
        if res.status_code == 200:
            json_data = res.json()
            raw_text = json_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            clean_json = re.sub(r"```json|```", "", raw_text).strip()
            parsed = json.loads(clean_json)
            metrics["score"] = int(parsed.get("score", metrics["score"]))
            metrics["critique"] = f"{parsed.get('critique', '')} ({metrics['critique']})"
    except Exception as e:
        logger.warning(f"Failed to query Gemini API, using heuristics: {e}")
    return metrics

def bg_task_worker():
    while True:
        task = grading_queue.get()
        if task is None:
            break
            
        question_id = task["question_id"]
        answer_text = task["answer_text"]
        question_text = task["question_text"]
        ideal_answer = task["ideal_answer"]
        lang = task["language"]
        corr_id = task["correlation_id"]
        
        token = correlation_id_ctx.set(corr_id)
        logger.info(f"Processing background grading task for question {question_id}")
        
        try:
            metrics = query_gemini_api(question_text, answer_text, ideal_answer, lang)
            
            with get_db_cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE questions 
                    SET score = ?, critique = ?, filler_count = ?, lexical_diversity = ?, words_per_minute = ?
                    WHERE id = ?
                    """,
                    (
                        metrics["score"],
                        metrics["critique"],
                        metrics["fillers"],
                        metrics["lexical_diversity"],
                        metrics["wpm"],
                        question_id
                    )
                )
            logger.info(f"Successfully graded and stored question {question_id}. Score: {metrics['score']}%")
        except Exception as e:
            logger.error(f"Error in background grading loop for question {question_id}: {e}", exc_info=True)
        finally:
            correlation_id_ctx.reset(token)
            grading_queue.task_done()

worker_thread = threading.Thread(target=bg_task_worker, daemon=True)
worker_thread.start()

# --- TRACING MIDDLEWARE ---
@app.middleware("http")
async def trace_middleware(request: Request, call_next):
    corr_id = request.headers.get("x-correlation-id", str(uuid.uuid4()))
    token = correlation_id_ctx.set(corr_id)
    
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        response.headers["x-correlation-id"] = corr_id
        response.headers["X-Process-Time-Seconds"] = f"{duration:.4f}"
        return response
    finally:
        correlation_id_ctx.reset(token)

# --- DEFAULT QUESTION BANK ---
MOCK_BANK = {
    "Frontend Engineer": [
        {"q": "What is the difference between Virtual DOM and Real DOM in React?", "ideal": "Virtual DOM is a lightweight representation of the Real DOM. React diffs it to batch updates efficiently."},
        {"q": "Explain closures in JavaScript and how they are used.", "ideal": "A closure is a function that remembers its lexical scope variables even after the outer function has finished executing."},
        {"q": "What are React Server Components and how do they differ from SSR?", "ideal": "RSC runs exclusively on the server without client bundle size. SSR generates HTML but requires full hydration payload."}
    ],
    "Backend Engineer": [
        {"q": "What is database indexing and how does it speed up queries?", "ideal": "Indexes are structures like B-Trees that avoid full-table scans, reducing retrieval times for SELECT queries."},
        {"q": "Explain the difference between SQL and NoSQL databases.", "ideal": "SQL databases are relational and structured enforcing ACID. NoSQL databases are schema-less document engines scaling horizontally."}
    ]
}

def normalize_level(level: str) -> str:
    aliases = {
        "middle": "Mid",
        "mid": "Mid",
        "junior": "Junior",
        "senior": "Senior",
    }
    return aliases.get((level or "").strip().lower(), level or "Mid")

def get_question_bank_items(role: str, level: str, language: str = "en-US", count: int = 3) -> list[dict]:
    normalized_level = normalize_level(level)
    normalized_language = language or "en-US"
    safe_count = max(1, min(int(count or 3), 15))
    selected = []
    selected_ids = set()

    lookup_order = [
        (role, normalized_level),
        (role, "Mid"),
        (role, "Junior"),
        ("Frontend Engineer", normalized_level),
        ("Frontend Engineer", "Mid"),
        ("Frontend Engineer", "Junior"),
    ]

    with get_db_cursor() as cursor:
        for lookup_role, lookup_level in lookup_order:
            if len(selected) >= safe_count:
                break

            cursor.execute(
                """
                SELECT id, language, role, level, category, question_text, ideal_answer
                FROM question_bank_items
                WHERE role = ? AND level = ? AND language = ?
                ORDER BY RANDOM()
                LIMIT ?
                """,
                (lookup_role, lookup_level, normalized_language, safe_count)
            )

            for row in cursor.fetchall():
                if row["id"] in selected_ids:
                    continue
                selected_ids.add(row["id"])
                selected.append({"q": row["question_text"], "ideal": row["ideal_answer"]})
                if len(selected) >= safe_count:
                    break

        if len(selected) < safe_count:
            placeholders = ",".join("?" for _ in selected_ids) or "''"
            excluded_ids = list(selected_ids)
            cursor.execute(
                f"""
                SELECT id, question_text, ideal_answer
                FROM question_bank_items
                WHERE id NOT IN ({placeholders}) AND language = ?
                ORDER BY RANDOM()
                LIMIT ?
                """,
                (*excluded_ids, normalized_language, safe_count - len(selected))
            )
            for row in cursor.fetchall():
                selected_ids.add(row["id"])
                selected.append({"q": row["question_text"], "ideal": row["ideal_answer"]})

        if len(selected) < safe_count:
            placeholders = ",".join("?" for _ in selected_ids) or "''"
            excluded_ids = list(selected_ids)
            cursor.execute(
                f"""
                SELECT id, question_text, ideal_answer
                FROM question_bank_items
                WHERE id NOT IN ({placeholders})
                ORDER BY RANDOM()
                LIMIT ?
                """,
                (*excluded_ids, safe_count - len(selected))
            )
            selected.extend({"q": row["question_text"], "ideal": row["ideal_answer"]} for row in cursor.fetchall())

    if selected:
        return selected

    logger.warning("Question bank table is empty. Falling back to in-memory MOCK_BANK.")
    return MOCK_BANK.get(role, MOCK_BANK["Frontend Engineer"])[:safe_count]

# --- DYNAMIC GEMINI QUESTIONS GENERATOR ---
def generate_questions_from_resume_jd(resume: str, jd: str, role: str, level: str, lang: str, count: int = 3) -> list[dict]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("No Gemini Key available for personalized interview. Falling back to default bank.")
        return get_question_bank_items(role, level, lang, count)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    safe_count = max(1, min(int(count or 3), 15))
    prompt = f"""
    You are an expert technical recruiter preparing questions for a technical interview.
    Language: {lang}
    Target Role: {role}
    Experience Level: {level}
    Candidate Resume Details: "{resume}"
    Target Job Description (JD): "{jd}"

    Generate exactly {safe_count} highly technical mock interview questions tailored directly to this candidate's background and this role.
    Provide the output in a strict JSON array containing exactly {safe_count} objects with keys "q" (the question string) and "ideal" (a 1-2 sentence reference answer key containing technical keywords to check for).
    Do not wrap in markdown block formatting.
    """

    try:
        res = http_client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10)
        if res.status_code == 200:
            json_data = res.json()
            raw_text = json_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            clean_json = re.sub(r"```json|```", "", raw_text).strip()
            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) == safe_count:
                logger.info(f"Successfully generated {safe_count} customized questions using Google Gemini.")
                return parsed
    except Exception as e:
        logger.warning(f"Error generating dynamic questions via Gemini: {e}. Falling back to default bank.")

    return get_question_bank_items(role, level, lang, safe_count)

# --- CONTROLLERS ---
class StartInterviewSchema(BaseModel):
    role: str
    level: str
    language: str
    resumeText: Optional[str] = ""
    jobDescriptionText: Optional[str] = ""
    interviewType: Optional[str] = "technical"
    questionCount: int = Field(default=3, ge=1, le=15)

class AnswerSchema(BaseModel):
    questionId: str
    answerText: str

@app.get("/api/question-bank/stats")
def get_question_bank_stats():
    with get_db_cursor() as cursor:
        diagnostics = get_question_bank_diagnostics(cursor)

    return {
        "success": True,
        "stats": diagnostics["questionBank"],
        "schemaVersion": diagnostics["schemaVersion"],
    }

@app.get("/api/question-bank")
def get_question_bank(
    role: Optional[str] = None,
    level: Optional[str] = None,
    category: Optional[str] = None,
    language: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
):
    filters = []
    params = []

    if role:
        filters.append("role = ?")
        params.append(role)
    if level:
        filters.append("level = ?")
        params.append(normalize_level(level))
    if category:
        filters.append("category = ?")
        params.append(category)
    if language:
        filters.append("language = ?")
        params.append(language)
    if search:
        filters.append("(question_text LIKE ? OR ideal_answer LIKE ? OR category LIKE ?)")
        search_pattern = f"%{search.strip()}%"
        params.extend([search_pattern, search_pattern, search_pattern])

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    safe_limit = max(1, min(int(limit or 200), 500))
    safe_offset = max(0, int(offset or 0))
    active_filters = {
        "role": role,
        "level": normalize_level(level) if level else None,
        "category": category,
        "language": language,
        "search": search.strip() if search else None,
    }

    with get_db_cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) AS total FROM question_bank_items {where_clause}", params)
        total = cursor.fetchone()["total"]

        cursor.execute(
            f"""
            SELECT id, language, role, level, category, question_text, ideal_answer
            FROM question_bank_items
            {where_clause}
            ORDER BY language, role, level, category, question_text
            LIMIT ? OFFSET ?
            """,
            (*params, safe_limit, safe_offset)
        )
        questions = [
            {
                "id": row["id"],
                "language": row["language"],
                "role": row["role"],
                "level": row["level"],
                "category": row["category"],
                "questionText": row["question_text"],
                "idealAnswer": row["ideal_answer"],
            }
            for row in cursor.fetchall()
        ]

        cursor.execute(f"SELECT COUNT(DISTINCT role) AS roles FROM question_bank_items {where_clause}", params)
        roles = cursor.fetchone()["roles"]
        cursor.execute(f"SELECT COUNT(DISTINCT category) AS categories FROM question_bank_items {where_clause}", params)
        categories = cursor.fetchone()["categories"]
        cursor.execute("SELECT language, COUNT(*) AS count FROM question_bank_items GROUP BY language ORDER BY language")
        languages = {row["language"]: row["count"] for row in cursor.fetchall()}
        cursor.execute("SELECT COUNT(*) AS total FROM question_bank_items")
        global_total = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(DISTINCT role) AS roles FROM question_bank_items")
        global_roles = cursor.fetchone()["roles"]
        cursor.execute("SELECT COUNT(DISTINCT category) AS categories FROM question_bank_items")
        global_categories = cursor.fetchone()["categories"]

    returned = len(questions)
    has_more = safe_offset + returned < total

    return {
        "success": True,
        "stats": {
            "total": total,
            "roles": roles,
            "categories": categories,
            "languages": languages,
            "limit": safe_limit,
            "offset": safe_offset,
            "returned": returned,
            "page": (safe_offset // safe_limit) + 1,
            "totalPages": max(1, (total + safe_limit - 1) // safe_limit),
            "nextOffset": safe_offset + returned if has_more else None,
            "hasMore": has_more,
            "filters": {key: value for key, value in active_filters.items() if value},
            "global": {
                "total": global_total,
                "roles": global_roles,
                "categories": global_categories,
            },
        },
        "questions": questions,
    }

@app.post("/api/interview/start")
def start_interview(data: StartInterviewSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        deduct_res = http_client.post(
            f"{AUTH_SERVICE_URL}/api/internal/users/{x_user_id}/deduct-credit",
            timeout=5
        )
        if deduct_res.status_code != 200:
            err_data = deduct_res.json()
            raise HTTPException(status_code=deduct_res.status_code, detail=err_data.get("detail", "Deduction failed"))
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Auth service unreachable")

    # Generate questions dynamically if resume or JD is present
    if data.resumeText or data.jobDescriptionText:
        logger.info(f"Generating custom questions for user {x_user_id} based on CV/JD inputs...")
        role_questions = generate_questions_from_resume_jd(
            data.resumeText,
            data.jobDescriptionText,
            data.role,
            data.level,
            data.language,
            data.questionCount
        )
    else:
        role_questions = get_question_bank_items(data.role, data.level, data.language, data.questionCount)
        
    interview_id = str(uuid.uuid4())

    with get_db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO interviews (id, user_id, role, level, language, status) VALUES (?, ?, ?, ?, ?, ?)",
            (interview_id, x_user_id, data.role, data.level, data.language, "IN_PROGRESS")
        )
        for q in role_questions:
            cursor.execute(
                "INSERT INTO questions (id, interview_id, question_text, ideal_answer, score, critique) VALUES (?, ?, ?, ?, NULL, NULL)",
                (str(uuid.uuid4()), interview_id, q["q"], q["ideal"])
            )

    return {
        "success": True,
        "interviewId": interview_id,
        "questions": [{"questionText": q["q"]} for q in role_questions],
    }

@app.post("/api/interview/{interview_id}/answer")
def submit_answer(interview_id: str, data: AnswerSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    corr_id = correlation_id_ctx.get()

    with get_db_cursor() as cursor:
        cursor.execute("SELECT user_id, language FROM interviews WHERE id = ?", (interview_id,))
        interview = cursor.fetchone()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        cursor.execute("SELECT * FROM questions WHERE id = ? AND interview_id = ?", (data.questionId, interview_id))
        question = cursor.fetchone()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        cursor.execute(
            "UPDATE questions SET answer_text = ?, score = -1, critique = 'Processing...' WHERE id = ?",
            (data.answerText, data.questionId)
        )

        grading_queue.put({
            "question_id": data.questionId,
            "answer_text": data.answerText,
            "question_text": question["question_text"],
            "ideal_answer": question["ideal_answer"],
            "language": interview["language"],
            "correlation_id": corr_id
        })

    logger.info(f"Queued background grading for question {data.questionId} in interview {interview_id}")
    return {"success": True, "status": "processing"}

@app.post("/api/interview/{interview_id}/finish")
def finish_interview(interview_id: str, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_db_cursor() as cursor:
        cursor.execute("SELECT user_id, language FROM interviews WHERE id = ?", (interview_id,))
        interview = cursor.fetchone()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        cursor.execute("SELECT score FROM questions WHERE interview_id = ?", (interview_id,))
        rows = cursor.fetchall()
        
        valid_scores = [r["score"] for r in rows if r["score"] is not None and r["score"] != -1]
        avg_score = sum(valid_scores) // len(valid_scores) if valid_scores else 0

        feedback = (
            f"You finished the technical practice with an overall score of {avg_score}%. Review individual scores below."
            if interview["language"] == "en-US" else
            f"Ви завершили практичну співбесіду із загальним балом {avg_score}%. Ознайомтесь із ШІ-коментарями нижче."
        )

        cursor.execute(
            "UPDATE interviews SET status = 'FINISHED', overall_score = ?, feedback = ? WHERE id = ?",
            (avg_score, feedback, interview_id)
        )

    return {"success": True, "overallScore": avg_score, "feedback": feedback}

@app.get("/api/interview/{interview_id}")
def get_interview(interview_id: str, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,))
        interview = cursor.fetchone()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        cursor.execute("SELECT * FROM questions WHERE interview_id = ?", (interview_id,))
        questions_rows = cursor.fetchall()
        
        questions = []
        for q in questions_rows:
            questions.append({
                "id": q["id"],
                "questionText": q["question_text"],
                "answerText": q["answer_text"],
                "score": q["score"],
                "critique": q["critique"],
                "idealAnswer": q["ideal_answer"]
            })

        return {
            "success": True,
            "interview": {
                "id": interview["id"],
                "role": interview["role"],
                "level": interview["level"],
                "language": interview["language"],
                "status": interview["status"],
                "overallScore": interview["overall_score"],
                "feedback": interview["feedback"],
                "createdAt": interview["created_at"],
                "questions": questions
            }
        }

@app.get("/api/interview/history")
def get_history(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at DESC", (x_user_id,))
        interviews_rows = cursor.fetchall()
        
        history = []
        for i in interviews_rows:
            cursor.execute("SELECT * FROM questions WHERE interview_id = ?", (i["id"],))
            questions_rows = cursor.fetchall()
            
            questions = []
            for q in questions_rows:
                questions.append({
                    "id": q["id"],
                    "questionText": q["question_text"],
                    "answerText": q["answer_text"],
                    "score": q["score"],
                    "critique": q["critique"],
                    "idealAnswer": q["ideal_answer"]
                })

            history.append({
                "id": i["id"],
                "role": i["role"],
                "level": i["level"],
                "language": i["language"],
                "status": i["status"],
                "overallScore": i["overall_score"],
                "feedback": i["feedback"],
                "createdAt": i["created_at"],
                "questions": questions
            })

        return {"success": True, "history": history}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3020)
