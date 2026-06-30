"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  FileText,
  Volume2,
  Sparkles
} from "lucide-react";
import { playSuccessSound } from "@/lib/audio-effects";

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

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQuestionTab, setActiveQuestionTab] = useState(0);

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setInterview(data.interview);
          playSuccessSound();
        } else {
          setError(data.error || "Failed to load scorecard details.");
        }
      } catch (e) {
        setError("Error communicating with mock interview service.");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterviewDetails();
    }
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
        <Loader2 size={36} className="animate-spin" style={{ color: "var(--color-secondary)" }} />
        <span style={{ marginLeft: "12px", color: "var(--color-text-secondary)" }}>Fetching scorecard details...</span>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "20px", padding: "24px" }}>
        <AlertTriangle size={48} style={{ color: "var(--color-error)" }} />
        <div style={{ color: "var(--color-error)", fontSize: "1.2rem", textAlign: "center" }}>{error || "Scorecard not found."}</div>
        <Link href="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const overallScore = interview.overallScore || 0;
  
  // Calculate SVG stroke offset for the score ring (radius = 50, circumference = 2 * pi * r = 314)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  // Grade color code
  let scoreColor = "var(--color-error)";
  if (overallScore >= 80) scoreColor = "var(--color-success)";
  else if (overallScore >= 60) scoreColor = "var(--color-warning)";

  return (
    <>
      <Header />
      <BackgroundBlobs />

      <main className="container" style={{ flex: 1, padding: "40px 24px" }}>
        {/* Back navigation */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--color-text-secondary)",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        {/* Header Summary */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "2rem" }}>Technical Scorecard</h1>
            <span className="badge badge-pro" style={{ background: "rgba(0, 229, 255, 0.1)", color: "var(--color-secondary)", border: "1px solid rgba(0, 229, 255, 0.2)" }}>
              {interview.level} Level
            </span>
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            Mock technical loop for <strong style={{ color: "var(--color-text-primary)" }}>{interview.role}</strong> conducted on {new Date(interview.createdAt).toLocaleDateString()}.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "30px", alignItems: "start" }}>
          
          {/* Left panel: Dial & Overall Feedback */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* Scorecard circular card */}
            <div className="glass-card" style={{ padding: "30px", textAlign: "center" }}>
              <span className="form-label" style={{ marginBottom: "16px", display: "block" }}>
                Overall evaluation
              </span>
              
              <div className="flex-center" style={{ marginBottom: "20px" }}>
                <div className="score-circle">
                  <svg className="score-circle-svg" viewBox="0 0 120 120">
                    {/* Background Ring */}
                    <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    {/* Active Ring */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={scoreColor}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                  </svg>
                  <div className="score-text" style={{ color: scoreColor }}>
                    {overallScore}
                  </div>
                </div>
              </div>

              <strong style={{ fontSize: "1.1rem", color: scoreColor }}>
                {overallScore >= 85 ? "Excellent Match" : overallScore >= 70 ? "Qualified Candidate" : "Needs Review"}
              </strong>

              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  marginTop: "24px",
                  paddingTop: "20px",
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.6",
                  textAlign: "left",
                }}
              >
                {interview.feedback}
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <strong style={{ fontSize: "0.95rem" }}>Technical Metrics Breakdown</strong>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Questions</span>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-primary)", marginTop: "4px" }}>
                    {interview.questions.length}
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Average score</span>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-secondary)", marginTop: "4px" }}>
                    {overallScore}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Question details tab switcher & content */}
          <div className="glass-card" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Question Switcher Tabs */}
            <div>
              <span className="form-label" style={{ marginBottom: "12px", display: "block" }}>
                Select Graded Prompt
              </span>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
                {interview.questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionTab(index)}
                    className="btn"
                    style={{
                      background: activeQuestionTab === index ? "rgba(124, 77, 255, 0.15)" : "rgba(255,255,255,0.02)",
                      color: activeQuestionTab === index ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                      border: "1px solid",
                      borderColor: activeQuestionTab === index ? "var(--color-primary)" : "var(--border-color)",
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Question {index + 1}
                    <span
                      style={{
                        marginLeft: "8px",
                        color: (q.score || 0) >= 80 ? "var(--color-success)" : (q.score || 0) >= 60 ? "var(--color-warning)" : "var(--color-error)",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                      }}
                    >
                      {q.score}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected question details panel */}
            {interview.questions[activeQuestionTab] && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Question statement */}
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                    Question Prompt
                  </span>
                  <h3 style={{ fontSize: "1.2rem", marginTop: "4px", lineHeight: "1.4" }}>
                    {interview.questions[activeQuestionTab].questionText}
                  </h3>
                </div>

                {/* User answer transcript */}
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-secondary)" }}>
                    Your Spoken Answer
                  </span>
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.2)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      padding: "16px",
                      fontSize: "0.95rem",
                      lineHeight: "1.5",
                      marginTop: "6px",
                      color: "var(--color-text-primary)",
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{interview.questions[activeQuestionTab].answerText || "No answer recorded."}&rdquo;
                  </div>
                </div>

                {/* Evaluator Critique */}
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-primary)" }}>
                    AI Score Critique
                  </span>
                  <div
                    style={{
                      background: "rgba(124, 77, 255, 0.03)",
                      border: "1px solid rgba(124, 77, 255, 0.1)",
                      borderRadius: "var(--radius-sm)",
                      padding: "16px",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                      marginTop: "6px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {interview.questions[activeQuestionTab].critique || "Critique not generated."}
                  </div>
                </div>

                {/* Unlocked Ideal Answer Key */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <BookOpen size={16} style={{ color: "var(--color-success)" }} />
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-success)", fontWeight: 600 }}>
                      Ideal Reference Answer (Unlocked)
                    </span>
                  </div>
                  <div
                    style={{
                      background: "rgba(0, 230, 118, 0.03)",
                      border: "1px solid rgba(0, 230, 118, 0.1)",
                      borderRadius: "var(--radius-sm)",
                      padding: "16px",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {interview.questions[activeQuestionTab].idealAnswer}
                  </div>
                </div>

              </div>
            )}
            
            {/* Action buttons */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px", display: "flex", gap: "16px", justifyContent: "flex-end" }}>
              <Link href="/dashboard" className="btn btn-secondary">
                Return to Dashboard
              </Link>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event("user-updated"));
                  router.push("/dashboard");
                  setTimeout(() => {
                    const tabBtn = document.querySelector('aside button:first-child') as HTMLButtonElement;
                    if (tabBtn) tabBtn.click();
                  }, 100);
                }}
                className="btn btn-primary"
              >
                Start New Session
              </button>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
