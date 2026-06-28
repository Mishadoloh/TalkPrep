import os
import sqlite3
import uuid
import requests
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="TalkPrep Billing Service (Python)")

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

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize DB structure using raw SQL
def init_db():
    conn = get_db()
    cursor = conn.cursor()
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
    conn.commit()
    conn.close()

init_db()

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

    conn = get_db()
    cursor = conn.cursor()
    try:
        session_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO transactions (id, user_id, amount, credits, type, status) VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, x_user_id, amount, credits, type_val, "PENDING")
        )
        conn.commit()

        checkout_url = f"/checkout?sessionId={session_id}"
        return {"success": True, "checkoutUrl": checkout_url}
    finally:
        conn.close()

@app.post("/api/billing/webhook")
def confirm_payment(data: WebhookSchema, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (data.sessionId,))
        tx = cursor.fetchone()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        if tx["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        if tx["status"] != "PENDING":
            raise HTTPException(status_code=400, detail="Transaction already processed")

        if data.status == "SUCCESS":
            # Call Auth Service downstream to upgrade profile details
            try:
                upgrade_res = requests.post(
                    f"{AUTH_SERVICE_URL}/api/internal/users/{tx['user_id']}/upgrade",
                    json={"type": tx["type"], "credits": tx["credits"]},
                    timeout=5
                )
                if upgrade_res.status_code != 200:
                    raise HTTPException(status_code=500, detail="Failed to upgrade user downstream in Auth service")
            except Exception:
                raise HTTPException(status_code=502, detail="Auth service unreachable")

            cursor.execute("UPDATE transactions SET status = 'SUCCESS' WHERE id = ?", (data.sessionId,))
            conn.commit()
            return {"success": True, "message": "Payment validated and processed"}
        else:
            cursor.execute("UPDATE transactions SET status = 'FAILED' WHERE id = ?", (data.sessionId,))
            conn.commit()
            return {"success": False, "message": "Payment failed"}
    finally:
        conn.close()

@app.post("/api/billing/cancel")
def cancel_subscription(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Call Auth Service to downgrade user downstream
    try:
        downgrade_res = requests.post(f"{AUTH_SERVICE_URL}/api/internal/users/{x_user_id}/downgrade", timeout=5)
        if downgrade_res.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to cancel subscription downstream")
        auth_data = downgrade_res.json()
        return {"success": True, "user": auth_data["user"]}
    except Exception:
        raise HTTPException(status_code=502, detail="Auth service unreachable")

@app.get("/api/billing/transaction/{tx_id}")
def get_transaction(tx_id: str, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        tx = cursor.fetchone()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        if tx["user_id"] != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        return {"success": True, "transaction": dict(tx)}
    finally:
        conn.close()

@app.post("/api/internal/dev/seed")
def seed_billing(data: SeedSchema):
    conn = get_db()
    cursor = conn.cursor()
    try:
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

        conn.commit()
        return {"success": True}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3030)
