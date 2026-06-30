"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";

export default function LoginPage() {
  const router = useRouter();
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginIdentifier, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Dispatch user update event for header sync
        window.dispatchEvent(new Event("user-updated"));
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <BackgroundBlobs />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div className="glass-card" style={{ width: "100%", maxWidth: "420px", padding: "40px 30px" }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "8px", textAlign: "center" }}>Welcome Back</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "30px", textAlign: "center" }}>
            Sign in to continue your interview training runs.
          </p>

          {error && (
            <div
              style={{
                background: "rgba(255, 82, 82, 0.1)",
                border: "1px solid rgba(255, 82, 82, 0.2)",
                color: "var(--color-error)",
                padding: "12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="loginIdentifier">
                Email or Username
              </label>
              <input
                type="text"
                id="loginIdentifier"
                className="form-input"
                placeholder="Enter email or username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "30px" }}>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "24px", textAlign: "center" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "var(--color-secondary)", textDecoration: "none", fontWeight: 600 }}>
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
