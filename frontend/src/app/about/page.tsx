"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import { getTranslation, Locale } from "@/lib/translations";
import { Sparkles, Terminal, Code, Cpu } from "lucide-react";

export default function AboutPage() {
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
    document.title = getTranslation(locale, "metaTitleAbout");
    document.querySelector('meta[name="description"]')?.setAttribute("content", getTranslation(locale, "metaDescAbout"));
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
            {locale === "uk-UA" ? "Наша місія" : "Our Vision"}
          </span>
          <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
            {getTranslation(locale, "aboutTitle")}
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
            {getTranslation(locale, "aboutDesc")}
          </p>
        </section>

        {/* Narrative columns */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px", marginBottom: "80px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Terminal size={18} style={{ color: "var(--color-secondary)" }} />
              <h3 style={{ fontSize: "1.2rem" }}>{locale === "uk-UA" ? "Подолання психологічного бар'єру" : "Confidence in Technical Speech"}</h3>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              {locale === "uk-UA"
                ? "Багато розробників чудово кодують, але відчувають труднощі під час усної співбесіди англійською мовою. Наша платформа допомагає звикнути до голосової подачі та зняти хвилювання перед реальними технічними раундами."
                : "Many developers excel in writing code but freeze during face-to-face technical speech loops. TalkPrep matches voice synthesis with transcription to build your articulation confidence."}
            </p>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Cpu size={18} style={{ color: "var(--color-cyan)" }} />
              <h3 style={{ fontSize: "1.2rem" }}>{locale === "uk-UA" ? "Об'єктивна оцінка навичок" : "Objective Metrics Analytics"}</h3>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              {locale === "uk-UA"
                ? "Завдяки підключенню Google Gemini ШІ аналізує структуру відповідей без суб'єктивного відношення. Ви бачите чітку оцінку conceptual coverage та зауваження до вживання слів-паразитів."
                : "By utilizing the Google Gemini API, we eliminate bias. The platform focuses strictly on your technical vocabulary, keyword accuracy, and verbal patterns."}
            </p>
          </div>
        </section>

        {/* Team Section */}
        <section>
          <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "40px" }}>
            {locale === "uk-UA" ? "Наша команда" : "Meet the Innovators"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "30px" }}>
            {/* Team member 1 */}
            <div className="glass-card" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Code size={32} style={{ color: "#fff", margin: "0 auto" }} />
              </div>
              <strong style={{ fontSize: "1.1rem" }}>{locale === "uk-UA" ? "Михайло Долохов" : "Misha Doloh"}</strong>
              <p style={{ fontSize: "0.8rem", color: "var(--color-secondary)", marginTop: "4px", marginBottom: "12px" }}>
                Founder & Lead Architect
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                {locale === "uk-UA"
                  ? "Старший розробник, захоплюється штучним інтелектом та орієнтується в мовних технологіях."
                  : "Senior developer obsessed with microservices, voice synthesis systems, and SQLite scaling."}
              </p>
            </div>

            {/* Team member 2 */}
            <div className="glass-card" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cpu size={32} style={{ color: "#fff", margin: "0 auto" }} />
              </div>
              <strong style={{ fontSize: "1.1rem" }}>{locale === "uk-UA" ? "ШІ Коуч Gemini" : "Gemini AI Core"}</strong>
              <p style={{ fontSize: "0.8rem", color: "var(--color-cyan)", marginTop: "4px", marginBottom: "12px" }}>
                AI Recruiter & Grader
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                {locale === "uk-UA"
                  ? "Наш віртуальний мозок, який розбирає концепції, рахує слова-паразити та дає поради."
                  : "Virtual evaluator analyzing sentence depth, tracking speech pace, and generating ideal answer guides."}
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
