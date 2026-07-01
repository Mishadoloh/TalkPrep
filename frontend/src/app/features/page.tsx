"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTranslation, Locale } from "@/lib/translations";
import { Volume2, Mic, Award, BarChart2, Clock, Zap, ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  const [locale, setLocale] = useState<Locale>("en-US");

  useEffect(() => {
    const saved = localStorage.getItem("talkprep_locale") as Locale;
    if (saved) setLocale(saved);
    const h = (e: Event) => { const d = (e as CustomEvent).detail as Locale; if (d) setLocale(d); };
    window.addEventListener("locale-changed", h);
    return () => window.removeEventListener("locale-changed", h);
  }, []);

  useEffect(() => {
    document.title = getTranslation(locale, "metaTitleFeatures");
  }, [locale]);

  const features = [
    {
      icon: Volume2,
      color: "#6c5ce7",
      title: locale === "uk-UA" ? "Аудіосинтез питань" : "Audio Question Synthesis",
      desc: locale === "uk-UA"
        ? "ШІ промовляє технічні питання з виразною вимовою та рекрутерським темпом. Допомагає звикнути до англійської термінології на слух."
        : "The AI reads technical questions aloud at a realistic recruiter pace, helping you adapt to natural speaking tempos.",
    },
    {
      icon: Mic,
      color: "#0ea5e9",
      title: locale === "uk-UA" ? "Потокове розпізнавання мови" : "Real-time Speech Recognition",
      desc: locale === "uk-UA"
        ? "Аудіотермінал в реальному часі транскрибує усні відповіді безпосередньо у браузері — локально, без затримок."
        : "HTML5 Speech-to-Text writes your answer transcripts in real time with zero network delay and fully local processing.",
    },
    {
      icon: Award,
      color: "#22c55e",
      title: locale === "uk-UA" ? "ШІ-Грейдинг Gemini" : "Google Gemini AI Grading",
      desc: locale === "uk-UA"
        ? "Система використовує gemini-2.5-flash для глибокої оцінки відповідей, виділяючи пропущені ключові слова."
        : "Gemini 2.5 Flash evaluates your spoken response, compares it with reference answers and highlights missing keywords.",
    },
    {
      icon: BarChart2,
      color: "#f59e0b",
      title: locale === "uk-UA" ? "Аналіз слів-паразитів" : "Filler Word Analysis",
      desc: locale === "uk-UA"
        ? "Знижує бал при частому використанні «ее», «мм», «типу». Навчає чіткості та впевненості у відповідях."
        : "Detects and penalizes filler words like 'um', 'uh', 'like', coaching you toward cleaner, more confident speech.",
    },
    {
      icon: Clock,
      color: "#ec4899",
      title: locale === "uk-UA" ? "Таймер відповіді" : "Answer Timer",
      desc: locale === "uk-UA"
        ? "Контролює час відповіді на кожне питання — як на реальній співбесіді з обмеженим часом."
        : "Tracks how long you take per question, simulating real interview time pressure.",
    },
    {
      icon: Zap,
      color: "#6c5ce7",
      title: locale === "uk-UA" ? "Миттєвий зворотний зв'язок" : "Instant Feedback",
      desc: locale === "uk-UA"
        ? "Після кожної відповіді — детальний розбір: що сказали правильно, що пропустили, оцінка і поради."
        : "After each answer: detailed breakdown of what you said correctly, what you missed, your score and tips.",
    },
  ];

  const scoring = [
    { label: locale === "uk-UA" ? "Ключові терміни" : "Keyword Coverage", value: "50%", color: "#6c5ce7",
      desc: locale === "uk-UA" ? "Обов'язкові терміни з еталонної відповіді." : "Mandatory technical terms from the reference answer." },
    { label: locale === "uk-UA" ? "Повнота відповіді" : "Conceptual Depth", value: "40%", color: "#22c55e",
      desc: locale === "uk-UA" ? "Логіка, архітектура та глибина аналізу." : "Sentence logic, structure and technical depth." },
    { label: locale === "uk-UA" ? "Слова-паразити" : "Filler Penalty", value: "−10%", color: "#ef4444",
      desc: locale === "uk-UA" ? "Штраф за надмірні «ее», «мм», «типу»." : "Penalty for excessive um, uh, like, you know." },
  ];

  return (
    <div className="page-content">

      {/* ── Page Header ── */}
      <div className="page-header" style={{ maxWidth: 640, marginBottom: 40 }}>
        <h1>{getTranslation(locale, "featuresTitle")}</h1>
        <p style={{ marginTop: 8 }}>{getTranslation(locale, "featuresDesc")}</p>
      </div>

      {/* ── Feature Cards Grid ── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 48 }}>
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={f.color} />
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Scoring Breakdown ── */}
      <section className="glass-card" style={{ padding: "30px 32px", marginBottom: 36 }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 22 }}>
          {locale === "uk-UA" ? "Як розраховується результат?" : "How is your score calculated?"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {scoring.map((s, i) => (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color, fontFamily: "var(--font-mono)" }}>{s.value}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{s.label}</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/register" className="btn btn-primary">
          {locale === "uk-UA" ? "Спробувати безкоштовно" : "Try for free"}
          <ArrowRight size={15} />
        </Link>
        <Link href="/pricing" className="btn btn-secondary">
          {locale === "uk-UA" ? "Переглянути ціни" : "View pricing"}
        </Link>
      </div>

    </div>
  );
}
