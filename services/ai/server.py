import os
import sqlite3
import uuid
import logging
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
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai-service")

app = FastAPI(title="TalkPrep AI Service (Python Optimized)")

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

# Database Context Manager with WAL mode
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
        logger.error(f"AI Database transaction failed, rolled back: {e}")
        raise e
    finally:
        conn.close()

# Safe HTTP client with Exponential Backoff Retries for internal networking
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

def init_db():
    with get_db_cursor() as cursor:
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
        logger.info("AI Database structure validated.")

init_db()

# Global Error Handler
@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"AI Service error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "AI service processing failed."}
    )

# Pydantic schemas
class StartInterviewSchema(BaseModel):
    role: str = Field(..., min_length=2)
    level: str
    language: str

class AnswerSchema(BaseModel):
    questionId: str
    answerText: str

# Local fallback grading calculator
def calculate_local_score(answer: str, reference: str, lang: str) -> tuple[int, str]:
    if not answer or len(answer.strip()) < 5:
        return 0, "No spoken answer provided or answer is too short to evaluate."

    # Multi-language Filler Word Detection
    fillers = FILLER_PATTERNS.get(lang, FILLER_PATTERNS["en-US"])
    filler_count = 0
    for pattern in fillers:
        filler_count += len(pattern.findall(answer))
    
    # Sound fillers
    filler_count += len(re.findall(r"\b[ea]-+h+\b|\b[um]-+m+\b", answer, re.I))

    # Keyword match check
    ref_words = set(re.findall(r"\w+", reference.lower()))
    ans_words = set(re.findall(r"\w+", answer.lower()))
    matches = ref_words.intersection(ans_words)
    
    match_ratio = len(matches) / max(len(ref_words), 1)
    base_score = int(match_ratio * 100)
    
    # Apply verbal filler penalty
    penalty = min(filler_count * 5, 25)
    final_score = max(base_score - penalty, 0)
    
    # Feedback feedback summary
    critique = (
        f"Conceptual coverage: {int(match_ratio*100)}%. "
        f"We detected {filler_count} filler sound(s) ('uh', 'um', 'like', or local language equivalent). "
        f"Deducted {penalty}% as pacing penalty."
    ) if lang == "en-US" else (
        f"Концептуальне охоплення еталону: {int(match_ratio*100)}%. "
        f"Виявлено {filler_count} зайвих слів/звуків-паразитів. "
        f"Знято {penalty}% як штраф за темп мовлення."
    )
    
    return final_score, critique

# Gemini integration helper
def query_gemini_api(question: str, answer: str, ideal: str, lang: str) -> tuple[int, str]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return calculate_local_score(answer, ideal, lang)
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""
    You are a technical interviewer grading candidate answers.
    Language of the interview: {lang}
    Technical Question: "{question}"
    Candidate Spoken Answer: "{answer}"
    Reference Ideal Answer: "{ideal}"

    Perform a strict evaluation. Return only a raw JSON object with this exact schema:
    {{
      "score": <integer from 0 to 100>,
      "critique": "<2-3 sentence technical critique explaining correctness and missing keywords>"
    }}
    Do not add markdown formatting or wrapper tags.
    """
    
    try:
        res = http_client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=8)
        if res.status_code == 200:
            json_data = res.json()
            raw_text = json_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean markdown codeblocks if AI output them
            clean_json = re.sub(r"```json|```", "", raw_text).strip()
            import json
            parsed = json.loads(clean_json)
            return int(parsed.get("score", 70)), str(parsed.get("critique", "Graded by Gemini."))
    except Exception as e:
        logger.warning(f"Failed to query Gemini API, falling back to local: {e}")
        
    return calculate_local_score(answer, ideal, lang)

# Mock bank of questions
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
        }
    ]
}

# --- HTTP ROUTES ---

@app.post("/api/interview/start")
def start_interview(data: StartInterviewSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Call Auth microservice with resilient retry HTTP session to verify & deduct credit
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

        # Grade response using Gemini/local analyzer
        score, critique = query_gemini_api(
            question["question_text"],
            data.answerText,
            question["ideal_answer"],
            interview["language"]
        )

        cursor.execute(
            "UPDATE questions SET answer_text = ?, score = ?, critique = ? WHERE id = ?",
            (data.answerText, score, critique, data.questionId)
        )

    return {"success": True, "score": score, "critique": critique}

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
