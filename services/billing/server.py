import os
import sqlite3
import uuid
import requests
import logging
import time
from datetime import datetime, timedelta
from contextlib import contextmanager
from fastapi import FastAPI, HTTPException, Header, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
import io
import csv

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] (%(name)s) %(message)s")
logger = logging.getLogger("billing-service")

app = FastAPI(
    title="TalkPrep Billing Service",
    description="Secure checkouts, Stripe webhook receivers, and MRR auditing tools.",
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

DB_PATH = os.path.join(os.path.dirname(__file__), "billing.db")
AUTH_SERVICE_URL = "http://localhost:3010"

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
    logger.info("Initializing Billing database migrations check...")
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
        logger.info(f"Current Billing DB Schema Version: {current_version}")

        # Migration 1: Base Table
        if current_version < 1:
            logger.info("Applying Migration V1: Base Transactions Table...")
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
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (1, 'Create base transactions table')")

        # Migration 2: Audit Indexes
        if current_version < 2:
            logger.info("Applying Migration V2: Add Transactions Search Indexes...")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);")
            cursor.execute("INSERT INTO schema_migrations (version, description) VALUES (2, 'Add user and status indexes')")

        logger.info("Billing database migrations verified and applied.")

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
        response.headers["X-Billing-Process-Seconds"] = f"{duration:.4f}"
        return response
    except Exception as e:
        logger.error(f"Billing request failure: {method} {path} - {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Billing gateway offline."}
        )

# --- VALIDATION SCHEMAS ---

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
    logger.info(f"Checkout generated: {session_id} for user {x_user_id}")
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
            # Upgrade user downstream in Auth service
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
            logger.info(f"Payment success, user {tx['user_id']} credited.")
            return {"success": True, "message": "Payment validated and processed"}
        else:
            cursor.execute("UPDATE transactions SET status = 'FAILED' WHERE id = ?", (data.sessionId,))
            logger.info(f"Payment failed for session: {data.sessionId}")
            return {"success": False, "message": "Payment failed"}

@app.post("/api/billing/cancel")
def cancel_subscription(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        downgrade_res = http_client.post(
            f"{AUTH_SERVICE_URL}/api/internal/users/{x_user_id}/downgrade",
            timeout=5
        )
        if downgrade_res.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to cancel subscription downstream")
        auth_data = downgrade_res.json()
        logger.info(f"Downgraded subscription for user: {x_user_id}")
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

        logger.info(f"Seeded mock billing logs for user: {data.userId}")
        return {"success": True}

# --- BUSINESS METRICS & AUDIT EXPORTS ---

@app.get("/api/internal/admin/metrics")
def get_business_metrics(x_admin_token: str = Header(None)):
    if x_admin_token != "internal-admin-bypass-token":
        raise HTTPException(status_code=403, detail="Forbidden action.")

    with get_db_cursor() as cursor:
        # 1. Total revenue
        cursor.execute("SELECT SUM(amount) as total_rev FROM transactions WHERE status = 'SUCCESS'")
        total_rev = cursor.fetchone()["total_rev"] or 0.0
        
        # 2. Total successful vs failed checkouts
        cursor.execute("SELECT COUNT(id) as success_count FROM transactions WHERE status = 'SUCCESS'")
        success_count = cursor.fetchone()["success_count"] or 0
        
        cursor.execute("SELECT COUNT(id) as failed_count FROM transactions WHERE status = 'FAILED'")
        failed_count = cursor.fetchone()["failed_count"] or 0
        
        # 3. Monthly Recurring Revenue (MRR) - subscriptions
        cursor.execute("SELECT SUM(amount) as mrr FROM transactions WHERE status = 'SUCCESS' AND type = 'SUBSCRIPTION'")
        mrr = cursor.fetchone()["mrr"] or 0.0

        # Calculate rate
        total_attempts = success_count + failed_count
        conversion_rate = round((success_count / total_attempts) * 100, 2) if total_attempts > 0 else 100.0

        return {
            "success": True,
            "metrics": {
                "totalRevenue": total_rev,
                "monthlyRecurringRevenue": mrr,
                "successfulTransactions": success_count,
                "failedTransactions": failed_count,
                "conversionRatePercentage": conversion_rate
            }
        }

@app.get("/api/internal/admin/audit-transactions")
def export_transactions_csv(x_admin_token: str = Header(None)):
    if x_admin_token != "internal-admin-bypass-token":
        raise HTTPException(status_code=403, detail="Forbidden administrative action.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["TransactionID", "UserID", "Amount", "Credits", "Type", "Status", "CreatedAt"])

    with get_db_cursor() as cursor:
        cursor.execute("SELECT id, user_id, amount, credits, type, status, created_at FROM transactions ORDER BY created_at DESC")
        for row in cursor.fetchall():
            writer.writerow([
                row["id"],
                row["user_id"],
                row["amount"],
                row["credits"],
                row["type"],
                row["status"],
                row["created_at"]
            ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=billing_audit_report.csv"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3030)
