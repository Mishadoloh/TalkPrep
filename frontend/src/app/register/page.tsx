"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Dispatch user update event for header sync
        window.dispatchEvent(new Event("user-updated"));
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Registration failed. Please try again.");
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
          <h2 style={{ fontSize: "1.8rem", marginBottom: "8px", textAlign: "center" }}>Create Account</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "30px", textAlign: "center" }}>
            Get your free practice interview session credit instantly.
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
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="developer_jane"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                placeholder="6 digits (e.g. 123456)"
                pattern="[0-9]*"
                inputMode="numeric"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "24px", textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-secondary)", textDecoration: "none", fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
