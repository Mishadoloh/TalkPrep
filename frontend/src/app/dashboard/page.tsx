"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import {
  Play,
  History,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Frown
} from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";
import { getTranslation, Locale } from "@/lib/translations";

interface User {
  id: string;
  email: string;
  username: string;
  isPro: boolean;
  credits: number;
  createdAt: string;
}

interface Question {
  id: string;
  questionText: string;
  score: number | null;
  critique: string | null;
  answerText: string | null;
  idealAnswer: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  status: string;
  overallScore: number | null;
  feedback: string | null;
  createdAt: string;
  questions: Question[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"practice" | "history" | "analytics" | "billing">("practice");
  const [user, setUser] = useState<User | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("en-US");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

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

  // Form State
  const [role, setRole] = useState("Frontend Engineer");
  const [level, setLevel] = useState("Mid");
  const [language, setLanguage] = useState("en-US");
  const [startingSession, setStartingSession] = useState(false);
  const [formError, setFormError] = useState("");

  // Billing Actions State
  const [billingLoading, setBillingLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/user");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          return data.user.id;
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (e) {
      router.push("/login");
    } finally {
      setAuthLoading(false);
    }
    return null;
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/interview/history");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInterviews(data.interviews);
        }
      }
    } catch (e) {
      console.error("Failed to load interview history:", e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchSession().then((userId) => {
      if (userId) {
        fetchHistory();
      }
    });

    const handleUserUpdate = () => {
      fetchSession();
      fetchHistory();
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setStartingSession(true);

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, level, language }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.dispatchEvent(new Event("user-updated"));
        router.push(`/interview/${data.interviewId}`);
      } else {
        setFormError(data.error || "Failed to start interview. Try again.");
      }
    } catch (err) {
      setFormError("A network error occurred. Please verify your connection.");
    } finally {
      setStartingSession(false);
    }
  };

  const handleCheckout = async (packType: "5_CREDITS" | "PRO_MONTHLY") => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packType }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        router.push(data.checkoutUrl);
      } else {
        alert(data.error || "Billing error occurred.");
      }
    } catch (e) {
      alert("Failed to initiate billing session.");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your Pro membership? You will lose unlimited mock sessions immediately.")) return;
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new Event("user-updated"));
        alert("Subscription cancelled successfully.");
      } else {
        alert(data.error || "Cancellation failed.");
      }
    } catch (e) {
      alert("Failed to cancel subscription.");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!confirm("This will overwrite your current history with mock completed technical interviews and payment logs. Proceed?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/dev/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new Event("user-updated"));
        alert("Database successfully populated! Refreshing statistics...");
      } else {
        alert(data.error || "Failed to seed database.");
      }
    } catch (e) {
      alert("Network error seeding sandbox data.");
    } finally {
      setSeeding(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
        <div style={{ color: "var(--color-text-secondary)", fontSize: "1.2rem", fontWeight: 500 }}>
          Authenticating session...
        </div>
      </div>
    );
  }

  // Analytics tab computed values
  const completedInterviews = interviews.filter((i) => i.status === "COMPLETED");
  const averageScore =
    completedInterviews.length > 0
      ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / completedInterviews.length)
      : 0;

  return (
    <>
      <Header />
      <BackgroundBlobs />

      <main className="container" style={{ flex: 1, padding: "40px 24px" }}>
        {/* User Welcome Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "6px" }}>{getTranslation(locale, "welcome")}, {user?.username}</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
              {locale === "uk-UA" ? "Практикуйте технічні співбесіди та відстежуйте свій прогрес." : "Practice mock tech sessions and track your communication scorecard."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleSeedData}
              className="btn btn-secondary"
              style={{
                padding: "8px 16px",
                fontSize: "0.9rem",
                border: "1px dashed var(--color-secondary)",
                borderRadius: "var(--radius-sm)",
              }}
              disabled={seeding}
            >
              {seeding ? getTranslation(locale, "loading") : getTranslation(locale, "seedingBtn")}
            </button>
            
            <span
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-color)",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {locale === "uk-UA" ? "Мова:" : "Role practicing:"} <span style={{ color: "var(--color-secondary)" }}>{role}</span>
            </span>
          </div>
        </div>

        {/* Dashboard Tabs Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "30px" }}>
          {/* Sidebar Navigation */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => setActiveTab("practice")}
              className="btn"
              style={{
                justifyContent: "flex-start",
                background: activeTab === "practice" ? "rgba(124, 77, 255, 0.15)" : "transparent",
                color: activeTab === "practice" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                border: "1px solid",
                borderColor: activeTab === "practice" ? "rgba(124, 77, 255, 0.3)" : "transparent",
                padding: "14px 20px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <Play size={18} style={{ color: activeTab === "practice" ? "var(--color-secondary)" : "inherit" }} />
              {getTranslation(locale, "practiceHub")}
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className="btn"
              style={{
                justifyContent: "flex-start",
                background: activeTab === "history" ? "rgba(124, 77, 255, 0.15)" : "transparent",
                color: activeTab === "history" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                border: "1px solid",
                borderColor: activeTab === "history" ? "rgba(124, 77, 255, 0.3)" : "transparent",
                padding: "14px 20px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <History size={18} style={{ color: activeTab === "history" ? "var(--color-secondary)" : "inherit" }} />
              {getTranslation(locale, "sessionHistory")}
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className="btn"
              style={{
                justifyContent: "flex-start",
                background: activeTab === "analytics" ? "rgba(124, 77, 255, 0.15)" : "transparent",
                color: activeTab === "analytics" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                border: "1px solid",
                borderColor: activeTab === "analytics" ? "rgba(124, 77, 255, 0.3)" : "transparent",
                padding: "14px 20px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <TrendingUp size={18} style={{ color: activeTab === "analytics" ? "var(--color-secondary)" : "inherit" }} />
              {getTranslation(locale, "performanceStats")}
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className="btn"
              style={{
                justifyContent: "flex-start",
                background: activeTab === "billing" ? "rgba(124, 77, 255, 0.15)" : "transparent",
                color: activeTab === "billing" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                border: "1px solid",
                borderColor: activeTab === "billing" ? "rgba(124, 77, 255, 0.3)" : "transparent",
                padding: "14px 20px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <CreditCard size={18} style={{ color: activeTab === "billing" ? "var(--color-secondary)" : "inherit" }} />
              {getTranslation(locale, "billingPortal")}
            </button>
          </aside>

          {/* Core Panel Content */}
          <section className="glass-card" style={{ padding: "30px", minHeight: "500px" }}>
            {/* 1. PRACTICE HUB */}
            {activeTab === "practice" && (
              <div>
                <h3 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>{getTranslation(locale, "startInterviewTitle")}</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "30px" }}>
                  {getTranslation(locale, "startInterviewDesc")}
                </p>

                {formError && (
                  <div
                    style={{
                      background: "rgba(255, 82, 82, 0.1)",
                      border: "1px solid rgba(255, 82, 82, 0.2)",
                      color: "var(--color-error)",
                      padding: "14px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.9rem",
                      marginBottom: "24px",
                    }}
                  >
                    {formError}
                  </div>
                )}

                <form onSubmit={handleStartInterview} style={{ maxWidth: "500px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="role">
                      {getTranslation(locale, "targetRole")}
                    </label>
                    <select
                      id="role"
                      className="form-input"
                      style={{ appearance: "none" }}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="Frontend Engineer">Frontend Engineer</option>
                      <option value="Backend Engineer">Backend Engineer</option>
                      <option value="Fullstack Engineer">Fullstack Engineer</option>
                      <option value="Product Manager">Product Manager</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="level">
                      {getTranslation(locale, "experienceLevel")}
                    </label>
                    <select
                      id="level"
                      className="form-input"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      required
                    >
                      <option value="Junior">{locale === "uk-UA" ? "Junior (Початківець)" : "Junior Practice"}</option>
                      <option value="Mid">{locale === "uk-UA" ? "Mid (Середній)" : "Mid Practice"}</option>
                      <option value="Senior">{locale === "uk-UA" ? "Senior (Сеньйор)" : "Senior Technical Practice"}</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: "36px" }}>
                    <label className="form-label" htmlFor="language">
                      {getTranslation(locale, "interviewLanguage")}
                    </label>
                    <select
                      id="language"
                      className="form-input"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      required
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                    disabled={startingSession}
                  >
                    <Play size={16} />
                    {startingSession ? (locale === "uk-UA" ? "Генерація питань ШІ..." : "Generating interview questions...") : getTranslation(locale, "launchBtn")}
                  </button>
                </form>

                {/* Info Alert on Credits */}
                <div
                  style={{
                    marginTop: "40px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <ShieldCheck size={36} style={{ color: "var(--color-secondary)", flexShrink: 0 }} />
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>{locale === "uk-UA" ? "Інструкція голосу" : "Voice loop instructions"}</strong>: {
                      locale === "uk-UA"
                        ? "Переконайтеся, що ваш мікрофон підключено. ШІ промовляє питання вголос і автоматично записує ваші відповіді. Кожна сесія списує 1 кредит для безкоштовних акаунтів, та є безлімітною для Pro."
                        : "Ensure your microphone is fully connected. The AI speaks questions out loud, and auto-records your response. Each session consumes 1 practice credit for free accounts, and is unlimited for Pro accounts."
                    }
                  </div>
                </div>
              </div>
            )}

            {/* 2. HISTORY REGISTRY */}
            {activeTab === "history" && (
              <div>
                <h3 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>{locale === "uk-UA" ? "Історія проведених співбесід" : "Practice Session Registry"}</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "30px" }}>
                  {locale === "uk-UA" ? "Переглядайте свої бали, зауваження та аналіз відповідей ШІ." : "Review your score card reports, critiques, and ideal answers keys."}
                </p>

                {dataLoading ? (
                  <div style={{ color: "var(--color-text-muted)" }}>Loading records...</div>
                ) : interviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <Frown size={48} style={{ color: "var(--color-text-muted)", marginBottom: "16px" }} />
                    <p style={{ color: "var(--color-text-secondary)" }}>No practice sessions registered yet.</p>
                    <button
                      onClick={() => setActiveTab("practice")}
                      className="btn btn-primary"
                      style={{ marginTop: "16px" }}
                    >
                      Start Practicing
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {interviews.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-sm)",
                          padding: "20px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <strong style={{ fontSize: "1.1rem" }}>{item.role}</strong>
                            <span className="badge badge-free" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                              {item.level}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            <span>&bull;</span>
                            {item.status === "COMPLETED" ? (
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-success)" }}>
                                <CheckCircle size={12} /> Completed
                              </span>
                            ) : (
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-warning)" }}>
                                <Clock size={12} /> In Progress
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                          {item.status === "COMPLETED" && (
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Score</span>
                              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-secondary)", fontFamily: "var(--font-mono)" }}>
                                {item.overallScore}/100
                              </div>
                            </div>
                          )}
                          
                          {item.status === "COMPLETED" ? (
                            <button
                              onClick={() => router.push(`/interview/${item.id}/result`)}
                              className="btn btn-secondary"
                              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                            >
                              Report Card
                              <ChevronRight size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/interview/${item.id}`)}
                              className="btn btn-primary"
                              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                            >
                              Resume
                              <ArrowUpRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. PERFORMANCE STATS */}
            {activeTab === "analytics" && (
              <div>
                <h3 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>Performance Analytics</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "30px" }}>
                  Analyze grading trends, average responses correctness, and improvement velocity.
                </p>

                {/* Scorecards Stats Blocks */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-color)",
                      padding: "20px",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                      Average Graded Score
                    </span>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-secondary)", fontFamily: "var(--font-mono)", marginTop: "8px" }}>
                      {averageScore > 0 ? `${averageScore}/100` : "N/A"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-color)",
                      padding: "20px",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                      Sessions Completed
                    </span>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-mono)", marginTop: "8px" }}>
                      {completedInterviews.length}
                    </div>
                  </div>
                </div>

                {/* Chart Section */}
                <div>
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Historical Progression (Recent 5 Runs)</h4>
                  {completedInterviews.length === 0 ? (
                    <div
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        background: "rgba(255, 255, 255, 0.01)",
                        border: "1px dashed var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Complete mock interviews to track your grade chart.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-around",
                        height: "220px",
                        background: "rgba(0, 0, 0, 0.2)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        padding: "30px 20px 10px",
                        position: "relative",
                      }}
                    >
                      {/* Grid Lines */}
                      <div style={{ position: "absolute", top: "25%", left: 0, right: 0, borderBottom: "1px dashed rgba(255,255,255,0.05)" }}></div>
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderBottom: "1px dashed rgba(255,255,255,0.05)" }}></div>
                      <div style={{ position: "absolute", top: "75%", left: 0, right: 0, borderBottom: "1px dashed rgba(255,255,255,0.05)" }}></div>

                      {[...completedInterviews].reverse().slice(0, 5).map((item, idx) => {
                        const score = item.overallScore || 0;
                        const isHovered = hoveredBarIndex === idx;
                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setHoveredBarIndex(idx)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              height: "100%",
                              justifyContent: "flex-end",
                              zIndex: 1,
                              width: "60px",
                              position: "relative",
                              cursor: "pointer"
                            }}
                          >
                            {isHovered && (
                              <div style={{
                                position: "absolute",
                                bottom: `${score * 1.5 + 40}px`,
                                background: "rgba(17, 15, 24, 0.95)",
                                border: "1px solid var(--border-glow)",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                color: "#fff",
                                whiteSpace: "nowrap",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                                zIndex: 10,
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                pointerEvents: "none"
                              }}>
                                <strong style={{ color: "var(--color-secondary)" }}>{item.role}</strong>
                                <span style={{ color: "var(--color-text-secondary)" }}>Level: {item.level}</span>
                                <span style={{ color: "var(--color-success)" }}>Score: {score}%</span>
                              </div>
                            )}
                            <span style={{ fontSize: "0.8rem", color: isHovered ? "var(--color-secondary-hover)" : "var(--color-secondary)", fontWeight: "bold", marginBottom: "6px", fontFamily: "var(--font-mono)", transition: "color var(--transition-fast)" }}>
                              {score}%
                            </span>
                            <div
                              style={{
                                width: "32px",
                                height: `${score * 1.5}px`,
                                background: isHovered 
                                  ? "linear-gradient(to top, var(--color-primary-hover) 0%, var(--color-secondary-hover) 100%)" 
                                  : "linear-gradient(to top, var(--color-primary) 0%, var(--color-secondary) 100%)",
                                borderRadius: "4px 4px 0 0",
                                boxShadow: isHovered ? "0 0 15px var(--color-secondary-glow)" : "var(--shadow-glow-cyan)",
                                transition: "height 0.8s ease, background 0.2s, box-shadow 0.2s, transform 0.2s",
                                transform: isHovered ? "scaleX(1.15)" : "scaleX(1)",
                                transformOrigin: "bottom center"
                              }}
                            ></div>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: isHovered ? "var(--color-text-primary)" : "var(--color-text-muted)",
                                marginTop: "8px",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                width: "60px",
                                transition: "color var(--transition-fast)"
                              }}
                              title={item.role}
                            >
                              Run {idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. BILLING PORTAL */}
            {activeTab === "billing" && (
              <div>
                <h3 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>{locale === "uk-UA" ? "Тарифні плани та оплата" : "Billing & Subscriptions"}</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "30px" }}>
                  {locale === "uk-UA" ? "Керуйте своїми підписками, купуйте пакети кредитів або переходьте на Pro." : "Manage subscriptions, purchase additional interview credits, and review billing status."}
                </p>

                {/* Subscription status banner */}
                <div
                  style={{
                    background: user?.isPro ? "rgba(124, 77, 255, 0.1)" : "rgba(255, 255, 255, 0.02)",
                    border: "1px solid",
                    borderColor: user?.isPro ? "var(--color-primary)" : "var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "24px",
                    marginBottom: "36px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                      {locale === "uk-UA" ? "Поточний тариф" : "Current Plan"}
                    </span>
                    <h4 style={{ fontSize: "1.5rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                      {user?.isPro ? (
                        <>
                          <Sparkles size={20} style={{ color: "var(--color-secondary)" }} />
                          {locale === "uk-UA" ? "Безлімітна PRO Підписка" : "Unlimited Pro Subscription"}
                        </>
                      ) : (
                        locale === "uk-UA" ? "Безкоштовний тариф" : "Free Practice Tier"
                      )}
                    </h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                      {user?.isPro
                        ? (locale === "uk-UA" ? "Активна підписка. Автоматичне подовження включено." : "Active subscription. Automatic renewal enabled.")
                        : (locale === "uk-UA" ? `У вас залишилося ${user?.credits} кредитів для проходження співбесід.` : `You have ${user?.credits} interview session credits left.`)}
                    </p>
                  </div>

                  {user?.isPro && (
                    <button
                      onClick={handleCancelSubscription}
                      className="btn btn-secondary"
                      style={{ border: "1px solid rgba(255, 82, 82, 0.3)", color: "var(--color-error)" }}
                      disabled={billingLoading}
                    >
                      {locale === "uk-UA" ? "Скасувати підписку" : "Cancel Subscription"}
                    </button>
                  )}
                </div>

                {!user?.isPro && (
                  <div>
                    <h4 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Upgrade Options</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                      {/* Buy Credit Pack */}
                      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <strong style={{ fontSize: "1.1rem" }}>5-Interview Credit Pack</strong>
                          <p style={{ fontSize: "0.8rem", margin: "8px 0 16px 0", color: "var(--color-text-secondary)" }}>
                            Add 5 practice session credits to your account. Credits do not expire.
                          </p>
                          <div style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "20px" }}>
                            $15.00 <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 500 }}>once</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCheckout("5_CREDITS")}
                          className="btn btn-secondary"
                          style={{ width: "100%" }}
                          disabled={billingLoading}
                        >
                          {billingLoading ? "Loading..." : "Purchase Credits"}
                        </button>
                      </div>

                      {/* Upgrade to Pro */}
                      <div
                        className="glass-card"
                        style={{
                          padding: "24px",
                          border: "1px solid var(--color-primary)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 0 15px rgba(124, 77, 255, 0.15)",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Sparkles size={16} style={{ color: "var(--color-secondary)" }} />
                            Unlimited Pro Membership
                          </strong>
                          <p style={{ fontSize: "0.8rem", margin: "8px 0 16px 0", color: "var(--color-text-secondary)" }}>
                            Practice unlimited mock interviews, unlock all roles, and track detailed grading report histories.
                          </p>
                          <div style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "20px" }}>
                            $29.00 <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 500 }}>/ month</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCheckout("PRO_MONTHLY")}
                          className="btn btn-primary"
                          style={{ width: "100%" }}
                          disabled={billingLoading}
                        >
                          {billingLoading ? "Loading..." : "Upgrade Now"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
