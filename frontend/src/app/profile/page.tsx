"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Shield, User as UserIcon, Mail, Key, ArrowLeft, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { Locale } from "@/lib/translations";

interface User {
  id: string;
  email: string;
  username: string;
  isPro: boolean;
  credits: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("en-US");

  // Form states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Notice states
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("talkprep_locale") as Locale;
    if (saved) setLocale(saved);

    const handleLocale = (e: Event) => {
      const detail = (e as CustomEvent).detail as Locale;
      if (detail) setLocale(detail);
    };

    window.addEventListener("locale-changed", handleLocale);
    return () => window.removeEventListener("locale-changed", handleLocale);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/user");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (newPassword !== confirmPassword) {
      setFormError(locale === "uk-UA" ? "Паролі не збігаються" : "New passwords do not match");
      return;
    }

    if (!/^\d{6,}$/.test(newPassword)) {
      setFormError(locale === "uk-UA" ? "Новий пароль має містити щонайменше 6 цифр" : "New password must be at least 6 digits");
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormSuccess(locale === "uk-UA" ? "Пароль успішно оновлено!" : "Password updated successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setFormError(data.error || (locale === "uk-UA" ? "Не вдалося оновити пароль" : "Failed to update password"));
      }
    } catch (err) {
      setFormError(locale === "uk-UA" ? "Помилка зв'язку з сервером" : "Server communication error");
    } finally {
      setUpdating(false);
    }
  };

  const copyUserId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  if (!user) return null;

  // Bilingual translation mapper
  const t = {
    title: locale === "uk-UA" ? "Профіль користувача" : "User Profile",
    subtitle: locale === "uk-UA" ? "Керуйте своїми персональними даними та безпекою" : "Manage your personal details and security credentials",
    tier: locale === "uk-UA" ? "Тарифний план" : "Subscription Plan",
    credits: locale === "uk-UA" ? "Залишок кредитів" : "Practice Credits",
    proUser: locale === "uk-UA" ? "Безлімітний PRO" : "Unlimited PRO Member",
    freeUser: locale === "uk-UA" ? "Базовий акаунт" : "Free Tier Account",
    changePass: locale === "uk-UA" ? "Змінити пароль" : "Change Password",
    oldPass: locale === "uk-UA" ? "Поточний пароль" : "Current Password",
    newPass: locale === "uk-UA" ? "Новий пароль" : "New Password",
    confirmPass: locale === "uk-UA" ? "Підтвердження пароля" : "Confirm New Password",
    passClue: locale === "uk-UA" ? "Введіть новий пароль (мінімум 6 цифр)" : "Enter new password (minimum 6 digits)",
    submitBtn: locale === "uk-UA" ? "Зберегти зміни" : "Update Password",
    submitting: locale === "uk-UA" ? "Оновлення..." : "Updating...",
    backBtn: locale === "uk-UA" ? "Назад до панелі" : "Back to Dashboard",
    copySuccess: locale === "uk-UA" ? "Скопійовано!" : "Copied!",
    copyTooltip: locale === "uk-UA" ? "Копіювати ID" : "Copy User ID",
  };

  return (
    <>

      <main className="container" style={{ flex: 1, padding: "60px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          {/* Back button */}
          <Link 
            href="/dashboard" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              color: "var(--color-text-secondary)", 
              textDecoration: "none", 
              fontSize: "0.9rem",
              marginBottom: "30px",
              fontWeight: 500,
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
          >
            <ArrowLeft size={16} />
            {t.backBtn}
          </Link>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }}>
            
            {/* Left Column: Profile Card */}
            <div>
              <div 
                className="glass-card" 
                style={{ 
                  padding: "40px 30px", 
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(17, 15, 24, 0.55)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                }}
              >
                {/* Big Avatar */}
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                  <div 
                    style={{ 
                      width: "90px", 
                      height: "90px", 
                      borderRadius: "50%", 
                      background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)", 
                      margin: "0 auto 16px",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      border: "3px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: "0 0 30px rgba(124, 77, 255, 0.3)"
                    }}
                  >
                    <span style={{ fontSize: "2.2rem", fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>
                      {user.username.charAt(0)}
                    </span>
                  </div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "4px" }}>{user.username}</h2>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {user.email}
                  </span>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "20px 0" }} />

                {/* Account details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                      {t.tier}
                    </span>
                    {user.isPro ? (
                      <span className="badge badge-pro" style={{ display: "inline-flex", padding: "6px 12px", fontSize: "0.85rem" }}>
                        <Sparkles size={12} style={{ marginRight: "4px" }} />
                        PRO
                      </span>
                    ) : (
                      <span className="badge badge-free" style={{ display: "inline-flex", padding: "6px 12px", fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {t.freeUser}
                      </span>
                    )}
                  </div>

                  {!user.isPro && (
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                        {t.credits}
                      </span>
                      <strong style={{ fontSize: "1.2rem", color: "var(--color-cyan)" }}>
                        {user.credits}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                      User ID
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <code style={{ fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {user.id}
                      </code>
                      <button 
                        onClick={copyUserId}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title={t.copyTooltip}
                      >
                        {copied ? <Check size={14} style={{ color: "var(--color-green)" }} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Update Password Form */}
            <div>
              <div 
                className="glass-card" 
                style={{ 
                  padding: "40px 30px", 
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(17, 15, 24, 0.55)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                  <Shield size={20} style={{ color: "var(--color-secondary)" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{t.changePass}</h3>
                </div>

                {/* Notifications */}
                {formError && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--color-error)", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "20px" }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "var(--color-green)", padding: "12px", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "20px" }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="oldPassword">
                      {t.oldPass}
                    </label>
                    <input
                      type="password"
                      id="oldPassword"
                      className="form-input"
                      required
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      disabled={updating}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newPassword">
                      {t.newPass}
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      className="form-input"
                      required
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="e.g. 123456"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={updating}
                    />
                    <small style={{ display: "block", marginTop: "4px", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      {t.passClue}
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">
                      {t.confirmPass}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-input"
                      required
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="e.g. 123456"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={updating}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={updating}>
                    {updating ? t.submitting : t.submitBtn}
                  </button>
                </form>

              </div>
            </div>

          </div>

        </div>
      </main>
    </>
  );
}
