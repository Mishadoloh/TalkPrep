import os
import sqlite3
import uuid
import logging
import time
import requests
import re
from datetime import datetime
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException, Header, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] (%(name)s) %(message)s")
logger = logging.getLogger("ai-service")

app = FastAPI(
    title="TalkPrep AI Service",
    description="Speech analytics, grading, and mock interview terminal manager.",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "interviews.db")
AUTH_SERVICE_URL = "http://localhost:3010"

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
        logger.info(f"Current AI DB Schema Version: {current_version}")

        # Migration 1: Base Tables
        if current_version < 1:
            logger.info("Applying Migration V1: Base Interview and Question Tables...")
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

        # Migration 2: Audits and Metrics columns
        if current_version < 2:
            logger.info("Applying Migration V2: Add Lexical Speech Metrics Columns...")
            cursor.execute("ALTER TABLE questions ADD COLUMN words_per_minute REAL NULL;")
            cursor.execute("ALTER TABLE questions ADD COLUMN lexical_diversity REAL NULL;")
            cursor.execute("ALTER TABLE questions ADD COLUMN filler_count INTEGER NULL;")
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (2, 'Add lexical metrics columns')")

        logger.info("AI database migrations verified and applied.")

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

# --- AUDIT MIDDLEWARE ---

@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    start_time = time.time()
    method = request.method
    path = request.url.path
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        response.headers["X-Process-Time-Seconds"] = f"{duration:.4f}"
        return response
    except Exception as e:
        logger.error(f"Error serving {method} {path}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Internal Grading Server Error."}
        )

# --- SPEECH ANALYTICS HELPERS ---

def calculate_lexical_diversity(text: str) -> float:
    """Calculates Type-Token Ratio (TTR) to assess vocabulary breadth."""
    words = re.findall(r"\w+", text.lower())
    if not words:
        return 0.0
    unique_words = set(words)
    return round(len(unique_words) / len(words), 3)

def estimate_speaking_rate(text: str, duration_seconds: float = 30.0) -> float:
    """Estimates words spoken per minute (WPM)."""
    words = re.findall(r"\w+", text)
    word_count = len(words)
    if duration_seconds <= 0:
        return 0.0
    return round((word_count / duration_seconds) * 60, 1)

# --- HIGH-FIDELITY INTERVIEW QUESTION BANK ---

