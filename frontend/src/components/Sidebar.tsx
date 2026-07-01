"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Briefcase, BarChart2, FileText, Mic,
  User, Settings, HelpCircle, LogOut, Sparkles,
  Bell, Flame, Moon, ChevronRight,
} from "lucide-react";
import { Locale } from "@/lib/translations";

interface UserData { username: string; isPro: boolean; credits: number; }

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [user,    setUser]      = useState<UserData | null>(null);
  const [locale,  setLocale]    = useState<Locale>("en-US");
  const [promo,   setPromo]     = useState(true);
  const [notifCount] = useState(1);

  /* locale */
  useEffect(() => {
    const s = localStorage.getItem("talkprep_locale") as Locale;
    if (s) setLocale(s);
    const h = (e: Event) => { const d = (e as CustomEvent).detail as Locale; if (d) setLocale(d); };
    window.addEventListener("locale-changed", h);
    return () => window.removeEventListener("locale-changed", h);
  }, []);

  /* user */
  const loadUser = async () => {
    try {
      const r = await fetch("/api/auth/user");
      if (r.ok) { const d = await r.json(); setUser(d.authenticated ? d.user : null); }
      else setUser(null);
    } catch { setUser(null); }
  };
  useEffect(() => {
    loadUser();
    window.addEventListener("user-updated", loadUser);
    return () => window.removeEventListener("user-updated", loadUser);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/"); router.refresh();
    window.dispatchEvent(new Event("user-updated"));
  };

  const switchLang = (l: Locale) => {
    setLocale(l);
    localStorage.setItem("talkprep_locale", l);
    window.dispatchEvent(new CustomEvent("locale-changed", { detail: l }));
  };

  const uk = locale === "uk-UA";

  const mainNav = [
    { href: user ? "/dashboard" : "/", icon: Home, label: uk ? "Головна" : "Home" },
    { href: "/vacancies", icon: Briefcase, label: uk ? "Вакансії" : "Vacancies" },
    { href: "/tracker", icon: BarChart2, label: uk ? "Трекер" : "Tracker" },
    { href: "/resume", icon: FileText, label: uk ? "Резюме" : "Resume" },
    { href: "/interview", icon: Mic, label: uk ? "Інтерв'ю" : "Interview" },
    { href: "/profile", icon: User, label: uk ? "Профіль" : "Profile" },
  ];

  const bottomNav = [
    { href: "/faq", icon: HelpCircle, label: uk ? "Підтримка" : "Support" },
    { href: "/settings", icon: Settings, label: uk ? "Налаштування" : "Settings" },
  ];

  const promoTop = promo ? 36 : 0;

  return (
    <>
      {/* ── Promo Banner ── */}
      {promo && (
        <div className="promo-banner">
          <Flame size={14} style={{ color: "#fbbf24" }} />
          <span>
            {uk
              ? <><strong>Спецпропозиція</strong> — забери −44% знижку сьогодні!</>
              : <><strong>Special offer</strong> — get −44% off today!</>}
          </span>
          <Link href="/pricing" className="promo-banner-btn">
            {uk ? "Забрати знижку →" : "Claim offer →"}
          </Link>
          <button onClick={() => setPromo(false)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.6, fontSize: "1.1rem", lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="sidebar" style={{ top: promoTop, height: `calc(100vh - ${promoTop}px)` }}>
        {/* Logo */}
        <Link href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">T</div>
          <span className="sidebar-logo-text">TalkPrep</span>
        </Link>

        {/* Main Nav */}
        <nav className="sidebar-nav">
          {mainNav.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className={`sidebar-nav-item${pathname === href || (href !== "/" && pathname.startsWith(href)) ? " active" : ""}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}

          <div className="sidebar-divider" />

          {bottomNav.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className={`sidebar-nav-item${pathname === href ? " active" : ""}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {user ? (
            <>
              {!user.isPro && (
                <Link href="/pricing" className="sidebar-upgrade-btn">
                  <Sparkles size={13} />
                  {uk ? "Перейти на Pro" : "Upgrade to Pro"}
                </Link>
              )}
              <button onClick={logout} className="sidebar-nav-item" style={{ color: "var(--text-secondary)" }}>
                <LogOut size={16} />
                {uk ? "Вийти" : "Log out"}
              </button>
            </>
          ) : (
            <>
              <Link href="/register" className="sidebar-upgrade-btn">
                <Sparkles size={13} />
                {uk ? "Зареєструватись" : "Get Started Free"}
              </Link>
              <Link href="/login" className="sidebar-nav-item">
                <User size={16} />
                {uk ? "Увійти" : "Sign in"}
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* ── Topbar (attached to main-content via portal-like fixed) ── */}
      <div className="topbar" style={{
        position: "fixed",
        top: promoTop,
        left: "var(--sidebar-w)",
        right: 0,
        zIndex: 150,
      }}>
        {/* Streak */}
        <div className="topbar-icon-btn" title={uk ? "Серія" : "Streak"} style={{ color: "var(--color-streak)", gap: 4, width: "auto", padding: "0 10px", minWidth: 44 }}>
          <Flame size={14} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>1</span>
        </div>

        {/* Notifications */}
        <div className="topbar-icon-btn" title={uk ? "Повідомлення" : "Notifications"} style={{ position: "relative" }}>
          <Bell size={15} />
          {notifCount > 0 && <span className="topbar-badge">{notifCount}</span>}
        </div>

        {/* Dark mode toggle (cosmetic) */}
        <div className="topbar-icon-btn" title={uk ? "Темна тема" : "Dark mode"}>
          <Moon size={15} />
        </div>

        {/* Language toggle */}
        <div className="lang-toggle">
          <button className={`lang-toggle-btn${locale === "uk-UA" ? " active" : ""}`} onClick={() => switchLang("uk-UA")}>УКР</button>
          <button className={`lang-toggle-btn${locale === "en-US" ? " active" : ""}`} onClick={() => switchLang("en-US")}>ENG</button>
        </div>

        {/* Avatar + badge */}
        {user ? (
          <>
            <Link href="/profile" className="topbar-avatar" title={user.username}>
              {user.username[0].toUpperCase()}
            </Link>
            <span className={`badge ${user.isPro ? "badge-pro" : "badge-free"}`}>
              {user.isPro ? "PRO" : "FREE"}
            </span>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
              {uk ? "Увійти" : "Sign in"}
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
              {uk ? "Реєстрація" : "Get started"}
            </Link>
          </>
        )}
      </div>
    </>
  );
}
