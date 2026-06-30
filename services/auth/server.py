import os
import sqlite3
import hashlib
import binascii
import logging
from datetime import datetime
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("auth-service")

app = FastAPI(title="TalkPrep Auth Service (Python Optimized)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

# Database Context Manager with WAL mode enabled
@contextmanager
def get_db_cursor():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for concurrent write operations
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction error, rolled back: {e}")
        raise e
    finally:
        conn.close()

def init_db():
    with get_db_cursor() as cursor:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            username TEXT,
            password_hash TEXT,
            password_salt TEXT,
            is_pro INTEGER DEFAULT 0,
            credits INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        logger.info("Auth Database structure validated.")

init_db()

# Global Error Handler
@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error. Please try again later."}
    )

# Pydantic schemas
class RegisterSchema(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=2)
    password: str = Field(..., min_length=6)

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class CreditUpdateSchema(BaseModel):
    type: str
    credits: int

# Security Helpers using PBKDF2 SHA512
def hash_password(password: str, salt: bytes = None) -> tuple[str, str]:
    if salt is None:
        salt = os.urandom(32)
    pwd_hash = hashlib.pbkdf2_hmac("sha512", password.encode("utf-8"), salt, 100000)
    return binascii.hexlify(pwd_hash).decode("utf-8"), binascii.hexlify(salt).decode("utf-8")

def verify_password(password: str, salt_hex: str, hash_hex: str) -> bool:
    salt = binascii.unhexlify(salt_hex)
    computed_hash, _ = hash_password(password, salt)
    return computed_hash == hash_hex

# --- HTTP ROUTES ---

@app.post("/api/auth/register")
def register(data: RegisterSchema):
    email_clean = data.email.lower().strip()
    
    with get_db_cursor() as cursor:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email is already registered")

        user_id = str(hashlib.md5(email_clean.encode()).hexdigest()) + f"-{os.urandom(4).hex()}"
        pwd_hash, pwd_salt = hash_password(data.password)

        cursor.execute(
            "INSERT INTO users (id, email, username, password_hash, password_salt, is_pro, credits) VALUES (?, ?, ?, ?, ?, 0, 1)",
            (user_id, email_clean, data.username, pwd_hash, pwd_salt)
        )
        
        logger.info(f"Registered new candidate: {user_id}")
        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": email_clean,
                "username": data.username,
                "isPro": False,
                "credits": 1
            }
        }

@app.post("/api/auth/login")
def login(data: LoginSchema):
    email_clean = data.email.lower().strip()

    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not verify_password(data.password, user["password_salt"], user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {
            "success": True,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
                "isPro": bool(user["is_pro"]),
                "credits": user["credits"]
            }
        }

@app.get("/api/internal/users/{user_id}")
def get_user_profile(user_id: str):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "success": True,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
                "isPro": bool(user["is_pro"]),
                "credits": user["credits"]
            }
        }

@app.post("/api/internal/users/{user_id}/deduct-credit")
def deduct_credit(user_id: str):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user["is_pro"]:
            return {
                "success": True,
                "user": {
                    "id": user["id"],
                    "isPro": True,
                    "credits": user["credits"]
                }
            }

        if user["credits"] <= 0:
            raise HTTPException(status_code=402, detail="Insufficient credits")

        new_credits = user["credits"] - 1
        cursor.execute("UPDATE users SET credits = ? WHERE id = ?", (new_credits, user_id))
        logger.info(f"Deducted credit from user: {user_id}. Remaining: {new_credits}")
        
        return {
            "success": True,
            "user": {
                "id": user["id"],
                "isPro": False,
                "credits": new_credits
            }
        }

@app.post("/api/internal/users/{user_id}/upgrade")
def upgrade_user(user_id: str, data: CreditUpdateSchema):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        is_pro = 1 if data.type == "SUBSCRIPTION" else user["is_pro"]
        credits_increment = data.credits if data.type == "PACK" else 0
        new_credits = user["credits"] + credits_increment

        cursor.execute(
            "UPDATE users SET is_pro = ?, credits = ? WHERE id = ?",
            (is_pro, new_credits, user_id)
        )
        logger.info(f"Upgraded user {user_id}: Pro={is_pro}, Credits={new_credits}")

        return {
            "success": True,
            "user": {
                "id": user_id,
                "isPro": bool(is_pro),
                "credits": new_credits
            }
        }

@app.post("/api/internal/users/{user_id}/downgrade")
def downgrade_user(user_id: str):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        cursor.execute("UPDATE users SET is_pro = 0 WHERE id = ?", (user_id,))
        logger.info(f"Downgraded subscription for user: {user_id}")

        return {
            "success": True,
            "user": {
                "id": user_id,
                "isPro": False,
                "credits": user["credits"]
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3010)
