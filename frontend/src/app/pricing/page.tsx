"use client";

import { useEffect, useState } from "react";
import { getTranslation, Locale } from "@/lib/translations";
import { Sparkles, Check, X, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const [locale, setLocale] = useState<Locale>("en-US");

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

  // SEO Update
  useEffect(() => {
    document.title = getTranslation(locale, "metaTitlePricing");
    document.querySelector('meta[name="description"]')?.setAttribute("content", getTranslation(locale, "metaDescPricing"));
  }, [locale]);

  return (
    <>

      <main className="container" style={{ flex: 1, padding: "80px 24px" }}>
        <section style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 60px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(124, 77, 255, 0.1)",
              border: "1px solid rgba(124, 77, 255, 0.2)",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              color: "var(--color-primary-hover)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            <Sparkles size={14} />
            {locale === "uk-UA" ? "Гнучкі тарифи" : "Pricing Models"}
          </span>
          <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
            {getTranslation(locale, "pricingTitle")}
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
            {getTranslation(locale, "pricingDesc")}
          </p>
        </section>

        {/* Pricing Cards Grid */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px", marginBottom: "80px" }}>
          {/* Plan 1 */}
          <div className="glass-card" style={{ padding: "35px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                {locale === "uk-UA" ? "Початок" : "Trial"}
              </span>
              <h3 style={{ fontSize: "1.6rem", marginTop: "6px", marginBottom: "16px" }}>
                {getTranslation(locale, "freePractice")}
              </h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "20px" }}>
                $0.00 <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{locale === "uk-UA" ? "завжди" : "forever"}</span>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0", color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "1 безкоштовний кредит" : "1 free practice credit"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Озвучення та розпізнавання" : "Audio synthesis & speech recognition"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Аналіз слів-паразитів" : "Filler words tracker"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)" }}><X size={16} style={{ color: "var(--color-error)" }} /> {locale === "uk-UA" ? "Еталонна відповідь ШІ" : "Ideal answer keys"}</li>
              </ul>
            </div>
            <Link href="/register" className="btn btn-secondary" style={{ width: "100%", padding: "12px", textAlign: "center" }}>
              {locale === "uk-UA" ? "Створити акаунт" : "Register Free"}
            </Link>
          </div>

          {/* Plan 2 */}
          <div className="glass-card" style={{ padding: "35px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                {locale === "uk-UA" ? "Разовий пакет" : "One-off Pack"}
              </span>
              <h3 style={{ fontSize: "1.6rem", marginTop: "6px", marginBottom: "16px" }}>
                {locale === "uk-UA" ? "Пакет 5 співбесід" : "5-Interview Pack"}
              </h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "20px" }}>
                $15.00 <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{locale === "uk-UA" ? "одноразово" : "once"}</span>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0", color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "5 додаткових кредитів" : "5 practice session credits"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Кредити не згорають" : "Credits never expire"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Повний аналіз та оцінки ШІ" : "Full AI evaluations"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Розблокування звітів" : "Unlocked review reports"}</li>
              </ul>
            </div>
            <Link href="/dashboard" className="btn btn-secondary" style={{ width: "100%", padding: "12px", textAlign: "center" }}>
              {locale === "uk-UA" ? "Придбати кредити" : "Buy Pack"}
            </Link>
          </div>

          {/* Plan 3 */}
          <div
            className="glass-card"
            style={{
              padding: "35px",
              border: "1px solid var(--color-primary)",
              boxShadow: "0 0 25px rgba(124, 77, 255, 0.15)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative"
            }}
          >
            <div style={{ position: "absolute", top: "15px", right: "20px" }}>
              <span className="badge badge-pro" style={{ fontSize: "0.7rem", fontWeight: 700 }}>POPULAR</span>
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--color-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                {locale === "uk-UA" ? "Найкращий вибір" : "Membership"}
              </span>
              <h3 style={{ fontSize: "1.6rem", marginTop: "6px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={18} style={{ color: "var(--color-secondary)" }} />
                {locale === "uk-UA" ? "Безлімітний PRO статус" : "Unlimited Pro"}
              </h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "20px" }}>
                $29.00 <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", fontWeight: 500 }}>/ {locale === "uk-UA" ? "місяць" : "month"}</span>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0", color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Безлімітна практика" : "Unlimited mock interview runs"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Пріоритетні ШІ-запити" : "Priority AI queue speeds"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Усі 15 мов співбесід" : "Access all 15 language options"}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><Check size={16} style={{ color: "var(--color-secondary)" }} /> {locale === "uk-UA" ? "Детальна аналітика балів" : "Detailed analytics & chart tracking"}</li>
              </ul>
            </div>
            <Link href="/dashboard" className="btn btn-primary" style={{ width: "100%", padding: "12px", textAlign: "center" }}>
              {locale === "uk-UA" ? "Оформити підписку" : "Upgrade to Pro"}
            </Link>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="glass-card" style={{ padding: "40px", overflowX: "auto" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "24px", textAlign: "center" }}>
            {locale === "uk-UA" ? "Детальне порівняння можливостей" : "Plans Comparison Grid"}
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "16px" }}>{locale === "uk-UA" ? "Можливість" : "Feature Option"}</th>
                <th style={{ padding: "16px" }}>{getTranslation(locale, "freePractice")}</th>
                <th style={{ padding: "16px" }}>{locale === "uk-UA" ? "Пакет" : "Pack"}</th>
                <th style={{ padding: "16px" }}>{getTranslation(locale, "proMember")}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "16px" }}>{locale === "uk-UA" ? "Кількість сесій" : "Interview Runs"}</td>
                <td style={{ padding: "16px" }}>1</td>
                <td style={{ padding: "16px" }}>5</td>
                <td style={{ padding: "16px", color: "var(--color-secondary)", fontWeight: "bold" }}>{locale === "uk-UA" ? "Безліміт" : "Unlimited"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "16px" }}>{locale === "uk-UA" ? "ШІ-Критика відповіді" : "AI Critique Reports"}</td>
                <td style={{ padding: "16px" }}><X size={16} style={{ color: "var(--color-error)" }} /></td>
                <td style={{ padding: "16px" }}><Check size={16} style={{ color: "#4caf50" }} /></td>
                <td style={{ padding: "16px" }}><Check size={16} style={{ color: "#4caf50" }} /></td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "16px" }}>{locale === "uk-UA" ? "Вибір мов" : "Languages Selection"}</td>
                <td style={{ padding: "16px" }}>English</td>
                <td style={{ padding: "16px" }}>15 {locale === "uk-UA" ? "мов" : "languages"}</td>
                <td style={{ padding: "16px" }}>15 {locale === "uk-UA" ? "мов" : "languages"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "16px" }}>{locale === "uk-UA" ? "Аналіз темпу та слів-паразитів" : "Pacing & Filler Tracker"}</td>
                <td style={{ padding: "16px" }}><Check size={16} style={{ color: "#4caf50" }} /></td>
                <td style={{ padding: "16px" }}><Check size={16} style={{ color: "#4caf50" }} /></td>
                <td style={{ padding: "16px" }}><Check size={16} style={{ color: "#4caf50" }} /></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
