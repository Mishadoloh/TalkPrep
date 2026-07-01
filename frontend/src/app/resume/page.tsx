"use client";

import { useRef, useState } from "react";
import { FileText, Plus, Sparkles, Upload, X } from "lucide-react";

type ResumeDraft = {
  title: string;
  role: string;
  updatedAt: string;
  score: number;
};

export default function ResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<ResumeDraft[]>([]);

  const createResume = () => {
    setResumes((current) => [
      {
        title: "Моє резюме",
        role: "Frontend Developer",
        updatedAt: "щойно",
        score: 0,
      },
      ...current,
    ]);
  };

  const importResume = () => {
    inputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumes((current) => [
      {
        title: file.name.replace(/\.pdf$/i, ""),
        role: "Імпортовано з PDF",
        updatedAt: "щойно",
        score: 0,
      },
      ...current,
    ]);

    event.target.value = "";
  };

  const removeResume = (index: number) => {
    setResumes((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div
      className="page-content"
      style={{
        width: "100%",
        maxWidth: 1180,
        margin: "0 auto",
        padding: "34px 40px 100px",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleImport}
        style={{ display: "none" }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          marginBottom: 30,
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", lineHeight: 1.1, marginBottom: 8 }}>
            Мої резюме
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Створюй, оптимізуй та завантажуй резюме
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={importResume}
            className="btn btn-secondary"
            style={{
              height: 48,
              padding: "0 18px",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              color: "var(--text-primary)",
              background: "transparent",
            }}
          >
            <Upload size={18} />
            Імпорт з PDF
          </button>

          <button
            type="button"
            onClick={createResume}
            className="btn btn-primary"
            style={{
              height: 48,
              padding: "0 20px",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              boxShadow: "none",
            }}
          >
            <Plus size={18} />
            Нове резюме
          </button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <section
          style={{
            minHeight: 332,
            border: "1px dashed rgba(157, 141, 247, 0.22)",
            borderRadius: 22,
            background: "rgba(22, 28, 42, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 22,
                background: "rgba(108, 92, 231, 0.24)",
                color: "#b5acff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <FileText size={30} />
            </div>

            <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>
              Ще немає резюме
            </h2>
            <p style={{ fontSize: "0.95rem", marginBottom: 26 }}>
              Створи перше резюме, щоб почати.
            </p>

            <button
              type="button"
              onClick={createResume}
              className="btn btn-primary"
              style={{
                height: 46,
                padding: "0 22px",
                borderRadius: "var(--radius-md)",
                fontWeight: 800,
                boxShadow: "none",
              }}
            >
              <Sparkles size={18} />
              Нове резюме
            </button>
          </div>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {resumes.map((resume, index) => (
            <article
              key={`${resume.title}-${index}`}
              className="glass-card"
              style={{
                padding: 20,
                minHeight: 176,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "rgba(108, 92, 231, 0.16)",
                      color: "var(--accent-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={22} />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeResume(index)}
                    aria-label="Видалити резюме"
                    className="topbar-icon-btn"
                    style={{ width: 32, height: 32 }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <h2 style={{ fontSize: "1.05rem", marginBottom: 6 }}>{resume.title}</h2>
                <p style={{ fontSize: "0.85rem" }}>{resume.role}</p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Оновлено {resume.updatedAt}
                </span>
                <span className="badge badge-pro">ATS {resume.score}%</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
