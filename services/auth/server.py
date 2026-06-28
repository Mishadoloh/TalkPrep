import os
import sqlite3
import hashlib
import secrets
import uuid
from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="TalkPrep Auth Service (Python)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite setup
DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize DB structure using raw SQL
def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        password_hash TEXT,
        is_pro BOOLEAN DEFAULT 0,
        credits INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()

init_db()

# Password Hashing utility (PBKDF2 SHA512)
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    db_hash = hashlib.pbkdf2_hmac("sha512", password.encode("utf-8"), salt.encode("utf-8"), 1000).hex()
    return f"{salt}:{db_hash}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, db_hash = stored_hash.split(":")
        verify_hash = hashlib.pbkdf2_hmac("sha512", password.encode("utf-8"), salt.encode("utf-8"), 1000).hex()
        return db_hash == verify_hash
    except Exception:
        return False

# Pydantic schemas
class RegisterSchema(BaseModel):
    email: str
    username: str
    password: str

class LoginSchema(BaseModel):
    loginIdentifier: str
    password: str

class UpgradeSchema(BaseModel):
    type: str
    credits: int

class SeedSchema(BaseModel):
    userId: str

# 1. Auth: Register
@app.post("/api/auth/register")
def register(data: RegisterSchema):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Check existing
        cursor.execute("SELECT id FROM users WHERE email = ? OR username = ?", (data.email, data.username))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email or username already registered")

        user_id = str(uuid.uuid4())
        pwd_hash = hash_password(data.password)

        cursor.execute(
            "INSERT INTO users (id, email, username, password_hash, credits) VALUES (?, ?, ?, ?, ?)",
            (user_id, data.email, data.username, pwd_hash, 1)
        )
        conn.commit()

        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": data.email,
                "username": data.username,
                "isPro": False,
                "credits": 1
            }
        }
    finally:
        conn.close()

# 2. Auth: Login
@app.post("/api/auth/login")
def login(data: LoginSchema):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email = ? OR username = ?", (data.loginIdentifier, data.loginIdentifier))
        row = cursor.fetchone()

        if not row or not verify_password(data.password, row["password_hash"]):
            raise HTTPException(status_code=400, detail="Invalid credentials")

        return {
            "success": True,
            "user": {
                "id": row["id"],
                "email": row["email"],
                "username": row["username"],
                "isPro": bool(row["is_pro"]),
                "credits": row["credits"]
            }
        }
    finally:
        conn.close()

# 3. Auth: User Details
@app.get("/api/auth/user/{user_id}")
def get_user(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, email, username, is_pro, credits, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "success": True,
            "user": {
                "id": row["id"],
                "email": row["email"],
                "username": row["username"],
                "isPro": bool(row["is_pro"]),
                "credits": row["credits"],
                "createdAt": row["created_at"]
            }
        }
    finally:
        conn.close()

# 4. Internal: Get credits status
@app.get("/api/internal/users/{user_id}")
def internal_get_user(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, is_pro, credits FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": row["id"],
            "isPro": bool(row["is_pro"]),
            "credits": row["credits"]
        }
    finally:
        conn.close()

# 5. Internal: Deduct credit
@app.post("/api/internal/users/{user_id}/deduct-credit")
def deduct_credit(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT credits FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        credits = row["credits"]
        if credits <= 0:
            raise HTTPException(status_code=402, detail="Insufficient credits")

        new_credits = credits - 1
        cursor.execute("UPDATE users SET credits = ? WHERE id = ?", (new_credits, user_id))
        conn.commit()

        return {"success": True, "credits": new_credits}
    finally:
        conn.close()

# 6. Internal: Upgrade credits/Pro
@app.post("/api/internal/users/{user_id}/upgrade")
def upgrade_user(user_id: str, data: UpgradeSchema):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT credits, is_pro FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        if data.type == "SUBSCRIPTION":
            cursor.execute("UPDATE users SET is_pro = 1 WHERE id = ?", (user_id,))
            is_pro = True
            credits = row["credits"]
        else:
            credits = row["credits"] + data.credits
            cursor.execute("UPDATE users SET credits = ? WHERE id = ?", (credits, user_id))
            is_pro = bool(row["is_pro"])

        conn.commit()
        return {"success": True, "user": {"isPro": is_pro, "credits": credits}}
    finally:
        conn.close()

# 7. Internal: Downgrade subscription
@app.post("/api/internal/users/{user_id}/downgrade")
def downgrade_user(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET is_pro = 0 WHERE id = ?", (user_id,))
        conn.commit()
        
        cursor.execute("SELECT credits, is_pro FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return {"success": True, "user": {"isPro": bool(row["is_pro"]), "credits": row["credits"]}}
    finally:
        conn.close()

# 8. Internal: Developer Seeding
@app.post("/api/internal/dev/seed")
def seed_user(data: SeedSchema):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET is_pro = 1, credits = 6 WHERE id = ?", (data.userId,))
        conn.commit()
        return {"success": True}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3010)
