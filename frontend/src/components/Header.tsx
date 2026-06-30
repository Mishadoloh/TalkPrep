"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, User as UserIcon, Globe } from "lucide-react";
import { getTranslation, Locale } from "@/lib/translations";

interface User {
  username: string;
  isPro: boolean;
  credits: number;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("en-US");

  useEffect(() => {
    // Read locale
    const savedLocale = localStorage.getItem("talkprep_locale") as Locale;
    if (savedLocale) {
      setLocale(savedLocale);
    }
  }, []);

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as Locale;
    setLocale(val);
    localStorage.setItem("talkprep_locale", val);
    // Dispatch custom event to notify other page components
    window.dispatchEvent(new CustomEvent("locale-changed", { detail: val }));
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/user");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen to custom event to refresh user data if credits change elsewhere
    const handleUserUpdate = () => fetchUser();
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
        // Trigger event
        window.dispatchEvent(new Event("user-updated"));
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <header className="header">
      <div className="container header-container">
        <Link href={user ? "/dashboard" : "/"} className="logo">
          {getTranslation(locale, "logo")}<span className="logo-dot"></span>
        </Link>

        <nav className="nav-links" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Language Selector Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
            <Globe size={13} style={{ color: "var(--color-text-secondary)" }} />
            <select
              value={locale}
              onChange={handleLocaleChange}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-primary)",
                fontSize: "0.8rem",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="en-US" style={{ background: "#110f18" }}>EN</option>
              <option value="uk-UA" style={{ background: "#110f18" }}>UA</option>
              <option value="es-ES" style={{ background: "#110f18" }}>ES</option>
              <option value="de-DE" style={{ background: "#110f18" }}>DE</option>
              <option value="fr-FR" style={{ background: "#110f18" }}>FR</option>
            </select>
          </div>

          <Link href="/features" className="nav-link">
            {getTranslation(locale, "navFeatures")}
          </Link>
          <Link href="/pricing" className="nav-link">
            {getTranslation(locale, "navPricing")}
          </Link>
          <Link href="/faq" className="nav-link">
            {getTranslation(locale, "navFaq")}
          </Link>
          <Link href="/about" className="nav-link">
            {getTranslation(locale, "navAbout")}
          </Link>
          <Link href="/contact" className="nav-link">
            {getTranslation(locale, "navContact")}
          </Link>

          {loading ? (
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              {getTranslation(locale, "loading")}
            </span>
          ) : user ? (
            <>
              <Link href="/dashboard" className="nav-link">
                {getTranslation(locale, "dashboard")}
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {user.isPro ? (
                  <span className="badge badge-pro">
                    <Sparkles size={12} style={{ marginRight: "4px" }} />
                    PRO
                  </span>
                ) : (
                  <span className="badge badge-free">
                    {user.credits} {user.credits === 1 ? getTranslation(locale, "creditLeft") : getTranslation(locale, "creditsLeft")}
                  </span>
                )}
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.9rem",
                    color: "var(--color-text-primary)",
                    fontWeight: 600,
                  }}
                >
                  <UserIcon size={14} style={{ color: "var(--color-secondary)" }} />
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                  title={getTranslation(locale, "logout")}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">
                {getTranslation(locale, "signIn")}
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
                {getTranslation(locale, "getStarted")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
