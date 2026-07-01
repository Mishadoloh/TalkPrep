"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, MessageSquare, BarChart2, Star, User, Mail, Lock, Eye, EyeOff, Gift, CheckCircle2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        window.dispatchEvent(new Event("user-updated"));
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Помилка реєстрації. Спробуйте ще раз.");
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
      // Exchange access_token for user info, then send to our backend
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      // We send the access token and email/name directly to our backend endpoint
      // The backend will verify via google-auth
      // Since we use access_token flow, we reconstruct an id_token-like call using the sub
      // Instead, send the access_token to our dedicated endpoint that handles userinfo
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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0d0e15", color: "#ffffff", fontFamily: "var(--font-sans)" }}>
      
      {/* Left Side */}
      <div style={{ flex: 1, padding: "60px", background: "radial-gradient(circle at 30% 30%, #3b2a63 0%, #1a1b30 60%, #0d0e15 100%)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.4rem", fontWeight: 700, marginBottom: "40px", color: "white" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
            D
          </div>
          Doorora
        </div>
        
        <h1 style={{ fontSize: "2.8rem", fontWeight: 800, marginBottom: "16px", color: "white", letterSpacing: "-0.02em" }}>
          Знайди роботу мрії з <span style={{ background: "linear-gradient(90deg, #c4b5fd 0%, #5eead4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
        </h1>
        
        <p style={{ fontSize: "1.1rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "40px", maxWidth: "450px" }}>
          Оптимізуй резюме, тренуйся на співбесідах і відстежуй відгуки — усе в одному місці.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
              <FileText size={20} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "white" }}>AI-резюме та ATS-оптимізація</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
              <MessageSquare size={20} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "white" }}>Симулятор співбесід</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
              <BarChart2 size={20} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "white" }}>Трекер вакансій</div>
          </div>
        </div>
        
        {/* Testimonial Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", maxWidth: "450px", marginBottom: "auto" }}>
          <div style={{ display: "flex", gap: "4px", marginBottom: "12px", color: "#fbbf24" }}>
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
          </div>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.5, color: "#e2e8f0", fontWeight: 500, marginBottom: "20px" }}>
            “Оптимізував резюме під вакансію — і за тиждень отримав три запрошення на співбесіду.”
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem" }}>
              О
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "white" }}>Олена К.</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Frontend-розробниця</div>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div style={{ display: "flex", gap: "40px", marginTop: "40px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px" }}>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>300+</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>оптимізованих<br/>резюме</div>
          </div>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>500+</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>проведених<br/>співбесід</div>
          </div>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>200+</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>активних<br/>користувачів</div>
          </div>
        </div>
        <div style={{ marginTop: "24px", fontSize: "0.75rem", color: "#475569" }}>
          © 2026 Doorora
        </div>
        
      </div>
      
      {/* Right Side */}
      <div style={{ flex: 1, padding: "60px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {/* Subtle grid background on right side */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
        
        <div style={{ width: "100%", maxWidth: "460px", background: "rgba(20, 22, 35, 0.8)", backdropFilter: "blur(20px)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", padding: "48px 40px", zIndex: 1, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "8px", color: "white" }}>
            Створи <span style={{ color: "#38bdf8" }}>акаунт</span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", marginBottom: "32px" }}>Кілька секунд — і почнемо</p>
          
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
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>Ім'я</label>
              <div style={{ position: "relative" }}>
                <User size={18} color="#64748b" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" placeholder="Як до тебе звертатися?" value={username} onChange={e => setUsername(e.target.value)} required disabled={loading} style={{ width: "100%", background: "rgba(15, 17, 26, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 14px 14px 44px", color: "white", fontSize: "1rem", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} color="#64748b" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={{ width: "100%", background: "rgba(15, 17, 26, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 14px 14px 44px", color: "white", fontSize: "1rem", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>Пароль</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="#64748b" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPassword ? "text" : "password"} placeholder="Мінімум 8 символів" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ width: "100%", background: "rgba(15, 17, 26, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 44px", color: "white", fontSize: "1rem", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", color: "#64748b" }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "32px", fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
              <Gift size={14} /> Маєш промокод?
            </div>
            
            <button type="submit" disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", border: "none", borderRadius: "12px", padding: "16px", fontSize: "1.05rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              {loading ? "Створення..." : "Зареєструватися"}
            </button>
          </form>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "20px", fontSize: "0.75rem", color: "#64748b" }}>
            <CheckCircle2 size={14} color="#10b981" /> Безкоштовно · картка не потрібна · за лічені секунди
          </div>
          
          <div style={{ textAlign: "center", marginTop: "32px", fontSize: "0.95rem", color: "#94a3b8" }}>
            Вже є акаунт? <Link href="/login" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>Увійти</Link>
          </div>
          
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          body > div > div { flexDirection: column !important; }
        }
      `}} />
    </div>
  );
}
