"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import { Mic, CheckCircle, Flame, Star, Volume2, Sparkles } from "lucide-react";
import { getTranslation, Locale } from "@/lib/translations";

export default function MarketingPage() {
  const [locale, setLocale] = useState<Locale>("en-US");

  // Mini Sandbox State for Realtime Speech-to-Text demo
  const [isListening, setIsListening] = useState(false);
  const [sandboxTranscript, setSandboxTranscript] = useState("");
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  useEffect(() => {
    // Read initial locale
    const saved = localStorage.getItem("talkprep_locale") as Locale;
    if (saved) setLocale(saved);

    // Subscribe to locale updates
    const handleLocale = (e: Event) => {
      const detail = (e as CustomEvent).detail as Locale;
      if (detail) setLocale(detail);
    };

    window.addEventListener("locale-changed", handleLocale);
    return () => window.removeEventListener("locale-changed", handleLocale);
  }, []);

  useEffect(() => {
    // Check speech recognition support
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setRecognitionSupported(false);
      }
    }
  }, []);

  const toggleSandboxListening = () => {
    if (!recognitionSupported) {
      alert("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale;

    recognition.onstart = () => {
      setIsListening(true);
      setSandboxTranscript(locale === "uk-UA" ? "Слухаємо відповідь... Говоріть у мікрофон." : "Listening... Speak into your microphone.");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setSandboxTranscript(finalTranscript || (locale === "uk-UA" ? "Продовжуйте говорити..." : "Keep speaking..."));
    };

    recognition.onerror = (e: any) => {
      console.error("Speech error:", e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Start recognition
    recognition.start();

    // Auto-stop after 15 seconds to avoid battery/processing drain in demo
    setTimeout(() => {
      if (recognition) {
        recognition.stop();
      }
    }, 15000);
  };

  return (
    <>
      <Header />
      <BackgroundBlobs />

      <main style={{ flex: 1, paddingBottom: "80px" }}>
        {/* 1. Hero Section */}
        <section style={{ textAlign: "center", padding: "80px 24px 60px", maxWidth: "800px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(124, 77, 255, 0.1)",
              border: "1px solid rgba(124, 77, 255, 0.2)",
              padding: "6px 16px",
              borderRadius: "9999px",
              color: "var(--color-text-primary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "24px",
            }}
          >
            <Sparkles size={14} style={{ color: "var(--color-secondary)" }} />
            {locale === "uk-UA" ? "Голосові технічні співбесіди нового покоління" : "Next-Gen AI Mock Technical Interviews"}
          </div>
          
          <h1 style={{ fontSize: "3.5rem", lineHeight: "1.1", marginBottom: "20px" }}>
            {getTranslation(locale, "heroTitle")}{" "}
            <span className="gradient-text-primary">{getTranslation(locale, "heroHighlight")}</span>
          </h1>
          <p style={{ fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 36px", lineHeight: "1.6", color: "var(--color-text-secondary)" }}>
            {getTranslation(locale, "heroDesc")}
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "1rem" }}>
              {locale === "uk-UA" ? "Почати співбесіду" : "Start Free Session"}
            </Link>
            <a href="#features" className="btn btn-secondary" style={{ padding: "14px 32px", fontSize: "1rem" }}>
              {locale === "uk-UA" ? "Дізнатись більше" : "Learn More"}
            </a>
          </div>
        </section>

        {/* 2. Interactive Voice Demo Sandbox */}
        <section style={{ padding: "0 24px 60px", maxWidth: "700px", margin: "0 auto" }}>
          <div className="glass-card" style={{ padding: "30px", border: "1px solid rgba(124, 77, 255, 0.25)", position: "relative" }}>
            <div style={{ position: "absolute", top: "-12px", right: "20px" }}>
              <span className="badge badge-pro" style={{ background: "var(--color-secondary)", color: "var(--bg-primary)", fontSize: "0.75rem", fontWeight: 700 }}>
                {locale === "uk-UA" ? "ТЕСТОВИЙ МІКРОФОН" : "INTERACTIVE DEMO"}
              </span>
            </div>
            
            <h3 style={{ fontSize: "1.3rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Volume2 size={20} style={{ color: "var(--color-secondary)" }} />
              {locale === "uk-UA" ? "Перевірте свій голосовий пристрій" : "Test Your Voice Interface Now"}
            </h3>
            <p style={{ fontSize: "0.95rem", marginBottom: "20px", color: "var(--color-text-secondary)" }}>
              {locale === "uk-UA" 
                ? "Увімкніть дозвіл на використання мікрофона, натисніть кнопку нижче та скажіть:" 
                : "Enable microphone permissions, click the button below, and say:"} <br />
              <strong style={{ color: "var(--color-text-primary)" }}>
                {locale === "uk-UA" 
                  ? "«Реакт віртуальний дом це легка копія реального дома.»" 
                  : "“React Virtual DOM is a lightweight copy of the real DOM.”"}
              </strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              <button
                onClick={toggleSandboxListening}
                className={`btn ${isListening ? "btn-cyan" : "btn-primary"}`}
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isListening ? "var(--shadow-glow-cyan)" : "var(--shadow-glow)",
                  animation: isListening ? "pulseGlow 1s infinite alternate" : "none",
                }}
                title={isListening ? "Click to stop" : "Click to speak"}
              >
                <Mic size={28} />
              </button>

              <div
                style={{
                  width: "100%",
                  minHeight: "80px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                  color: sandboxTranscript ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  textAlign: "center",
                }}
              >
                {sandboxTranscript || (locale === "uk-UA" ? "Результат розпізнавання з'явиться тут в реальному часі..." : "Your real-time transcription will print here...")}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Features Grid */}
        <section id="features" style={{ padding: "80px 24px", borderTop: "1px solid var(--border-color)", background: "rgba(255, 255, 255, 0.01)" }}>
          <div className="container">
            <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "48px" }}>
              {locale === "uk-UA" ? "Чому розробники обирають TalkPrep" : "Why Developers Practice on TalkPrep"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ background: "rgba(124, 77, 255, 0.1)", width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Flame style={{ color: "var(--color-secondary)" }} size={20} />
                </div>
                <h4 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
                  {locale === "uk-UA" ? "ШІ-Розбір та оцінка" : "AI Grade Report"}
                </h4>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  {locale === "uk-UA"
                    ? "Отримуйте миттєві бали від 0 до 100 за кожну технічну відповідь та дізнавайтеся, що саме ви пропустили з ідеальної відповіді."
                    : "Receive technical scorecards from 0 to 100 on every spoken answer and view exactly what keywords you missed."}
                </p>
              </div>

              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ background: "rgba(0, 229, 255, 0.1)", width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Mic style={{ color: "var(--color-cyan)" }} size={20} />
                </div>
                <h4 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
                  {locale === "uk-UA" ? "Усне мовлення" : "Real Out-Loud Speaking"}
                </h4>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  {locale === "uk-UA"
                    ? "Розпізнавання голосу зчитує ваші слова та відстежує зайві слова («ее», «мм», «типу»), допомагаючи покращити темп та впевненість."
                    : "Continuous voice captures track filler words like 'um' and 'like', improving pacing and technical phrasing."}
                </p>
              </div>

              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ background: "rgba(76, 175, 80, 0.1)", width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <CheckCircle style={{ color: "#4caf50" }} size={20} />
                </div>
                <h4 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
                  {locale === "uk-UA" ? "15 підтримуваних мов" : "15 Languages Integrated"}
                </h4>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  {locale === "uk-UA"
                    ? "Співбесіду можна проходити будь-якою з 15 мов. Система сама перемкне голос ШІ та мікрофон під вашу мову."
                    : "Complete practices in 15 different languages. Synthesizer and recognition translate context dynamically."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