MOCK_BANK = {
    "Frontend Engineer": [
        {
            "q": "What is the difference between Virtual DOM and Real DOM in React?",
            "ideal": "Virtual DOM is a lightweight, in-memory representation of the Real DOM. React uses it to batch updates and run a diffing algorithm (reconciliation) before updating the slow Real DOM."
        },
        {
            "q": "Explain closures in JavaScript and how they are used.",
            "ideal": "A closure is the combination of a function bundled together with references to its surrounding state (lexical environment). Closures allow inner functions to access outer scope variables even after the outer function has returned."
        },
        {
            "q": "What are React Server Components and how do they differ from SSR?",
            "ideal": "React Server Components run exclusively on the server, avoiding sending client-side JavaScript payloads. SSR turns React components into HTML on the server but still requires hydration on the client."
        },
        {
            "q": "How does CSS specificity work and how is it calculated?",
            "ideal": "CSS Specificity is a weight applied to a given CSS declaration. It is calculated based on four categories: inline styles, ID selectors, class/attribute/pseudo-class selectors, and element/pseudo-element selectors."
        },
        {
            "q": "What is the event loop in JavaScript and how does it handle microtasks?",
            "ideal": "The event loop manages execution of code, event listeners, and queued tasks. Microtasks (like Promise callbacks) have higher priority than macrotasks (like setTimeout) and are executed completely before the loop moves to the next macrotask."
        }
    ],
    "Backend Engineer": [
        {
            "q": "What is database indexing and how does it speed up queries?",
            "ideal": "Database indexes are data structures (like B-trees) that store pointers to table rows. They speed up SELECT query retrieval speeds by avoiding full table scans, but increase write overhead on INSERT/UPDATE."
        },
        {
            "q": "Explain the difference between SQL and NoSQL databases.",
            "ideal": "SQL databases are relational, structured, table-based, and enforce ACID properties. NoSQL databases are non-relational, document/key-value based, schema-less, and scale horizontally."
        },
        {
            "q": "How does Redis work as a caching layer?",
            "ideal": "Redis is an in-memory key-value database. It caches frequent query results to achieve sub-millisecond retrieval times, reducing database read load."
        },
        {
            "q": "Explain the CAP theorem and its implications in distributed systems.",
            "ideal": "CAP Theorem states that a distributed system can guarantee at most two out of three properties: Consistency (every read gets the latest write), Availability (every request gets a non-error response), and Partition Tolerance (system continues to operate despite network messages drop)."
        },
        {
            "q": "What is connection pooling and why is it important?",
            "ideal": "Connection pooling keeps a cache of database connections open instead of opening and closing a new connection on every request. This reduces connection establishment latency and database resource usage."
        }
    ],
    "DevOps & Infrastructure": [
        {
            "q": "Explain the difference between containers and virtual machines.",
            "ideal": "Containers share the host operating system's kernel and are lightweight, starting in seconds. Virtual machines contain a full guest OS, require a hypervisor, and consume more compute resources."
        },
        {
            "q": "How does Blue-Green deployment differ from Canary deployment?",
            "ideal": "Blue-Green keeps two identical environments active; you route all traffic from blue to green. Canary rolls out the update incrementally to a small subset of users before upgrading the whole fleet."
        },
        {
            "q": "What is GitOps and how does it manage infrastructure?",
            "ideal": "GitOps uses Git repositories as the single source of truth for infrastructure declarations. Agents (like ArgoCD) continuously reconcile the actual state with the git-defined state."
        },
        {
            "q": "Explain the purpose of load balancers and the difference between L4 and L7 balancing.",
            "ideal": "Load balancers distribute traffic across servers. L4 operates at the transport layer routing packets based on IP and port. L7 operates at the application layer routing based on HTTP headers, URLs, and cookies."
        }
    ],
    "Mobile Engineer": [
        {
            "q": "Explain the activity lifecycle in Android.",
            "ideal": "The Android Activity lifecycle consists of key states: onCreate, onStart, onResume (interactive), onPause (partially visible), onStop (hidden), and onDestroy (terminated)."
        },
        {
            "q": "What is the difference between Swift's struct and class?",
            "ideal": "In Swift, struct is a value type (copied on assignment) stored on the stack, while class is a reference type (shared references) stored on the heap and supports inheritance."
        },
        {
            "q": "How does React Native bridge communicate with native modules?",
            "ideal": "React Native communicates asynchronously using a JSON-RPC bridge serialization protocol. Newer versions (JSI) allow direct synchronous execution of native code."
        }
    ],
    "Data Science & Machine Learning": [
        {
            "q": "What is overfitting and how do you prevent it?",
            "ideal": "Overfitting happens when a model learns noise in training data. It is prevented using regularization (L1/L2), cross-validation, dropout layers, early stopping, or expanding the dataset."
        },
        {
            "q": "Explain the difference between supervised and unsupervised learning.",
            "ideal": "Supervised learning trains models on labeled inputs to predict known targets. Unsupervised learning analyzes unlabeled data to uncover hidden structures (like clustering or PCA)."
        },
        {
            "q": "How does the Self-Attention mechanism work in Transformers?",
            "ideal": "Self-attention calculates compatibility scores between words in a sequence using query, key, and value vectors, allowing the model to focus on relevant context words dynamically."
        }
    ],
    "QA & Testing Automation": [
        {
            "q": "What is the difference between Integration Testing and Unit Testing?",
            "ideal": "Unit testing verifies individual isolated functions or classes with mock dependencies. Integration testing verifies that multiple components, databases, and network adapters work together."
        },
        {
            "q": "Explain the Page Object Pattern in Selenium/Playwright.",
            "ideal": "The Page Object Pattern wraps web pages or UI selectors inside a class, separating locator logic from test scripts. This increases reusability and simplifies code maintenance."
        }
    ]
}

# --- GRADING HEURISTICS ---

