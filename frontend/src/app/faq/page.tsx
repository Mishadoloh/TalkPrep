"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import { getTranslation, Locale } from "@/lib/translations";
import { ChevronDown, Sparkles } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQPage() {
  const [locale, setLocale] = useState<Locale>("en-US");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
    document.title = getTranslation(locale, "metaTitleFaq");
    document.querySelector('meta[name="description"]')?.setAttribute("content", getTranslation(locale, "metaDescFaq"));
  }, [locale]);

  const faqs: FAQItem[] = locale === "uk-UA" ? [
    {
      q: "Як розпочати практичну співбесіду?",
      a: "Перейдіть до Панелі управління, виберіть потрібну вакансію (наприклад, Frontend Engineer), рівень досвіду (Junior, Mid, Senior) та мову співбесіди, після чого натисніть кнопку «Запустити голосову співбесіду». Система згенерує 3 запитання."
    },
    {
      q: "Які веб-браузери підтримуються для голосового вводу?",
      a: "Розпізнавання та синтез мовлення працюють на базі нативного API Web Speech. Цей стандарт повноцінно підтримується у браузерах Google Chrome, Microsoft Edge та Apple Safari. Mozilla Firefox не підтримує розпізнавання голосу за замовчуванням."
    },
    {
      q: "Чи знімаються з моєї картки реальні гроші під час тестової покупки?",
      a: "Ні, платформа використовує симуляційний інтерфейс Stripe Checkout. Ви можете вказати будь-які вигадані реквізити картки. Жодні фінансові списання не проводяться, оскільки це навчальна пісочниця."
    },
    {
      q: "Як працює ШІ-оцінювання відповідей?",
      a: "Якщо ви налаштували API ключ Google Gemini в конфігурації оточення (.env), система надсилає ваші транскрипти до моделі gemini-2.5-flash. ШІ порівнює відповідь із еталоном за концептуальною повнотою, підраховує слова-паразити та повертає текстові рекомендації. Якщо ключа немає, використовується локальний текстовий аналізатор."
    },
    {
      q: "Як додати свій власний API-ключ Gemini?",
      a: "У кореневій папці проекту перейменуйте файл `.env.example` на `.env` та вкажіть ваш ключ у рядку `GEMINI_API_KEY=ваш_ключ`. Перезапустіть мікросервіси, щоб увімкнути динамічне ШІ-оцінювання."
    }
  ] : [
    {
      q: "How do I start a mock technical interview?",
      a: "Log in to your Dashboard, navigate to the Practice Hub tab, choose your target role, experience level, and preferred interview language. Click the 'Launch Voice Interview Session' button, and the system will present 3 technical questions."
    },
    {
      q: "Which web browsers support the voice microphone recording?",
      a: "The voice terminal relies on the browser's native Web Speech API. This standard is fully supported in Google Chrome, Microsoft Edge, and Apple Safari. Mozilla Firefox does not support speech recognition by default."
    },
    {
      q: "Are real funds charged during simulated Stripe checkouts?",
      a: "No. The checkout portal emulates a secure payment gateway sandbox. You can enter mock card details to test subscriptions and packs without any real money transactions."
    },
    {
      q: "How does the AI grade my technical answers?",
      a: "When a GEMINI_API_KEY is configured in the environment variables, the system queries the gemini-2.5-flash model. The AI reviews your spoken transcript against reference keys, flags conceptual missing points, counts filler habits, and generates grading advice."
    },
    {
      q: "How do I activate the live Google Gemini API connection?",
      a: "Rename the `.env.example` file in the root folder to `.env` and set `GEMINI_API_KEY=your_key`. The orchestrator will automatically pick it up to execute dynamic technical reviews."
    }
  ];

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
            FAQ
          </span>
          <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
            {getTranslation(locale, "faqTitle")}
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
            {getTranslation(locale, "faqDesc")}
          </p>
        </section>

        {/* FAQ Accordion List */}
        <section style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{
                  border: isOpen ? "1px solid rgba(124, 77, 255, 0.4)" : "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  transition: "var(--transition-normal)"
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  style={{
                    width: "100%",
                    padding: "24px",
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--color-text-primary)",
                    outline: "none"
                  }}
                >
                  <strong style={{ fontSize: "1.05rem", paddingRight: "15px" }}>{item.q}</strong>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform var(--transition-normal)",
                      color: isOpen ? "var(--color-secondary)" : "var(--color-text-muted)",
                      flexShrink: 0
                    }}
                  />
                </button>
                
                {isOpen && (
                  <div
                    style={{
                      padding: "0 24px 24px 24px",
                      fontSize: "0.95rem",
                      color: "var(--color-text-secondary)",
                      lineHeight: "1.6",
                      borderTop: "1.5px solid var(--border-color)",
                      paddingTop: "20px",
                      background: "rgba(0,0,0,0.15)"
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </>
  );
}
