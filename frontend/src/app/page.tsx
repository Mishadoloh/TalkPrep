"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import { Mic, Search, Globe, Sparkles, Volume2 } from "lucide-react";
import { getTranslation, Locale } from "@/lib/translations";
import { playBeepSound } from "@/lib/audio-effects";

export default function GooglePage() {
  const [locale, setLocale] = useState<Locale>("en-US");

  // Search input state
  const [searchQuery, setSearchQuery] = useState("Frontend Engineer");

  // Sandbox Speech state
  const [isListening, setIsListening] = useState(false);
  const [sandboxTranscript, setSandboxTranscript] = useState("");
  const [recognitionSupported, setRecognitionSupported] = useState(true);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setRecognitionSupported(false);
      }
    }
  }, []);

  // SEO Metatags
  useEffect(() => {
    document.title = getTranslation(locale, "metaTitleHome");
    document.querySelector('meta[name="description"]')?.setAttribute("content", getTranslation(locale, "metaDescHome"));
  }, [locale]);

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
      playBeepSound();
      setSandboxTranscript(locale === "uk-UA" ? "Говоріть у мікрофон..." : "Listening... Speak now.");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setSandboxTranscript(finalTranscript || (locale === "uk-UA" ? "Продовжуйте говорити..." : "Keep speaking..."));
      setSearchQuery(finalTranscript); // Update query box on the fly!
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setTimeout(() => {
      if (recognition) recognition.stop();
    }, 15000);
  };

  const handleLanguageChange = (loc: Locale) => {
    localStorage.setItem("talkprep_locale", loc);
    setLocale(loc);
    window.dispatchEvent(new CustomEvent("locale-changed", { detail: loc }));
  };

  return (
    <>
      <Header />
      <BackgroundBlobs />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px 100px" }}>
        
        {/* GOOGLE LOGO IN GOOGLE COLOR ACCENTS */}
        <section style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "5rem", fontWeight: 800, letterSpacing: "-0.05em", userSelect: "none", display: "flex", justifyContent: "center" }}>
            <span style={{ color: "#4285f4" }}>T</span>
            <span style={{ color: "#ea4335" }}>a</span>
            <span style={{ color: "#fbbc05" }}>l</span>
            <span style={{ color: "#4285f4" }}>k</span>
            <span style={{ color: "#34a853" }}>P</span>
            <span style={{ color: "#ea4335" }}>r</span>
            <span style={{ color: "#fbbc05" }}>e</span>
            <span style={{ color: "#34a853" }}>p</span>
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem", marginTop: "-10px", fontWeight: 500 }}>
            {locale === "uk-UA" ? "ШІ-Тренажер Технічних Співбесід" : "AI Technical Interview Search engine"}
          </p>
        </section>

        {/* GOOGLE PILL SEARCH INPUT BOX */}
        <section style={{ width: "100%", maxWidth: "600px", marginBottom: "30px", position: "relative" }}>
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              background: "rgba(255, 255, 255, 0.03)", 
              border: isListening ? "1.5px solid var(--color-secondary)" : "1.5px solid var(--border-color)", 
              boxShadow: isListening ? "0 0 20px var(--color-secondary-glow)" : "0 4px 12px rgba(0,0,0,0.15)",
              padding: "14px 20px", 
              borderRadius: "var(--radius-full)", 
              transition: "var(--transition-normal)"
            }}
          >
            <Search size={18} style={{ color: "var(--color-text-muted)", marginRight: "12px" }} />
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-primary)",
                fontSize: "1.05rem",
                width: "100%",
                outline: "none"
              }}
              placeholder={locale === "uk-UA" ? "Яку вакансію практикуємо?" : "What engineering role do you want to practice?"}
            />

            {/* Simulated Google Voice Mic Button */}
            <button
              onClick={toggleSandboxListening}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none"
              }}
              title={locale === "uk-UA" ? "Усний ввід" : "Voice Practice Input"}
            >
              <Mic 
                size={20} 
                style={{ 
                  color: isListening ? "var(--color-secondary)" : "#4285f4",
                  filter: isListening ? "drop-shadow(0 0 8px var(--color-secondary))" : "none",
                  transition: "color 0.2s"
                }} 
              />
            </button>
          </div>

          {/* Sandbox spoken results overlay inside the Google flow */}
          {isListening && (
            <div 
              className="glass-card" 
              style={{ 
                position: "absolute", 
                top: "65px", 
                left: 0, 
                right: 0, 
                padding: "20px", 
                border: "1px solid var(--border-glow)",
                zIndex: 10,
                textAlign: "center"
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "12px" }}>
                <span className="dot" style={{ background: "#4285f4", width: "8px", height: "8px", borderRadius: "50%", animation: "pulseGlow 1s infinite" }}></span>
                <span className="dot" style={{ background: "#ea4335", width: "8px", height: "8px", borderRadius: "50%", animation: "pulseGlow 1.2s infinite" }}></span>
                <span className="dot" style={{ background: "#fbbc05", width: "8px", height: "8px", borderRadius: "50%", animation: "pulseGlow 1.4s infinite" }}></span>
                <span className="dot" style={{ background: "#34a853", width: "8px", height: "8px", borderRadius: "50%", animation: "pulseGlow 1.6s infinite" }}></span>
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                {sandboxTranscript}
              </p>
            </div>
          )}
        </section>

        {/* GOOGLE ACTION BUTTONS */}
        <section style={{ display: "flex", gap: "12px", marginBottom: "50px" }}>
          <Link href="/register" className="btn btn-secondary" style={{ padding: "10px 20px", fontSize: "0.9rem", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            {locale === "uk-UA" ? "Шукати співбесіду" : "Interview Me"}
          </Link>
          <button 
            onClick={() => {
              setSandboxTranscript(locale === "uk-UA" ? "«Реакт віртуальний дом це легка копія реального дома»" : "“React Virtual DOM is a lightweight copy of the real DOM.”");
              toggleSandboxListening();
            }} 
            className="btn btn-secondary" 
            style={{ padding: "10px 20px", fontSize: "0.9rem", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}
          >
            {locale === "uk-UA" ? "Мені пощастить (Тест)" : "I'm Feeling Lucky"}
          </button>
        </section>

        {/* GOOGLE LOCALIZED OFFERS */}
        <section style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", display: "flex", gap: "8px", alignItems: "center" }}>
          <Globe size={14} style={{ color: "var(--color-text-muted)" }} />
          <span>
            {locale === "uk-UA" ? "Тренажер доступний мовами:" : "TalkPrep offered in:"}
          </span>
          <button onClick={() => handleLanguageChange("en-US")} style={{ background: "transparent", border: "none", color: "#4285f4", cursor: "pointer", textDecoration: "underline", outline: "none" }}>English</button>
          <button onClick={() => handleLanguageChange("uk-UA")} style={{ background: "transparent", border: "none", color: "#4285f4", cursor: "pointer", textDecoration: "underline", outline: "none" }}>Українська</button>
        </section>

        {/* SYSTEM HIGHLIGHT CARDS (GOOGLE INTEGRATION) */}
        <section style={{ width: "100%", maxWidth: "900px", marginTop: "80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          <div className="glass-card" style={{ padding: "24px", borderLeft: "4px solid #4285f4" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "var(--color-text-primary)" }}>
              {locale === "uk-UA" ? "ШІ-Грейдинг Google Gemini" : "Google Gemini Grading"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              {locale === "uk-UA" 
                ? "Миттєвий розбір відповідей моделлю gemini-2.5-flash із підрахунком слів-паразитів." 
                : "Real-time query evaluations run through gemini-2.5-flash to assess your exact vocabulary."}
            </p>
          </div>

          <div className="glass-card" style={{ padding: "24px", borderLeft: "4px solid #ea4335" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "var(--color-text-primary)" }}>
              {locale === "uk-UA" ? "Голосовий Синтез мовлення" : "Voice Synthesis Engine"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              {locale === "uk-UA"
                ? "Усні питання озвучуються реалістичним рекрутерським темпом на 15 мовах."
                : "Questions read out loud by the browser voice engine to build strong auditory memory."}
            </p>
          </div>

          <div className="glass-card" style={{ padding: "24px", borderLeft: "4px solid #fbbc05" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "var(--color-text-primary)" }}>
              {locale === "uk-UA" ? "Аудіо-кліки та звуки" : "Auditory Micro-chimes"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              {locale === "uk-UA"
                ? "Система відтворює нативні технічні звукові сигнали та успішні акорди."
                : "Synthesizer chords and beeps play automatically to guide your recording phases."}
            </p>
          </div>
        </section>

      </main>
    </>
  );
}