def calculate_advanced_metrics(answer: str, reference: str, lang: str) -> dict:
    if not answer or len(answer.strip()) < 5:
        return {
            "score": 0,
            "critique": "Spoken answer transcript is too brief to evaluate.",
            "fillers": 0,
            "lexical_diversity": 0.0,
            "wpm": 0.0
        }

    # Count fillers using compiled regexes
    fillers = FILLER_PATTERNS.get(lang, FILLER_PATTERNS["en-US"])
    filler_count = 0
    for pattern in fillers:
        filler_count += len(pattern.findall(answer))
    filler_count += len(re.findall(r"\b[ea]-+h+\b|\b[um]-+m+\b", answer, re.I))

    # Speech metrics
    lexical_div = calculate_lexical_diversity(answer)
    wpm = estimate_speaking_rate(answer, duration_seconds=25.0)

    # Text match metrics
    ref_words = set(re.findall(r"\w+", reference.lower()))
    ans_words = set(re.findall(r"\w+", answer.lower()))
    matches = ref_words.intersection(ans_words)
    match_ratio = len(matches) / max(len(ref_words), 1)
    
    base_score = int(match_ratio * 100)
    
    # Penalize filler habits
    penalty = min(filler_count * 6, 30)
    
    # Reward lexical range
    bonus = 10 if lexical_div > 0.6 else 0
    
    final_score = min(max(base_score - penalty + bonus, 0), 100)

    # Detailed feedback text
    critique = (
        f"Conceptual match is {int(match_ratio*100)}%. "
        f"Vocabulary diversity is {int(lexical_div*100)}%. "
        f"Detected {filler_count} verbal filler sounds. "
        f"Estimated speaking pace: {wpm} WPM."
    ) if lang == "en-US" else (
        f"Концептуальний збіг: {int(match_ratio*100)}%. "
        f"Різноманітність словникового запасу: {int(lexical_div*100)}%. "
        f"Виявлено {filler_count} слів-паразитів. "
        f"Орієнтовний темп мовлення: {wpm} слів/хв."
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
            import json
            parsed = json.loads(clean_json)
            metrics["score"] = int(parsed.get("score", metrics["score"]))
            metrics["critique"] = f"{parsed.get('critique', '')} ({metrics['critique']})"
    except Exception as e:
        logger.warning(f"Failed to query Gemini API, using heuristics: {e}")
        
    return metrics

# --- CONTROLLERS ---

class StartInterviewSchema(BaseModel):
    role: str
    level: str
    language: str

class AnswerSchema(BaseModel):
    questionId: str
    answerText: str

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
            raise HTTPException(
                status_code=deduct_res.status_code,
                detail=err_data.get("detail", "Deduction failed downstream")
            )
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Auth service unreachable")

    # Seed questions based on role
    role_questions = MOCK_BANK.get(data.role, MOCK_BANK["Frontend Engineer"])
    interview_id = str(uuid.uuid4())

    with get_db_cursor() as cursor:
        # Create Interview record
        cursor.execute(
            "INSERT INTO interviews (id, user_id, role, level, language, status) VALUES (?, ?, ?, ?, ?, ?)",
            (interview_id, x_user_id, data.role, data.level, data.language, "IN_PROGRESS")
        )
        
        # Create questions records
        for q in role_questions:
            cursor.execute(
                "INSERT INTO questions (id, interview_id, question_text, ideal_answer, score, critique) VALUES (?, ?, ?, ?, NULL, NULL)",
                (str(uuid.uuid4()), interview_id, q["q"], q["ideal"])
            )

    logger.info(f"Started interview {interview_id} for user {x_user_id}")
    return {"success": True, "interviewId": interview_id}

@app.post("/api/interview/{interview_id}/answer")
def submit_answer(interview_id: str, data: AnswerSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_db_cursor() as cursor:
        # Validate owner
        cursor.execute("SELECT user_id, language FROM interviews WHERE id = ?", (interview_id,))
        interview = cursor.fetchone()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        # Validate question
        cursor.execute("SELECT * FROM questions WHERE id = ? AND interview_id = ?", (data.questionId, interview_id))
        question = cursor.fetchone()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        # Grade response
        metrics = query_gemini_api(
            question["question_text"],
            data.answerText,
            question["ideal_answer"],
            interview["language"]
        )

        cursor.execute(
            """
            UPDATE questions 
            SET answer_text = ?, score = ?, critique = ?, filler_count = ?, lexical_diversity = ?, words_per_minute = ?
            WHERE id = ?
            """,
            (
                data.answerText, 
                metrics["score"], 
                metrics["critique"], 
                metrics["fillers"], 
                metrics["lexical_diversity"], 
                metrics["wpm"], 
                data.questionId
            )
        )

    return {"success": True, "score": metrics["score"], "critique": metrics["critique"]}

@app.post("/api/interview/{interview_id}/finish")
def finish_interview(interview_id: str, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_db_cursor() as cursor:
        # Validate owner
        cursor.execute("SELECT user_id, language FROM interviews WHERE id = ?", (interview_id,))
        interview = cursor.fetchone()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        # Fetch all questions to calculate overall score
        cursor.execute("SELECT score FROM questions WHERE interview_id = ?", (interview_id,))
        rows = cursor.fetchall()
        
        valid_scores = [r["score"] for r in rows if r["score"] is not None]
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

    logger.info(f"Finished interview {interview_id}. Overall score: {avg_score}")
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
                "idealAnswer": q["ideal_answer"],
                "fillerCount": q["filler_count"],
                "lexicalDiversity": q["lexical_diversity"],
                "wordsPerMinute": q["words_per_minute"]
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
                    "idealAnswer": q["ideal_answer"],
                    "fillerCount": q["filler_count"],
                    "lexicalDiversity": q["lexical_diversity"],
                    "wordsPerMinute": q["words_per_minute"]
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
    import json
    uvicorn.run(app, host="0.0.0.0", port=3020)
