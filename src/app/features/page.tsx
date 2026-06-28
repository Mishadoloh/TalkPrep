"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import { getTranslation, Locale } from "@/lib/translations";
import { Volume2, Sparkles, Mic, Flame, Clock, Award } from "lucide-react";

export default function FeaturesPage() {
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
    document.title = getTranslation(locale, "metaTitleFeatures");
    document.querySelector('meta[name="description"]')?.setAttribute("content", getTranslation(locale, "metaDescFeatures"));
  }, [locale]);

  return (
    <>
      <Header />
      <BackgroundBlobs />

      <main className="container" style={{ flex: 1, padding: "80px 24px" }}>
        <section style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 60px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 229, 255, 0.1)",
              border: "1px solid rgba(0, 229, 255, 0.2)",
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              color: "var(--color-cyan)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            <Sparkles size={14} />
            {locale === "uk-UA" ? "Технічні характеристики" : "System Mechanics"}
          </span>
          <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
            {getTranslation(locale, "featuresTitle")}
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
            {getTranslation(locale, "featuresDesc")}
          </p>
        </section>

        {/* Feature Cards Grid */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px", marginBottom: "60px" }}>
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "rgba(124, 77, 255, 0.15)", width: "50px", height: "50px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Volume2 style={{ color: "var(--color-secondary)" }} size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>
                {locale === "uk-UA" ? "Аудіосинтез питань (TTS)" : "Audio Question Synthesis"}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                {locale === "uk-UA"
                  ? "ШІ промовляє технічні питання з виразною вимовою та професійним темпом. Це допомагає кандидатам звикнути до сприйняття англійської термінології на слух."
                  : "The speech terminal converts raw text questions into clear audio cues at a realistic recruiter speed, helping you adapt to natural speaking tempos."}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "rgba(0, 229, 255, 0.15)", width: "50px", height: "50px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mic style={{ color: "var(--color-cyan)" }} size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>
                {locale === "uk-UA" ? "Потокове розпізнавання мови" : "Continuous Voice Captures"}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                {locale === "uk-UA"
                  ? "Наш аудіотермінал в реальному часі транскрибує ваші усні відповіді безпосередньо у браузері, дозволяючи перед відправкою переглянути та підкорегувати текст."
                  : "Leverages HTML5 Speech-to-Text pipelines to write your answer transcripts in real time, with zero network delay and fully local processing."}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "rgba(76, 175, 80, 0.15)", width: "50px", height: "50px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award style={{ color: "#4caf50" }} size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>
                {locale === "uk-UA" ? "ШІ-Грейдинг від Google Gemini" : "Google Gemini AI Scoring"}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                {locale === "uk-UA"
                  ? "Система використовує інтелектуальну модель gemini-2.5-flash для глибокої концептуальної оцінки відповідей, виділяючи пропущені ключові слова."
                  : "If enabled, gemini-2.5-flash evaluates your spoken response, comparing it conceptually with reference answers to provide realistic feedback."}
              </p>
            </div>
          </div>
        </section>

        {/* Informative Grid */}
        <section className="glass-card" style={{ padding: "40px", border: "1px solid var(--border-glow)" }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "24px", textAlign: "center" }}>
            {locale === "uk-UA" ? "Як розраховується ваш результат?" : "Phonetic & Conceptual Scoring Parameters"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
            <div>
              <h4 style={{ color: "var(--color-secondary)", marginBottom: "8px" }}>
                {locale === "uk-UA" ? "Ключові терміни (50%)" : "Keyword Coverage"}
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
                {locale === "uk-UA"
                  ? "Спеціальні алгоритми сканують ваш текст на наявність обов'язкових термінів та визначень з еталонної відповіді."
                  : "Measures whether your explanation hit core technical concepts and definition keywords."}
              </p>
            </div>
            <div>
              <h4 style={{ color: "var(--color-secondary)", marginBottom: "8px" }}>
                {locale === "uk-UA" ? "Слова-паразити (-10%)" : "Filler Speech Penalty"}
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
                {locale === "uk-UA"
                  ? "Знижує бал при частому використанні зайвих звуків (таких як «ее», «мм», «типу»), що шкодить професійній подачі."
                  : "Subtracts points for excessive verbal fillers, coaching you to pace your thoughts cleanly."}
              </p>
            </div>
            <div>
              <h4 style={{ color: "var(--color-secondary)", marginBottom: "8px" }}>
                {locale === "uk-UA" ? "Повнота викладу (40%)" : "Conceptual Depth"}
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
                {locale === "uk-UA"
                  ? "ШІ перевіряє логіку пояснень, розуміння архітектурних концепцій та глибину технічного аналізу."
                  : "AI checks for overall sentence logic and structural completeness of your response."}
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
