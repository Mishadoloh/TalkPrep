import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "talkprep_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "super-secret-key-that-is-at-least-32-chars-long";

// 1. Password Hashing (using PBKDF2)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

// 2. Session Encryption & Decryption (using AES-256-CBC)
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  // Ensure key is exactly 32 bytes
  const key = crypto.scryptSync(SESSION_SECRET, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(text: string): string | null {
  try {
    const [ivHex, encryptedHex] = text.split(":");
    if (!ivHex || !encryptedHex) return null;
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.scryptSync(SESSION_SECRET, "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Session decryption failed:", error);
    return null;
  }
}

// 3. Cookie Session Handlers
export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  expiresAt: string;
}

export async function createSession(userId: string, email: string, username: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  const payload: SessionPayload = { userId, email, username, expiresAt };
  const token = encrypt(JSON.stringify(payload));
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  
  const decrypted = decrypt(token);
  if (!decrypted) return null;
  
  try {
    const payload = JSON.parse(decrypted) as SessionPayload;
    // Check expiration
    if (new Date(payload.expiresAt) < new Date()) {
      await destroySession();
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}
