"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        window.dispatchEvent(new Event("user-updated"));
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Невірний email або пароль");
      }
    } catch (err) {
      setError("Сталася неочікувана помилка.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setError("");
    setLoading(true);
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      const res = await fetch("/api/auth/google-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userInfo.email,
          name: userInfo.given_name || userInfo.name || userInfo.email.split("@")[0],
          sub: userInfo.sub,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new Event("user-updated"));
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Помилка входу через Google.");
      }
    } catch (err) {
      setError("Помилка Google авторизації.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google авторизацію скасовано або сталася помилка."),
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0d0e15", color: "#ffffff", fontFamily: "var(--font-sans)", alignItems: "center", justifyContent: "center" }}>
      
      {/* Subtle bg effect */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 30% 30%, rgba(66, 46, 126, 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(20, 80, 110, 0.2) 0%, transparent 50%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "480px", padding: "40px 24px", position: "relative", zIndex: 1 }}>
        
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "1.4rem", fontWeight: 700, marginBottom: "40px", color: "white" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
            D
          </div>
          Doorora
        </div>

        <div style={{ background: "rgba(20, 22, 35, 0.8)", backdropFilter: "blur(20px)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", padding: "48px 40px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
          
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "20px", padding: "6px 14px", fontSize: "0.8rem", color: "#a5b4fc", fontWeight: 600, marginBottom: "16px" }}>
              <Sparkles size={12} /> З поверненням!
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "white", marginBottom: "8px" }}>Увійти в акаунт</h1>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Продовж свій шлях до офферу</p>
          </div>

          <button type="button" onClick={() => googleLogin()} disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "14px", color: "white", fontSize: "1rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", marginBottom: "24px" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
            <FcGoogle size={20} /> {loading ? "Завантаження..." : "Продовжити з Google"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }}></div>
            <div style={{ color: "#475569", fontSize: "0.8rem", fontWeight: 600 }}>АБО</div>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }}></div>
          </div>

          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>Email або ім'я</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} color="#64748b" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" placeholder="you@example.com" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} required disabled={loading} style={{ width: "100%", background: "rgba(15, 17, 26, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 14px 14px 44px", color: "white", fontSize: "1rem", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>Пароль</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="#64748b" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPassword ? "text" : "password"} placeholder="Твій пароль" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ width: "100%", background: "rgba(15, 17, 26, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 44px", color: "white", fontSize: "1rem", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "white", border: "none", borderRadius: "12px", padding: "16px", fontSize: "1.05rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              {loading ? "Вхід..." : "Увійти"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "20px", fontSize: "0.75rem", color: "#64748b" }}>
            <CheckCircle2 size={14} color="#10b981" /> Безпечний вхід · дані зашифровані
          </div>

          <div style={{ textAlign: "center", marginTop: "32px", fontSize: "0.95rem", color: "#94a3b8" }}>
            Немає акаунту? <Link href="/register" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>Зареєструватися</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
