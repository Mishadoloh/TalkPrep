"use client";

import { useEffect, useState } from "react";
import { getTranslation, Locale } from "@/lib/translations";
import { Mail, Sparkles, Send } from "lucide-react";

export default function ContactPage() {
  const [locale, setLocale] = useState<Locale>("en-US");
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

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
    document.title = getTranslation(locale, "metaTitleContact");
    document.querySelector('meta[name="description"]')?.setAttribute("content", getTranslation(locale, "metaDescContact"));
  }, [locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSending(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send message");
      }
    } catch (err) {
      alert("Failed to connect to the server");
    } finally {
      setSending(false);
    }
  };

  return (
    <>

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
            {locale === "uk-UA" ? "Підтримка" : "Help Desk"}
          </span>
          <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
            {getTranslation(locale, "contactTitle")}
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
            {getTranslation(locale, "contactDesc")}
          </p>
        </section>

        {/* Contact Form Card */}
        <section style={{ maxWidth: "550px", margin: "0 auto" }}>
          <div className="glass-card" style={{ padding: "40px", border: "1px solid var(--border-glow)", position: "relative" }}>
            <div style={{ position: "absolute", top: "-12px", right: "20px" }}>
              <span className="badge badge-pro" style={{ background: "var(--color-secondary)", color: "var(--bg-primary)", fontSize: "0.75rem", fontWeight: 700 }}>
                SECURE GATEWAY
              </span>
            </div>

            {success ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ background: "rgba(0, 229, 255, 0.1)", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Mail style={{ color: "var(--color-secondary)" }} size={24} />
                </div>
                <h3 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>
                  {locale === "uk-UA" ? "Повідомлення надіслано!" : "Message Sent Successfully!"}
                </h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "24px" }}>
                  {getTranslation(locale, "messageSuccess")}
                </p>
                <button onClick={() => setSuccess(false)} className="btn btn-secondary">
                  {locale === "uk-UA" ? "Надіслати ще одне" : "Send Another Message"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label className="form-label" htmlFor="name">
                    {getTranslation(locale, "nameLabel")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label className="form-label" htmlFor="email">
                    {getTranslation(locale, "emailLabel")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "30px" }}>
                  <label className="form-label" htmlFor="message">
                    {getTranslation(locale, "messageLabel")}
                  </label>
                  <textarea
                    id="message"
                    className="form-input"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder={locale === "uk-UA" ? "Введіть ваше запитання..." : "How can we help you?"}
                    style={{ resize: "vertical", minHeight: "120px" }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                  disabled={sending}
                >
                  <Send size={16} />
                  {sending ? getTranslation(locale, "loading") : getTranslation(locale, "submitBtn")}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
