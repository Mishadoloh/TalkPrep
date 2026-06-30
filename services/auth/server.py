import os
import sqlite3
import hashlib
import binascii
import logging
import time
from datetime import datetime, timedelta
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException, status, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, EmailStr, Field, validator
import io
import csv

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] (%(name)s) %(message)s")
logger = logging.getLogger("auth-service")

app = FastAPI(
    title="TalkPrep Auth Service",
    description="Enterprise-grade authentication microservice with migrations, audit logs, and brute-force protection.",
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

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

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
    """Initializes and updates database schema sequentially."""
    logger.info("Initializing database migrations check...")
    
    # Create migrations log table first
    with get_db_cursor() as cursor:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        );
        """)
        
        # Check current version
        cursor.execute("SELECT MAX(version) as current_version FROM schema_migrations")
        row = cursor.fetchone()
        current_version = row["current_version"] if row and row["current_version"] is not None else 0
        logger.info(f"Current DB Schema Version: {current_version}")

        # Migration 1: Base Table
        if current_version < 1:
            logger.info("Applying Migration V1: Base User Table...")
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
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (1, 'Create base users table')")

        # Migration 2: Security Lockouts
        if current_version < 2:
            logger.info("Applying Migration V2: Add Brute-Force Lockout Columns...")
            cursor.execute("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;")
            cursor.execute("ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL;")
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (2, 'Add security lockout columns')")

        # Migration 3: Audit Indexes
        if current_version < 3:
            logger.info("Applying Migration V3: Add User Indexes...")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (3, 'Add email search index')")

        logger.info("All migrations verified and applied successfully.")

# Run migrations at startup
run_migrations()

# --- MIDDLEWARE & SECURITY ---

@app.middleware("http")
async def audit_and_performance_middleware(request: Request, call_next):
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    path = request.url.path
    
    logger.info(f"Incoming request: {method} {path} from IP {client_ip}")
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        logger.info(f"Completed request: {method} {path} - Status {response.status_code} in {duration:.4f}s")
        response.headers["X-Response-Time-Seconds"] = f"{duration:.4f}"
        return response
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"Failed request: {method} {path} - Error: {e} in {duration:.4f}s", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Internal authentication subsystem failure."}
        )

# --- VALIDATION SCHEMAS ---

class RegisterSchema(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6)

    @validator("password")
    def validate_password_strength(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        return v

    @validator("username")
    def validate_username_chars(cls, v):
        if not re.match(r"^[a-zA-Z0-9_\sа-яА-ЯёЁіІїЇєЄґҐ'-]+$", v):
            raise ValueError("Username contains illegal characters.")
        return v

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class CreditUpdateSchema(BaseModel):
    type: str
    credits: int

# --- CRYPTO HELPERS ---

def hash_password(password: str, salt: bytes = None) -> tuple[str, str]:
    if salt is None:
        salt = os.urandom(32)
    pwd_hash = hashlib.pbkdf2_hmac("sha512", password.encode("utf-8"), salt, 100000)
    return binascii.hexlify(pwd_hash).decode("utf-8"), binascii.hexlify(salt).decode("utf-8")

def verify_password(password: str, salt_hex: str, hash_hex: str) -> bool:
    salt = binascii.unhexlify(salt_hex)
    computed_hash, _ = hash_password(password, salt)
    return computed_hash == hash_hex

# --- CONTROLLERS ---

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
            """
            INSERT INTO users (id, email, username, password_hash, password_salt, is_pro, credits, failed_login_attempts, locked_until)
            VALUES (?, ?, ?, ?, ?, 0, 1, 0, NULL)
            """,
            (user_id, email_clean, data.username, pwd_hash, pwd_salt)
        )
        
        logger.info(f"Registered user: {user_id}")
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

        # Check Account Lockout State
        now = datetime.now()
        if user["locked_until"]:
            locked_until_dt = datetime.fromisoformat(user["locked_until"])
            if now < locked_until_dt:
                minutes_left = int((locked_until_dt - now).total_seconds() / 60) + 1
                logger.warning(f"Prevented login attempt on locked account: {email_clean}")
                raise HTTPException(
                    status_code=423,
                    detail=f"This account is temporarily locked due to failed attempts. Try again in {minutes_left} minute(s)."
                )
            else:
                # Lockout expired, reset attempts
                cursor.execute("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?", (user["id"],))

        # Check Password validity
        if not verify_password(data.password, user["password_salt"], user["password_hash"]):
            failed_attempts = user["failed_login_attempts"] + 1
            if failed_attempts >= MAX_LOGIN_ATTEMPTS:
                lock_time = (now + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
                cursor.execute(
                    "UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?",
                    (failed_attempts, lock_time, user["id"])
                )
                logger.warning(f"Account locked due to brute-force protection: {email_clean}")
                raise HTTPException(
                    status_code=423,
                    detail=f"Incorrect password. Max attempts reached. Account locked for {LOCKOUT_MINUTES} minutes."
                )
            else:
                cursor.execute(
                    "UPDATE users SET failed_login_attempts = ? WHERE id = ?",
                    (failed_attempts, user["id"])
                )
                attempts_left = MAX_LOGIN_ATTEMPTS - failed_attempts
                raise HTTPException(
                    status_code=401,
                    detail=f"Incorrect password. {attempts_left} attempt(s) remaining."
                )

        # Successful Login
        cursor.execute("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?", (user["id"],))
        logger.info(f"Successful login for user: {user['id']}")

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

# --- ADMINISTRATIVE AUDIT SERVICES ---

@app.get("/api/internal/admin/audit-users")
def export_users_audit(x_admin_token: str = Header(None)):
    # Simulated internal secure token verification
    if x_admin_token != "internal-admin-bypass-token":
        raise HTTPException(status_code=403, detail="Forbidden administrative action.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["UserID", "Email", "Username", "IsProStatus", "RemainingCredits", "RegistrationDate"])

    with get_db_cursor() as cursor:
        cursor.execute("SELECT id, email, username, is_pro, credits, created_at FROM users")
        for row in cursor.fetchall():
            writer.writerow([
                row["id"],
                row["email"],
                row["username"],
                "PRO" if row["is_pro"] else "FREE",
                row["credits"],
                row["created_at"]
            ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_audit_report.csv"}
    )

if __name__ == "__main__":
    import uvicorn
    import re
    uvicorn.run(app, host="0.0.0.0", port=3010)
