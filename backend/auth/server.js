const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { PrismaClient } = require("./generated/client");

const app = express();
const PORT = 3010;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Password hashing utility (PBKDF2)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

// 1. Auth: Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Missing email, username, or password" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email or username already registered" });
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        credits: 1 // 1 free practice credit
      }
    });

    res.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, isPro: user.isPro, credits: user.credits }
    });
  } catch (error) {
    console.error("Auth register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Auth: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: "Missing login identifier or password" });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: loginIdentifier }, { username: loginIdentifier }] }
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, isPro: user.isPro, credits: user.credits }
    });
  } catch (error) {
    console.error("Auth login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Auth: Fetch User details (used by Gateway)
app.get("/api/auth/user/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, username: true, isPro: true, credits: true, createdAt: true }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Auth fetch user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Internal API: Get user credit status (called by AI service downstream)
app.get("/api/internal/users/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      isPro: user.isPro,
      credits: user.credits
    });
  } catch (error) {
    res.status(500).json({ error: "Internal db error" });
  }
});

// 5. Internal API: Deduct user credit (called by AI service)
app.post("/api/internal/users/:id/deduct-credit", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.credits <= 0) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { credits: user.credits - 1 }
    });

    res.json({ success: true, credits: updated.credits });
  } catch (error) {
    res.status(500).json({ error: "Internal db error" });
  }
});

// 6. Internal API: Upgrade user plan / Grant credits (called by Billing service)
app.post("/api/internal/users/:id/upgrade", async (req, res) => {
  try {
    const { type, credits } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    let updated;
    if (type === "SUBSCRIPTION") {
      updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { isPro: true }
      });
    } else {
      updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { credits: user.credits + credits }
      });
    }

    res.json({ success: true, user: { isPro: updated.isPro, credits: updated.credits } });
  } catch (error) {
    res.status(500).json({ error: "Internal db error" });
  }
});

// 7. Internal API: Downgrade / Cancel subscription (called by Billing service)
app.post("/api/internal/users/:id/downgrade", async (req, res) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isPro: false }
    });
    res.json({ success: true, user: { isPro: updated.isPro, credits: updated.credits } });
  } catch (error) {
    res.status(500).json({ error: "Internal db error" });
  }
});

// 8. Internal API: Developer Seeding
app.post("/api/internal/dev/seed", async (req, res) => {
  try {
    const { userId } = req.body;
    // Set seed settings for user
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isPro: true,
        credits: 6 // 1 free + 5 pack
      }
    });
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error("Auth seed error:", error);
    res.status(500).json({ error: "Internal db error" });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service listening on port ${PORT}`);
});
