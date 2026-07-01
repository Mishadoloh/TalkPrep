"use client";

import { useEffect, useState } from "react";
import { getTranslation, Locale } from "@/lib/translations";
import { Sparkles, Terminal, Code, Cpu } from "lucide-react";

export default function AboutPage() {
  const [locale, setLocale] = useState<Locale>("en-US");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredNarrative, setHoveredNarrative] = useState<number | null>(null);

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
          <div
            onMouseEnter={() => setHoveredNarrative(1)}
            onMouseLeave={() => setHoveredNarrative(null)}
            style={{
              background: "rgba(30, 41, 59, 0.25)",
              border: "1px solid " + (hoveredNarrative === 1 ? "rgba(124, 77, 255, 0.35)" : "rgba(255, 255, 255, 0.05)"),
              borderRadius: "20px",
              padding: "30px",
              boxShadow: hoveredNarrative === 1 ? "0 16px 35px -10px rgba(124, 77, 255, 0.15)" : "0 4px 20px rgba(0, 0, 0, 0.1)",
              transform: hoveredNarrative === 1 ? "translateY(-4px)" : "translateY(0)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "10px", background: "rgba(124, 77, 255, 0.1)", border: "1px solid rgba(124, 77, 255, 0.2)" }}>
                <Terminal size={18} style={{ color: "var(--color-secondary)" }} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>{locale === "uk-UA" ? "Подолання психологічного бар'єру" : "Confidence in Technical Speech"}</h3>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              {locale === "uk-UA"
                ? "Багато розробників чудово кодують, але відчувають труднощі під час усної співбесіди англійською мовою. Наша платформа допомагає звикнути до голосової подачі та зняти хвилювання перед реальними технічними раундами."
                : "Many developers excel in writing code but freeze during face-to-face technical speech loops. TalkPrep matches voice synthesis with transcription to build your articulation confidence."}
            </p>
          </div>

          <div
            onMouseEnter={() => setHoveredNarrative(2)}
            onMouseLeave={() => setHoveredNarrative(null)}
            style={{
              background: "rgba(30, 41, 59, 0.25)",
              border: "1px solid " + (hoveredNarrative === 2 ? "rgba(6, 182, 212, 0.35)" : "rgba(255, 255, 255, 0.05)"),
              borderRadius: "20px",
              padding: "30px",
              boxShadow: hoveredNarrative === 2 ? "0 16px 35px -10px rgba(6, 182, 212, 0.15)" : "0 4px 20px rgba(0, 0, 0, 0.1)",
              transform: hoveredNarrative === 2 ? "translateY(-4px)" : "translateY(0)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "10px", background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.2)" }}>
                <Cpu size={18} style={{ color: "var(--color-cyan)" }} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>{locale === "uk-UA" ? "Об'єктивна оцінка навичок" : "Objective Metrics Analytics"}</h3>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              {locale === "uk-UA"
                ? "Завдяки підключенню Google Gemini ШІ аналізує структуру відповідей без суб'єктивного відношення. Ви бачите чітку оцінку conceptual coverage та зауваження до вживання слів-паразитів."
                : "By utilizing the Google Gemini API, we eliminate bias. The platform focuses strictly on your technical vocabulary, keyword accuracy, and verbal patterns."}
            </p>
          </div>
        </section>

        {/* Team Section */}
        <section style={{ position: "relative" }}>
          <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "40px", fontWeight: 700 }}>
            {locale === "uk-UA" ? "Наша команда" : "Meet the Innovators"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "30px" }}>
            {[
              {
                id: 1,
                name: locale === "uk-UA" ? "Мацола Дмитро" : "Dmytro Matsola",
                role: "Chief Executive Officer (CEO)",
                photo: "/avatar_dmytro.png?v=5",
                color: "rgba(59, 130, 246, 0.7)",
                glowColor: "rgba(59, 130, 246, 0.25)",
                bioUk: "Має понад 10 років досвіду управління стартапами в сфері мовленнєвих технологій та ШІ.",
                bioEn: "Over 10 years of experience managing speech technology and conversational AI startups."
              },
              {
                id: 2,
                name: locale === "uk-UA" ? "Дьолог Михайло" : "Mykhailo Doloh",
                role: "Founder & Lead Architect",
                photo: "/avatar_mykhailo.png?v=4",
                color: "rgba(168, 85, 247, 0.7)",
                glowColor: "rgba(168, 85, 247, 0.25)",
                bioUk: "Старший розробник, захоплюється штучним інтелектом та орієнтується в мовних технологіях.",
                bioEn: "Senior developer obsessed with microservices, voice synthesis systems, and SQLite scaling."
              },
              {
                id: 3,
                name: locale === "uk-UA" ? "Фіцай Михайло" : "Mykhailo Fitsay",
                role: "Lead AI Researcher",
                photo: "/avatar_fitsay.png?v=4",
                color: "rgba(6, 182, 212, 0.7)",
                glowColor: "rgba(6, 182, 212, 0.25)",
                bioUk: "Експерт з обробки природної мови, спеціалізується на архітектурі великих мовних моделей.",
                bioEn: "Natural Language Processing expert, specializing in Large Language Model architectures."
              },
              {
                id: 4,
                name: locale === "uk-UA" ? "Бердарь Каріна" : "Karyna Berdar",
                role: "Head of Product & UX",
                photo: "/avatar_karyna.png?v=4",
                color: "rgba(236, 72, 153, 0.7)",
                glowColor: "rgba(236, 72, 153, 0.25)",
                bioUk: "Створює інтуїтивно зрозумілі інтерфейси, орієнтовані на користувачів, та керує життєвим циклом продукту.",
                bioEn: "Designs intuitive, user-centric interfaces and oversees the product lifecycle and feedback loops."
              }
            ].map(member => (
              <div
                key={member.id}
                onMouseEnter={() => setHoveredCard(member.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: "40px 24px",
                  textAlign: "center",
                  background: hoveredCard === member.id ? "rgba(15, 23, 42, 0.75)" : "rgba(15, 23, 42, 0.4)",
                  border: hoveredCard === member.id ? `1px solid ${member.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "20px",
                  boxShadow: hoveredCard === member.id ? `0 25px 50px -12px ${member.glowColor}` : "0 8px 30px rgba(0, 0, 0, 0.2)",
                  transform: hoveredCard === member.id ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "default"
                }}
              >
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    margin: "0 auto 20px",
                    border: "2px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: hoveredCard === member.id
                      ? `0 0 25px ${member.color}`
                      : "0 4px 15px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.4s ease",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(15, 23, 42, 0.6)"
                  }}
                >
                  <img
                    src={member.photo}
                    alt={member.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: hoveredCard === member.id ? "scale(1.1)" : "scale(1)",
                      transition: "transform 0.4s ease"
                    }}
                  />
                </div>
                <strong style={{ fontSize: "1.2rem", color: "#fff", display: "block" }}>{member.name}</strong>
                <span style={{ fontSize: "0.85rem", color: member.color, marginTop: "4px", display: "inline-block", fontWeight: 600 }}>
                  {member.role}
                </span>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: "1.5", marginTop: "16px" }}>
                  {locale === "uk-UA" ? member.bioUk : member.bioEn}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
