import os
import sqlite3
import uuid
import requests
import logging
from datetime import datetime, timedelta
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException, Header, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("billing-service")

app = FastAPI(title="TalkPrep Billing Service (Python Optimized)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "billing.db")
AUTH_SERVICE_URL = "http://localhost:3010"

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
        logger.error(f"Billing database transaction failed, rolled back: {e}")
        raise e
    finally:
        conn.close()

# Safe HTTP Client Adapter for downstream connection
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
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            amount REAL,
            credits INTEGER,
            type TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        logger.info("Billing Database structure validated.")

init_db()

# Global Error Handler
@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Billing Service error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Billing transaction could not be processed."}
    )

# Pydantic schemas
class CheckoutSchema(BaseModel):
    packType: str

class WebhookSchema(BaseModel):
    sessionId: str
    status: str

class SeedSchema(BaseModel):
    userId: str

# --- HTTP ROUTES ---

@app.post("/api/billing/checkout")
def initiate_checkout(data: CheckoutSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if data.packType not in ["5_CREDITS", "PRO_MONTHLY"]:
        raise HTTPException(status_code=400, detail="Invalid package type")

    amount = 15.0 if data.packType == "5_CREDITS" else 29.0
    credits = 5 if data.packType == "5_CREDITS" else 9999
    type_val = "PACK" if data.packType == "5_CREDITS" else "SUBSCRIPTION"

    session_id = str(uuid.uuid4())
    
    with get_db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO transactions (id, user_id, amount, credits, type, status) VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, x_user_id, amount, credits, type_val, "PENDING")
        )

    checkout_url = f"/checkout?sessionId={session_id}"
    logger.info(f"Checkout initiated: {session_id} for user {x_user_id}")
    return {"success": True, "checkoutUrl": checkout_url}

@app.post("/api/billing/webhook")
def confirm_payment(data: WebhookSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (data.sessionId,))
        tx = cursor.fetchone()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        if tx["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        if tx["status"] != "PENDING":
            raise HTTPException(status_code=400, detail="Transaction already processed")

        if data.status == "SUCCESS":
            # Call Auth Service downstream using our resilient HTTP client session
            try:
                upgrade_res = http_client.post(
                    f"{AUTH_SERVICE_URL}/api/internal/users/{tx['user_id']}/upgrade",
                    json={"type": tx["type"], "credits": tx["credits"]},
                    timeout=5
                )
                if upgrade_res.status_code != 200:
                    raise HTTPException(status_code=500, detail="Failed to upgrade user downstream in Auth service")
            except requests.exceptions.RequestException:
                raise HTTPException(status_code=502, detail="Auth service unreachable")

            cursor.execute("UPDATE transactions SET status = 'SUCCESS' WHERE id = ?", (data.sessionId,))
            logger.info(f"Payment successful, upgraded user {tx['user_id']} for session {data.sessionId}")
            return {"success": True, "message": "Payment validated and processed"}
        else:
            cursor.execute("UPDATE transactions SET status = 'FAILED' WHERE id = ?", (data.sessionId,))
            logger.info(f"Payment failed for session {data.sessionId}")
            return {"success": False, "message": "Payment failed"}

@app.post("/api/billing/cancel")
def cancel_subscription(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Call Auth Service to downgrade user downstream
    try:
        downgrade_res = http_client.post(
            f"{AUTH_SERVICE_URL}/api/internal/users/{x_user_id}/downgrade",
            timeout=5
        )
        if downgrade_res.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to cancel subscription downstream")
        auth_data = downgrade_res.json()
        logger.info(f"Cancelled subscription for user: {x_user_id}")
        return {"success": True, "user": auth_data["user"]}
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Auth service unreachable")

@app.get("/api/billing/transaction/{tx_id}")
def get_transaction(tx_id: str, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        tx = cursor.fetchone()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        if tx["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        return {"success": True, "transaction": dict(tx)}

@app.post("/api/internal/dev/seed")
def seed_billing(data: SeedSchema):
    with get_db_cursor() as cursor:
        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (data.userId,))
        
        now = datetime.now()
        three_days_ago = (now - timedelta(days=3)).isoformat()
        two_days_ago = (now - timedelta(days=2)).isoformat()
        one_day_ago = (now - timedelta(days=1)).isoformat()

        # Seed mock payment logs
        cursor.execute(
            "INSERT INTO transactions (id, user_id, amount, credits, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), data.userId, 0.0, 1, "FREE", "SUCCESS", three_days_ago)
        )
        cursor.execute(
            "INSERT INTO transactions (id, user_id, amount, credits, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), data.userId, 15.0, 5, "PACK", "SUCCESS", two_days_ago)
        )
        cursor.execute(
            "INSERT INTO transactions (id, user_id, amount, credits, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), data.userId, 29.0, 9999, "SUBSCRIPTION", "SUCCESS", one_day_ago)
        )

        logger.info(f"Seeded payment transactions for user: {data.userId}")
        return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3030)
