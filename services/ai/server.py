import os
import sqlite3
import uuid
import json
import requests
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="TalkPrep AI & Grading Service (Python)")

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
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize DB structure using raw SQL
def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        role TEXT,
        level TEXT,
        status TEXT,
        language TEXT DEFAULT 'en-US',
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
        FOREIGN KEY(interview_id) REFERENCES interviews(id) ON DELETE CASCADE
    );
    """)
    conn.commit()
    conn.close()

init_db()

# --- 1. LOCAL DATA & FALLBACK SCANNERS ---

QUESTION_BANK = {
  "Frontend Engineer": {
    "Junior": [
      {
        "questionText": "What is the difference between let, const, and var in JavaScript?",
        "idealAnswer": "var is function-scoped, can be redeclared, and is hoisted with undefined. let and const are block-scoped, cannot be redeclared in the same scope, and are not initialized during hoisting (Temporal Dead Zone). const variables must be initialized and cannot be reassigned."
      },
      {
        "questionText": "Explain the difference between state and props in React.",
        "idealAnswer": "Props are read-only configuration parameters passed down from a parent component. State is a private, mutable data structure managed internally within a component that triggers a re-render when updated."
      },
      {
        "questionText": "What is the Virtual DOM and how does React use it to render pages?",
        "idealAnswer": "The Virtual DOM is a lightweight JavaScript representation of the real DOM. React updates this virtual tree, compares it with the previous snapshot (diffing), and makes minimal modifications to the real DOM."
      }
    ],
    "Mid": [
      {
        "questionText": "What is a closure in JavaScript and can you give a common use case?",
        "idealAnswer": "A closure is the combination of a function bundled together with references to its surrounding state (lexical environment), allowing access to variables from an outer function scope even after it returned."
      },
      {
        "questionText": "How does React's useEffect hook work, and how do you clean up side effects?",
        "idealAnswer": "useEffect runs side effects after renders. Returning a function from the effect serving as the cleanup callback, running before unmount or subsequent runs."
      }
    ],
    "Senior": [
      {
        "questionText": "How would you optimize a slow React application that suffers from excessive re-renders?",
        "idealAnswer": "Profile using React DevTools. Memoize with React.memo, useMemo, and useCallback. Implement virtualized lists. Colocate states, debounce inputs, and lazy load dynamic imports."
      }
    ]
  },
  "Backend Engineer": {
    "Junior": [
      {
        "questionText": "What is the difference between GET and POST HTTP requests?",
        "idealAnswer": "GET retrieves data, appends parameters in URL query, is idempotent. POST sends data in body to create resources, is not idempotent."
      }
    ]
  }
}

def get_random_questions(role, level, count=3):
    role_bank = QUESTION_BANK.get(role, QUESTION_BANK["Frontend Engineer"])
    level_bank = role_bank.get(level, role_bank.get("Mid", role_bank.get("Junior")))
    import random
    shuffled = list(level_bank)
    random.shuffle(shuffled)
    return shuffled[:count]

KEYWORD_MAP = {
  "let, const, and var": ["scope", "block", "hoist", "reassign", "redeclare", "temporal dead zone", "tdz"],
  "state and props": ["read-only", "prop", "state", "mutable", "parent", "internal", "render"],
  "virtual dom": ["lightweight", "diff", "reconciliation", "real dom", "update", "render"],
  "closure": ["closure", "lexical", "scope", "inner", "outer", "privacy", "encapsulate"],
  "useeffect": ["effect", "side effect", "dependency", "mount", "unmount", "cleanup"]
}

def grade_answer_offline(user_answer, ideal_answer, question_text):
    answer = user_answer.strip()
    if not answer or answer == "No response provided.":
        return {"score": 0, "critique": "No response was recorded. Please speak clearly into the microphone.", "wordCount": 0, "fillersCount": 0}

    words = answer.split()
    word_count = len(words)

    fillers = ["uh", "um", "like", "you know", "ah"]
    fillers_count = 0
    for w in words:
        clean_word = "".join(filter(str.isalpha, w.lower()))
        if clean_word in fillers:
            fillers_count += 1

    lowercase_answer = answer.lower()
    lowercase_question = question_text.lower()
    
    matching_keywords = []
    for topic, keywords in KEYWORD_MAP.items():
        if topic.lower() in lowercase_question:
            matching_keywords = keywords
            break

    if not matching_keywords:
        matching_keywords = list(set([w.lower().replace(",", "").replace(".", "") for w in ideal_answer.split() if len(w) > 5]))[:5]

    matched = 0
    for k in matching_keywords:
        if k in lowercase_answer:
            matched += 1

    keyword_score = (matched / len(matching_keywords)) * 100 if matching_keywords else 50
    length_multiplier = 0.3 if word_count < 15 else 0.7 if word_count < 30 else 1.0
    filler_rate = fillers_count / word_count if word_count > 0 else 0
    penalty = 10 if filler_rate > 0.1 else 5 if filler_rate > 0.05 else 0

    score = round(keyword_score * length_multiplier - penalty)
    score = max(0, min(100, score))

    critique = f"Graded response: {score}/100. "
    if score >= 80:
        critique += f"Excellent job! You covered key concepts clearly with minimal filler words ({fillers_count})."
    elif score >= 60:
        critique += "Decent answer. To improve, cover the concepts more thoroughly and try to reduce filler words."
    else:
        critique += "Too short or missing key conceptual keywords. Study the ideal answer reference and try again."

    return {"score": score, "critique": critique, "wordCount": word_count, "fillersCount": fillers_count}

LANGUAGES = {
  "en-US": "English",
  "uk-UA": "Ukrainian",
  "es-ES": "Spanish",
  "de-DE": "German",
  "fr-FR": "French",
  "it-IT": "Italian",
  "pt-PT": "Portuguese",
  "pl-PL": "Polish",
  "tr-TR": "Turkish",
  "ja-JP": "Japanese",
  "zh-CN": "Chinese Mandarin",
  "ko-KR": "Korean",
  "nl-NL": "Dutch",
  "sv-SE": "Swedish",
  "ar-SA": "Arabic"
}

# --- 2. AI CLIENT FUNCTIONS ---

def call_gemini(prompt: str) -> Optional[str]:
    if not GEMINI_API_KEY:
        return None
    try:
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        res = requests.post(GEMINI_API_URL, headers={"Content-Type": "application/json"}, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        return None
    except Exception:
        return None

def generate_dynamic_questions_ai(role: str, level: str, language_name: str) -> Optional[List[dict]]:
    prompt = f"""You are a professional technical recruiter.
