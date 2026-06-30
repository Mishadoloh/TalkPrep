const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("./generated/client");

const app = express();
const PORT = 3030;
const prisma = new PrismaClient();
const AUTH_SERVICE_URL = "http://localhost:3010";

app.use(cors());
app.use(express.json());

// 1. Initiate Checkout
app.post("/api/billing/checkout", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { packType } = req.body;
    if (!packType || (packType !== "5_CREDITS" && packType !== "PRO_MONTHLY")) {
      return res.status(400).json({ error: "Invalid package type" });
    }

    let amount = 0;
    let credits = 0;
    let type = "";

    if (packType === "5_CREDITS") {
      amount = 15.0;
      credits = 5;
      type = "PACK";
    } else {
      amount = 29.0;
      credits = 9999;
      type = "SUBSCRIPTION";
    }

    // Save pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        credits,
        type,
        status: "PENDING"
      }
    });

    const checkoutUrl = `/checkout?sessionId=${transaction.id}`;
    res.json({ success: true, checkoutUrl });
  } catch (error) {
    console.error("Billing service checkout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Webhook: Confirm payment
app.post("/api/billing/webhook", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { sessionId, status } = req.body;

    if (!sessionId || !status) {
      return res.status(400).json({ error: "Missing sessionId or status" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: sessionId }
    });

    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    if (transaction.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    if (transaction.status !== "PENDING") {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    if (status === "SUCCESS") {
      // Call Auth Service to upgrade user downstream
      const authUpgradeRes = await fetch(`${AUTH_SERVICE_URL}/api/internal/users/${transaction.userId}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: transaction.type,
          credits: transaction.credits
        })
      });

      if (!authUpgradeRes.ok) {
        return res.status(500).json({ error: "Failed to upgrade user downstream in Auth service" });
      }

      // Mark transaction success locally
      await prisma.transaction.update({
        where: { id: sessionId },
        data: { status: "SUCCESS" }
      });

      res.json({ success: true, message: "Payment validated and processed" });
    } else {
      await prisma.transaction.update({
        where: { id: sessionId },
        data: { status: "FAILED" }
      });
      res.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.error("Billing service webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Cancel Subscription
app.post("/api/billing/cancel", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Call Auth Service to downgrade user downstream
    const authDowngradeRes = await fetch(`${AUTH_SERVICE_URL}/api/internal/users/${userId}/downgrade`, {
      method: "POST"
    });

    if (!authDowngradeRes.ok) {
      return res.status(500).json({ error: "Failed to cancel subscription downstream" });
    }

    const authData = await authDowngradeRes.json();
    res.json({ success: true, user: authData.user });
  } catch (error) {
    console.error("Billing service cancel error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Fetch Transaction details
app.get("/api/billing/transaction/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    if (transaction.userId !== userId) return res.status(403).json({ error: "Forbidden" });

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Developer Seeding API
app.post("/api/internal/dev/seed", async (req, res) => {
  try {
    const { userId } = req.body;
    await prisma.transaction.deleteMany({ where: { userId } });

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    // Seed mock payment transactions
    await prisma.transaction.create({
      data: {
        userId,
        amount: 0,
        credits: 1,
        type: "FREE",
        status: "SUCCESS",
        createdAt: threeDaysAgo
      }
    });

    await prisma.transaction.create({
      data: {
        userId,
        amount: 15.0,
        credits: 5,
        type: "PACK",
        status: "SUCCESS",
        createdAt: twoDaysAgo
      }
    });

    await prisma.transaction.create({
      data: {
        userId,
        amount: 29.0,
        credits: 9999,
        type: "SUBSCRIPTION",
        status: "SUCCESS",
        createdAt: oneDayAgo
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Billing service seed error:", error);
    res.status(500).json({ error: "Internal db error" });
  }
});

app.listen(PORT, () => {
  console.log(`Billing Service listening on port ${PORT}`);
});