Generate exactly 3 challenging technical interview questions for a candidate interviewing for the role of '{role}' at experience level '{level}'.
The questions should test core concepts, systems design, and hands-on practices.

CRITICAL: You MUST write the "questionText" and "idealAnswer" values entirely in the language '{language_name}'.

Return a JSON array containing objects with exactly these keys:
[
  {{
    "questionText": "the interview question string in {language_name}",
    "idealAnswer": "a detailed reference response explaining all critical technical concepts in {language_name}"
  }}
]"""
    text = call_gemini(prompt)
    if not text:
        return None
    try:
        return json.loads(text.strip())
    except Exception:
        return None

def grade_answer_with_ai(question_text: str, ideal_answer: str, user_answer: str, language_name: str) -> Optional[dict]:
    prompt = f"""You are a senior engineering manager conducting a technical interview.
Grade the candidate's spoken response to the technical question.
Compare their answer to the ideal answer, taking into account keyword coverage, conceptual correctness, and structural clarity.

Context:
- Question Asked: "{question_text}"
- Ideal Answer Key: "{ideal_answer}"
- Candidate Spoken Response: "{user_answer}"

CRITICAL: You MUST write the qualitative feedback "critique" entirely in the language '{language_name}'.

Return a JSON object containing exactly these keys:
{{
  "score": <number from 0 to 100>,
  "critique": "detailed feedback written in {language_name} highlighting what they did well, what keywords they missed, and advice to restructure"
}}"""
    text = call_gemini(prompt)
    if not text:
        return None
    try:
        return json.loads(text.strip())
    except Exception:
        return None

# --- 3. PYDANTIC SCHEMAS ---

class StartInterviewSchema(BaseModel):
    role: str
    level: str
    language: Optional[str] = "en-US"

class SubmitAnswerSchema(BaseModel):
    questionId: str
    answerText: str

class SeedSchema(BaseModel):
    userId: str

# --- 4. HTTP ROUTES ---

@app.post("/api/interview/start")
def start_interview(data: StartInterviewSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Call Auth Microservice to verify and deduct credits
    try:
        auth_res = requests.get(f"{AUTH_SERVICE_URL}/api/internal/users/{x_user_id}", timeout=5)
        if auth_res.status_code != 200:
            raise HTTPException(status_code=404, detail="User profile verification failed downstream")
        user_profile = auth_res.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Auth service unreachable")

    if not user_profile["isPro"] and user_profile["credits"] <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Generate questions
    lang_name = LANGUAGES.get(data.language, "English")
    questions = generate_dynamic_questions_ai(data.role, data.level, lang_name)
    if not questions:
        print("Fallback local questions used.")
        questions = get_random_questions(data.role, data.level, 3)

    # Deduct credit if not Pro
    if not user_profile["isPro"]:
        try:
            deduct_res = requests.post(f"{AUTH_SERVICE_URL}/api/internal/users/{x_user_id}/deduct-credit", timeout=5)
            if deduct_res.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to deduct credit downstream")
        except Exception:
            raise HTTPException(status_code=502, detail="Auth service unreachable")

    # Create interview record in interviews.db
    conn = get_db()
    cursor = conn.cursor()
    try:
        interview_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO interviews (id, user_id, role, level, status, language) VALUES (?, ?, ?, ?, ?, ?)",
            (interview_id, x_user_id, data.role, data.level, "IN_PROGRESS", data.language)
        )
        
        saved_questions = []
        for q in questions:
            qid = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO questions (id, interview_id, question_text, ideal_answer) VALUES (?, ?, ?, ?)",
                (qid, interview_id, q["questionText"], q["idealAnswer"])
            )
            saved_questions.append({"id": qid, "questionText": q["questionText"]})
        
        conn.commit()
        return {
            "success": True,
            "interviewId": interview_id,
            "role": data.role,
            "level": data.level,
            "questions": saved_questions
        }
    finally:
        conn.close()

@app.post("/api/interview/{interview_id}/answer")
def submit_answer(interview_id: str, data: SubmitAnswerSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,))
        interview = cursor.fetchone()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview session not found")
        if interview["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        cursor.execute("SELECT * FROM questions WHERE id = ? AND interview_id = ?", (data.questionId, interview_id))
        question = cursor.fetchone()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        offline = grade_answer_offline(data.answerText, question["ideal_answer"], question["question_text"])
        lang_name = LANGUAGES.get(interview["language"], "English")
        
        score = offline["score"]
        critique = offline["critique"]

        ai_eval = grade_answer_with_ai(question["question_text"], question["ideal_answer"], data.answerText, lang_name)
        if ai_eval:
            score = ai_eval["score"]
            critique = ai_eval["critique"]

        cursor.execute(
            "UPDATE questions SET answer_text = ?, score = ?, critique = ? WHERE id = ?",
            (data.answerText, score, critique, data.questionId)
        )
        conn.commit()

        return {
            "success": True,
            "questionId": data.questionId,
            "score": score,
            "critique": critique,
            "wordCount": offline["wordCount"],
            "fillersCount": offline["fillersCount"]
        }
    finally:
        conn.close()

@app.post("/api/interview/{interview_id}/finish")
def finish_interview(interview_id: str, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,))
        interview = cursor.fetchone()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview session not found")
        if interview["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        cursor.execute("SELECT score FROM questions WHERE interview_id = ?", (interview_id,))
        rows = cursor.fetchall()
        
        scores = [r["score"] for r in rows if r["score"] is not None]
        overall_score = round(sum(scores) / len(scores)) if scores else 0
        is_ukrainian = interview["language"] == "uk-UA"

        if overall_score >= 85:
            feedback = (
                "Чудовий результат! Ви впевнено володієте технічною термінологією, детально пояснюєте процеси та структуруєте думки."
                if is_ukrainian else "Excellent performance! You demonstrate a strong grasp of technical concepts and articulate them clearly."
            )
        elif overall_score >= 70:
            feedback = (
                "Хороший результат. Ви знаєте базу, але деякі відповіді можна зробити більш структурованими та навести приклади."
                if is_ukrainian else "Solid technical foundation. You clearly understand core systems, though explanations could be more precise."
            )
        else:
            feedback = (
                "Рекомендуємо більше практики. Прогляньте еталонні відповіді та спробуйте давати ширші пояснення."
                if is_ukrainian else "Further practice recommended. Focus on active recall and expanding your answers to cover critical concepts."
            )

        cursor.execute(
            "UPDATE interviews SET status = 'COMPLETED', overall_score = ?, feedback = ? WHERE id = ?",
            (overall_score, feedback, interview_id)
        )
        conn.commit()

        # Fetch full updated interview
        cursor.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,))
        updated_interview = cursor.fetchone()
        cursor.execute("SELECT * FROM questions WHERE interview_id = ?", (interview_id,))
        questions = cursor.fetchall()

        return {
            "success": True,
            "interview": {
                "id": updated_interview["id"],
                "role": updated_interview["role"],
                "level": updated_interview["level"],
                "status": updated_interview["status"],
                "overallScore": updated_interview["overall_score"],
                "feedback": updated_interview["feedback"],
                "questions": [dict(q) for q in questions]
            }
        }
    finally:
        conn.close()

@app.get("/api/interview/history")
def get_history(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at DESC", (x_user_id,))
        rows = cursor.fetchall()
        
        history = []
        for r in rows:
            cursor.execute("SELECT * FROM questions WHERE interview_id = ?", (r["id"],))
            questions = cursor.fetchall()
            
            interview_dict = {
                "id": r["id"],
                "role": r["role"],
                "level": r["level"],
                "status": r["status"],
                "language": r["language"],
                "overallScore": r["overall_score"],
                "feedback": r["feedback"],
                "createdAt": r["created_at"],
                "questions": [dict(q) for q in questions]
            }
            history.append(interview_dict)

        return {"success": True, "interviews": history}
    finally:
        conn.close()

@app.get("/api/interview/{interview_id}")
def get_interview(interview_id: str, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Interview not found")
        if row["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        cursor.execute("SELECT * FROM questions WHERE interview_id = ?", (interview_id,))
        questions = cursor.fetchall()

        return {
            "success": True,
            "interview": {
                "id": row["id"],
                "role": row["role"],
                "level": row["level"],
                "status": row["status"],
                "language": row["language"],
                "overallScore": row["overall_score"],
                "feedback": row["feedback"],
                "createdAt": row["created_at"],
                "questions": [
                    {
                        "id": q["id"],
                        "questionText": q["question_text"],
                        "answerText": q["answer_text"],
                        "score": q["score"],
                        "critique": q["critique"],
                        "idealAnswer": q["ideal_answer"]
                    }
                    for q in questions
                ]
            }
        }
    finally:
        conn.close()

@app.post("/api/internal/dev/seed")
def seed_interviews(data: SeedSchema):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM interviews WHERE user_id = ?", (data.userId,))
        
        now = datetime.now()
        two_days_ago = (now - timedelta(days=2)).isoformat()
        one_day_ago = (now - timedelta(days=1)).isoformat()

        # Seed Interview 1
        int1_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO interviews (id, user_id, role, level, status, overall_score, feedback, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (int1_id, data.userId, "Frontend Engineer", "Mid", "COMPLETED", 78, "Solid React developer skillset. Strong conceptual awareness of React DOM rendering and block bindings.", two_days_ago)
        )
        
        cursor.execute(
            "INSERT INTO questions (id, interview_id, question_text, answer_text, score, critique, ideal_answer) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), int1_id, "What is the Virtual DOM and how does React use it to render pages?", 
             "Virtual DOM is a copy of real DOM in memory. When state changes, react compares the virtual tree with old one, this is called diffing, and then updates only changed nodes in real dom.",
             82, "Excellent response! You explained the concept clearly, covering the diffing phase and reconciliation.",
             "The Virtual DOM is a lightweight JavaScript representation of the real DOM. When state changes, React updates this virtual tree, compares it with the previous snapshot (diffing algorithm), and bats updates to make minimal modifications to the real DOM (reconciliation).")
        )
        cursor.execute(
            "INSERT INTO questions (id, interview_id, question_text, answer_text, score, critique, ideal_answer) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), int1_id, "Explain the difference between state and props in React.",
             "Props are parameters passed to component. State is internal data that component can change. Props are read only, state is mutable.",
             74, "Good solid answer. You hit the main points but could be slightly more structured. To improve, you could explicitly mention that state updates trigger component re-renders.",
             "Props are read-only configuration parameters passed down from a parent component, making components reusable. State is a private, mutable data structure managed internally within a component that triggers a re-render when updated via state setters.")
        )

        # Seed Interview 2
        int2_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO interviews (id, user_id, role, level, status, overall_score, feedback, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (int2_id, data.userId, "Backend Engineer", "Senior", "COMPLETED", 88, "Excellent performance! Demonstrates clear senior-level understanding of database indices, write trade-offs, and security mitigation for JSON Web Tokens.", one_day_ago)
        )
        
        cursor.execute(
            "INSERT INTO questions (id, interview_id, question_text, answer_text, score, critique, ideal_answer) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), int2_id, "Explain the concept of database indexing and its trade-offs.",
             "Index makes reads faster. It uses B-Tree data structures. The trade-off is writes get slower because index has to be updated on inserts, and it uses more disk space.",
             92, "Excellent response! You explained the concepts clearly, covering key technical requirements (B-Tree, read acceleration vs write cost).",
             "An index is a data structure (like a B-Tree) that improves data retrieval speed on specific columns in a database table. The trade-off is that indexes consume additional storage space and slow down write operations (INSERT, UPDATE, DELETE) because the index must be updated.")
        )

        conn.commit()
        return {"success": True}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3020)
