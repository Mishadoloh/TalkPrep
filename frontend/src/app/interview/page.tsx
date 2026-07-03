"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  FileQuestion,
  Loader2,
  Mic,
  Phone,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  SiAirbnb,
  SiAngular,
  SiAnthropic,
  SiApple,
  SiC,
  SiCoinbase,
  SiCss,
  SiDatabricks,
  SiDocker,
  SiGit,
  SiGo,
  SiGoogle,
  SiHtml5,
  SiJavascript,
  SiKubernetes,
  SiMeta,
  SiMongodb,
  SiNetflix,
  SiNextdotjs,
  SiNodedotjs,
  SiNvidia,
  SiPinterest,
  SiPython,
  SiReact,
  SiRust,
  SiSnapchat,
  SiStripe,
  SiSwift,
  SiTypescript,
  SiUber,
  SiVuedotjs,
} from "react-icons/si";

type TabKey = "simulation" | "bank" | "questions" | "history";
type Level = "Junior" | "Middle" | "Senior";

interface InterviewHistoryItem {
  id: string;
  role: string;
  level: string;
  overallScore: number | null;
  createdAt: string;
}

interface QuestionBankItem {
  id: string;
  language: string;
  role: string;
  level: string;
  category: string;
  questionText: string;
  idealAnswer: string;
}

const tabs: Array<{ key: TabKey; label: string; Icon: typeof Mic }> = [
  { key: "simulation", label: "Симуляція", Icon: Mic },
  { key: "bank", label: "Банк питань", Icon: Briefcase },
  { key: "questions", label: "Питання", Icon: FileQuestion },
  { key: "history", label: "Історія", Icon: Trophy },
];

const interviewTypes = [
  { id: "technical", title: "Технічне", desc: "Алгоритми, системний дизайн", Icon: Code2, color: "#7c3aed" },
  { id: "behavioral", title: "Поведінкове", desc: "STAR метод, soft skills", Icon: Mic, color: "#2563eb" },
  { id: "screening", title: "Скринінг", desc: "HR питання, мотивація", Icon: Phone, color: "#10b981" },
];

const specialties = [
  { id: "frontend", title: "Frontend", desc: "React / TypeScript", role: "Frontend Engineer", letter: "F", color: "#7c3aed" },
  { id: "backend", title: "Backend", desc: "Node.js / Python", role: "Backend Engineer", letter: "B", color: "#2563eb" },
  { id: "fullstack", title: "Full Stack", desc: "React + Node.js / Next.js", role: "Fullstack Engineer", letter: "F", color: "#7c3aed" },
  { id: "qa", title: "QA", desc: "Manual / Automation", role: "QA Engineer", letter: "Q", color: "#10b981" },
  { id: "mobile", title: "Mobile", desc: "iOS / Android", role: "Mobile Engineer", letter: "M", color: "#f97316" },
  { id: "devops", title: "DevOps", desc: "Docker / Kubernetes / CI/CD", role: "DevOps Engineer", letter: "D", color: "#eab308" },
  { id: "cloud", title: "Cloud Architect", desc: "AWS / GCP / Azure", role: "Cloud Architect", letter: "C", color: "#4f46e5" },
  { id: "ml", title: "ML Engineer", desc: "Python / TensorFlow / PyTorch", role: "ML Engineer", letter: "M", color: "#f97316" },
  { id: "data", title: "Data Engineer", desc: "Spark / Airflow / ETL", role: "Data Engineer", letter: "D", color: "#eab308" },
  { id: "security", title: "Security Engineer", desc: "Cybersecurity / Pentesting", role: "Security Engineer", letter: "S", color: "#4f46e5" },
  { id: "blockchain", title: "Blockchain", desc: "Solidity / Web3 / Smart Contracts", role: "Blockchain Engineer", letter: "B", color: "#2563eb" },
  { id: "game", title: "Game Developer", desc: "Unity / Unreal / C++", role: "Game Developer", letter: "G", color: "#4f46e5" },
  { id: "embedded", title: "Embedded Systems", desc: "C / RTOS / Hardware", role: "Embedded Engineer", letter: "E", color: "#4f46e5" },
  { id: "pm", title: "Project Manager", desc: "Agile / Scrum", role: "Product Manager", letter: "P", color: "#ec4899" },
  { id: "design", title: "UI/UX Designer", desc: "Figma", role: "UI/UX Designer", letter: "U", color: "#06b6d4" },
  { id: "analyst", title: "Data Analyst", desc: "SQL / Python", role: "Data Analyst", letter: "D", color: "#eab308" },
];

const techs = [
  { name: "JavaScript", Icon: SiJavascript, color: "#f7df1e" },
  { name: "TypeScript", Icon: SiTypescript, color: "#3178c6" },
  { name: "React", Icon: SiReact, color: "#61dafb" },
  { name: "HTML", Icon: SiHtml5, color: "#e34f26" },
  { name: "CSS", Icon: SiCss, color: "#1572b6" },
  { name: "Node.js", Icon: SiNodedotjs, color: "#339933" },
  { name: "Python", Icon: SiPython, color: "#3776ab" },
  { name: "SQL", Icon: SiDatabricks, color: "#94a3b8" },
  { name: "Go", Icon: SiGo, color: "#00add8" },
  { name: "Java", Icon: SiJavascript, color: "#ef4444" },
  { name: "C#", Icon: SiC, color: "#9b4f96" },
  { name: "C++", Icon: SiC, color: "#00599c" },
  { name: "C", Icon: SiC, color: "#a8b9cc" },
  { name: "PHP", Icon: SiDatabricks, color: "#777bb4" },
  { name: "Ruby", Icon: SiDatabricks, color: "#cc342d" },
  { name: "Rust", Icon: SiRust, color: "#000" },
  { name: "Kotlin", Icon: SiDatabricks, color: "#a97bff" },
  { name: "Swift", Icon: SiSwift, color: "#f05138" },
  { name: "Vue", Icon: SiVuedotjs, color: "#4fc08d" },
  { name: "Angular", Icon: SiAngular, color: "#dd0031" },
  { name: "Next.js", Icon: SiNextdotjs, color: "#fff" },
  { name: "NestJS", Icon: SiDatabricks, color: "#e0234e" },
  { name: "Docker", Icon: SiDocker, color: "#2496ed" },
  { name: "Kubernetes", Icon: SiKubernetes, color: "#326ce5" },
  { name: "MongoDB", Icon: SiMongodb, color: "#47a248" },
  { name: "Git", Icon: SiGit, color: "#f05032" },
];

const companies = {
  faang: [
    { name: "Google", count: 324, updated: "1d ago", Icon: SiGoogle, color: "#fff", featured: true },
    { name: "Apple", count: 158, updated: "2d ago", Icon: SiApple, color: "#fff" },
    { name: "Meta", count: 323, updated: "2d ago", Icon: SiMeta, color: "#fff" },
    { name: "Amazon", count: 324, updated: "1d ago", logo: "a", color: "#ff9900" },
    { name: "Netflix", count: 110, updated: "3d ago", Icon: SiNetflix, color: "#e50914" },
  ],
  ai: [
    { name: "OpenAI", count: 329, updated: "1d ago", logo: "◎", color: "#fff" },
    { name: "Anthropic", count: 168, updated: "13h ago", Icon: SiAnthropic, color: "#fff" },
    { name: "Databricks", count: 158, updated: "2d ago", Icon: SiDatabricks, color: "#ff6b5f" },
    { name: "Nvidia", count: 68, updated: "2d ago", Icon: SiNvidia, color: "#76b900" },
  ],
  growth: [
    { name: "Uber", count: 287, updated: "3d ago", Icon: SiUber, color: "#000" },
    { name: "Stripe", count: 243, updated: "2d ago", Icon: SiStripe, color: "#635bff" },
    { name: "Bytedance", count: 243, updated: "21h ago", Icon: SiDatabricks, color: "#94a3b8" },
    { name: "DoorDash", count: 174, updated: "17h ago", Icon: SiDatabricks, color: "#ff3008" },
    { name: "Snapchat", count: 126, updated: "1mo ago", Icon: SiSnapchat, color: "#fffc00" },
    { name: "LinkedIn", count: 125, updated: "1mo ago", logo: "in", color: "#0a66c2" },
    { name: "Pinterest", count: 121, updated: "2d ago", Icon: SiPinterest, color: "#e60023" },
    { name: "Coinbase", count: 87, updated: "5d ago", Icon: SiCoinbase, color: "#0052ff" },
    { name: "Airbnb", count: 80, updated: "4d ago", Icon: SiAirbnb, color: "#ff5a5f" },
  ],
};

const questionList = [
  "Яка різниця між var, let і const?",
  "Що таке hoisting у JavaScript?",
  "Чим відрізняються == і ===?",
  "Які примітивні типи даних існують у JS?",
  "Що повертає typeof null і чому?",
  "Що таке функції зворотного виклику (callbacks)?",
  "Чим відрізняються null і undefined?",
  "Як працює методи map, filter і reduce?",
  "Що таке область видимості (scope)?",
  "Як працює оператор spread (...) ?",
];

function cx(active: boolean) {
  return active ? "var(--accent)" : "var(--bg-card)";
}

export default function InterviewPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("simulation");
  const [selectedType, setSelectedType] = useState("technical");
  const [selectedSpecialty, setSelectedSpecialty] = useState("frontend");
  const [level, setLevel] = useState<Level>("Junior");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTech, setSelectedTech] = useState("JavaScript");
  const [showAllTech, setShowAllTech] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [bankStats, setBankStats] = useState({ total: 23040, roles: 16, categories: 24 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const selectedRole = specialties.find((item) => item.id === selectedSpecialty) ?? specialties[0];
  const normalizedLevel = level === "Middle" ? "Mid" : level;

  useEffect(() => {
    const loadQuestionBank = async () => {
      try {
        const params = new URLSearchParams({
          language: "uk-UA",
          role: selectedRole.role,
          level: normalizedLevel,
          limit: "120",
        });
        const res = await fetch(`/api/question-bank?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.questions) {
          setQuestionBank(data.questions);
          const globalStats = data.stats?.global;
          setBankStats({
            total: globalStats?.total ?? data.stats?.total ?? data.questions.length,
            roles: globalStats?.roles ?? data.stats?.roles ?? 16,
            categories: globalStats?.categories ?? data.stats?.categories ?? 24,
          });
        }
      } catch {
        setQuestionBank([]);
      }
    };

    loadQuestionBank();
  }, [selectedRole.role, normalizedLevel]);

  useEffect(() => {
    if (tab !== "history") return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch("/api/interview/history");
        const data = await res.json();
        setHistory(res.ok && data.history ? data.history : []);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [tab]);

  const bankQuestionTotal = bankStats.total;

  const filteredQuestions = useMemo(() => {
    const search = questionSearch.trim().toLowerCase();
    const source = questionBank.length ? questionBank.map((item) => item.questionText) : questionList;

    return source.filter((item) => item.toLowerCase().includes(search));
  }, [questionSearch, questionBank]);

  const startInterview = async () => {
    setStarting(true);
    setStartError("");

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole.role,
          level: level === "Middle" ? "Mid" : level,
          language: "uk-UA",
          interviewType: selectedType,
          questionCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        setStartError(data.error || "Не вдалося запустити інтерв'ю.");
        return;
      }

      router.push(`/interview/${data.interviewId}`);
    } catch {
      setStartError("Сервіс інтерв'ю тимчасово недоступний.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div
      className="page-content"
      style={{
        width: "100%",
        maxWidth: 1160,
        margin: "0 auto",
        padding: "36px clamp(20px, 4vw, 40px) 100px",
        boxSizing: "border-box",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 26 }}>
        <div>
          <h1 style={{ fontSize: "1.9rem", color: "var(--accent-light)", marginBottom: 8 }}>
            Симулятор співбесіди
          </h1>
          <p style={{ fontSize: "0.95rem" }}>
            Обери формат і спеціальність — AI проведе живу співбесіду та дасть фідбек.
          </p>
        </div>
        <div className="badge badge-pro" style={{ gap: 6, fontSize: "0.8rem", padding: "8px 14px" }}>
          <Clock size={14} /> ~20 хв
        </div>
      </header>

      <nav
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 4,
          background: "var(--bg-card)",
          border: "1px solid var(--border-hover)",
          borderRadius: 22,
          padding: 6,
          marginBottom: 28,
        }}
      >
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              height: 50,
              border: 0,
              borderRadius: 16,
              background: tab === key ? "var(--accent)" : "transparent",
              color: tab === key ? "#fff" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {tab === "simulation" && (
        <section>
          <SectionLabel>Тип інтерв'ю</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 34 }}>
            {interviewTypes.map(({ id, title, desc, Icon, color }) => {
              const active = selectedType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedType(id)}
                  className="glass-card"
                  style={{
                    minHeight: 166,
                    padding: 20,
                    textAlign: "left",
                    cursor: "pointer",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    background: active ? "rgba(108, 92, 231, 0.14)" : "var(--bg-card)",
                    position: "relative",
                  }}
                >
                  {active && <CheckBadge />}
                  <CircleIcon color={color}><Icon size={24} /></CircleIcon>
                  <h3 style={{ fontSize: "1rem", marginTop: 16, marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: "0.85rem" }}>{desc}</p>
                </button>
              );
            })}
          </div>

          <SectionLabel>Спеціальність</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 30 }}>
            {specialties.map((item) => {
              const active = selectedSpecialty === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSpecialty(item.id)}
                  className="glass-card"
                  style={{
                    minHeight: 86,
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    textAlign: "left",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    background: active ? "rgba(108, 92, 231, 0.13)" : "var(--bg-card)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: item.color,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontWeight: 800,
                  }}>
                    {item.letter}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: "block", fontSize: "1rem", color: "var(--text-primary)" }}>{item.title}</strong>
                    <span style={{ color: "#9fb2d4", fontSize: "0.88rem" }}>{item.desc}</span>
                  </span>
                  {active && <Check size={20} style={{ color: "var(--accent-light)" }} />}
                </button>
              );
            })}
          </div>

          <SectionLabel>Рівень</SectionLabel>
          <Segmented values={["Junior", "Middle", "Senior"]} value={level} onChange={(value) => setLevel(value as Level)} />

          <SectionLabel style={{ marginTop: 28 }}>Кількість питань</SectionLabel>
          <Segmented values={["5", "10", "15"]} value={String(questionCount)} onChange={(value) => setQuestionCount(Number(value))} />

          {startError && <p style={{ color: "var(--color-error)", marginTop: 18 }}>{startError}</p>}
          <button
            type="button"
            onClick={startInterview}
            disabled={starting}
            className="btn btn-primary"
            style={{
              width: "100%",
              height: 70,
              marginTop: 34,
              borderRadius: 18,
              fontSize: "1.05rem",
              fontWeight: 800,
              background: "linear-gradient(90deg, #7c3aed, #3b82f6)",
              boxShadow: "0 18px 50px rgba(108, 92, 231, 0.24)",
            }}
          >
            {starting ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            Почати інтерв'ю
          </button>
        </section>
      )}

      {tab === "bank" && (
        <section>
          <h2 style={{ fontSize: "1.7rem", color: "var(--accent-light)", marginBottom: 8 }}>
            Реальні питання зі співбесід
          </h2>
          <p style={{ marginBottom: 28 }}>Перевірені технічні та поведінкові питання від топ-компаній — оновлюються постійно.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
            <Metric value={String(bankStats.roles)} label="ролей" />
            <Metric value={bankQuestionTotal.toLocaleString("uk-UA")} label="питань усього" />
            <Metric value={String(bankStats.categories)} label="тем" green />
          </div>

          <SearchBox value={companySearch} onChange={setCompanySearch} placeholder="Пошук серед компаній..." />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "24px 0 30px" }}>
            {["Luma AI · Coding · 5h ago", "OpenAI · ML System Design · 13h ago", "DoorDash · System Design · 17h ago", "Bytedance · Coding · 21h ago"].map((ticker) => (
              <span key={ticker} className="badge" style={{ background: "transparent", border: "1px solid var(--border-hover)", color: "var(--text-secondary)", textTransform: "none", fontSize: "0.8rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", marginRight: 6 }} />
                {ticker}
              </span>
            ))}
          </div>

          <CompanySection title="FAANG" items={companies.faang} search={companySearch} />
          <CompanySection title="AI FRONTIER" items={companies.ai} search={companySearch} />
          <CompanySection title="ШВИДКОЗРОСТАЮЧІ" items={companies.growth} search={companySearch} />
        </section>
      )}

      {tab === "questions" && (
        <section>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            {(showAllTech ? techs : techs.slice(0, 8)).map(({ name, Icon, color }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedTech(name)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 15px",
                  borderRadius: "var(--radius-full)",
                  border: selectedTech === name ? "1px solid var(--accent)" : "1px solid var(--border-hover)",
                  background: selectedTech === name ? "rgba(108, 92, 231, 0.18)" : "var(--bg-card)",
                  color: selectedTech === name ? "#fff" : "#9fb2d4",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Icon size={18} color={color} />
                {name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAllTech((value) => !value)}
            className="btn btn-secondary"
            style={{ borderStyle: "dashed", borderRadius: "var(--radius-full)", padding: "7px 14px", color: "var(--accent-light)", marginBottom: 22 }}
          >
            {showAllTech ? "Згорнути" : "Більше +18"}
          </button>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {(["Junior", "Middle", "Senior"] as Level[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLevel(item)}
                style={{
                  border: 0,
                  borderRadius: "var(--radius-md)",
                  padding: "10px 19px",
                  background: level === item ? "var(--accent)" : "var(--bg-card)",
                  color: level === item ? "#fff" : "var(--text-secondary)",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <SearchBox value={questionSearch} onChange={setQuestionSearch} placeholder="Пошук по питаннях..." />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
            {filteredQuestions.map((question, index) => (
              <QuestionRow key={question} index={index + 1} question={question} />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 28 }}>
            <button className="topbar-icon-btn"><ChevronLeft size={16} /></button>
            {[1, 2].map((page) => (
              <button key={page} className="topbar-icon-btn" style={{ background: page === 1 ? "var(--accent)" : "transparent", color: page === 1 ? "#fff" : "var(--text-secondary)" }}>
                {page}
              </button>
            ))}
            <span style={{ color: "var(--text-secondary)" }}>...</span>
            <button className="topbar-icon-btn">10</button>
            <button className="topbar-icon-btn"><ChevronRight size={16} /></button>
          </div>
        </section>
      )}

      {tab === "history" && (
        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {historyLoading ? (
            <div className="flex-center" style={{ padding: 80, color: "var(--text-secondary)", gap: 10 }}>
              <Loader2 className="animate-spin" size={22} /> Завантаження історії...
            </div>
          ) : history.length > 0 ? (
            history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/interview/${item.id}/result`)}
                className="glass-card"
                style={{
                  minHeight: 96,
                  padding: "20px 22px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 54, height: 54, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(239, 68, 68, 0.13)", color: "#ff5c67", fontWeight: 900 }}>
                  {item.overallScore ?? 0}%
                </span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "1rem" }}>
                    {item.role} · {item.level}
                  </strong>
                  <span style={{ color: "#9fb2d4" }}>{new Date(item.createdAt).toLocaleDateString("uk-UA")}</span>
                </span>
                <ChevronRight size={20} style={{ color: "var(--text-secondary)" }} />
              </button>
            ))
          ) : (
            [
              { title: "data · Технічне", date: "01.07.2026" },
              { title: "frontend · Скринінг", date: "30.06.2026" },
            ].map((item) => (
              <div key={item.title} className="glass-card" style={{ minHeight: 96, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ width: 54, height: 54, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(239, 68, 68, 0.13)", color: "#ff5c67", fontWeight: 900 }}>0%</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "1rem" }}>{item.title}</strong>
                  <span style={{ color: "#9fb2d4" }}>{item.date}</span>
                </span>
                <ChevronRight size={20} style={{ color: "var(--text-secondary)" }} />
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...style, fontSize: "0.74rem", color: "#9fb2d4", textTransform: "uppercase", fontWeight: 900, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function CircleIcon({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ width: 56, height: 56, borderRadius: "50%", display: "grid", placeItems: "center", background: color, color: "#fff" }}>
      {children}
    </span>
  );
}

function CheckBadge() {
  return (
    <span style={{ position: "absolute", top: 14, right: 14, width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", display: "grid", placeItems: "center", color: "#fff" }}>
      <Check size={16} />
    </span>
  );
}

function Segmented({ values, value, onChange }: { values: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${values.length}, 1fr)`, background: "var(--bg-card)", border: "1px solid var(--border-hover)", borderRadius: 18, padding: 8 }}>
      {values.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          style={{
            height: 50,
            border: 0,
            borderRadius: 15,
            background: value === item ? "linear-gradient(90deg, #7c3aed, #3b82f6)" : "transparent",
            color: value === item ? "#fff" : "var(--text-secondary)",
            fontWeight: 900,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div style={{ position: "relative" }}>
      <Search size={20} style={{ position: "absolute", left: 18, top: 17, color: "var(--text-secondary)" }} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 56,
          borderRadius: 18,
          border: "1px solid var(--border-hover)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          padding: "0 20px 0 52px",
          outline: "none",
          fontSize: "0.95rem",
        }}
      />
    </div>
  );
}

function Metric({ value, label, green }: { value: string; label: string; green?: boolean }) {
  return (
    <div className="glass-card" style={{ padding: "24px 20px", textAlign: "center" }}>
      <div style={{ color: green ? "#22c55e" : "var(--accent-light)", fontSize: "1.8rem", fontWeight: 900 }}>{value}</div>
      <div style={{ textTransform: "uppercase", color: "#9fb2d4", fontSize: "0.78rem", fontWeight: 800 }}>{label}</div>
    </div>
  );
}

function CompanySection({ title, items, search }: { title: string; items: Array<any>; search: string }) {
  const filtered = items.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()));
  if (!filtered.length) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionLabel>{title}</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {filtered.map((item) => {
          const Icon = item.Icon;
          const iconColor = item.color === "#fff" ? "#111827" : item.color;
          return (
            <article
              key={item.name}
              className="glass-card"
              style={{
                gridColumn: item.featured ? "span 2" : "span 1",
                gridRow: item.featured ? "span 2" : "span 1",
                minHeight: item.featured ? 220 : 136,
                padding: 20,
                background: item.featured ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(22, 28, 42, 0.9))" : undefined,
                borderColor: item.featured ? "rgba(16, 185, 129, 0.35)" : undefined,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center" }}>
                  {Icon ? (
                    <Icon size={26} color={iconColor} />
                  ) : (
                    <span style={{ color: iconColor, fontWeight: 900, fontSize: item.logo.length > 1 ? "1rem" : "1.45rem" }}>
                      {item.logo}
                    </span>
                  )}
                </span>
                <span>
                  <strong style={{ color: "var(--text-primary)", fontSize: "1rem" }}>{item.name}</strong>
                  <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem" }}>Оновлено {item.updated}</span>
                </span>
              </div>
              {item.featured && <p style={{ marginTop: 22 }}>Build tools used by billions — experience the scale and culture of Silicon Valley's most iconic firm.</p>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
                <strong style={{ fontSize: item.featured ? "1.8rem" : "1rem" }}>{item.count} <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>питань</span></strong>
                <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function QuestionRow({ index, question }: { index: number; question: string }) {
  return (
    <button type="button" className="glass-card" style={{ minHeight: 72, padding: "0 24px", display: "flex", alignItems: "center", gap: 16, borderRadius: 22, textAlign: "left", cursor: "pointer" }}>
      <span style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(108, 92, 231, 0.2)", color: "var(--accent-light)", fontWeight: 900 }}>{index}</span>
      <strong style={{ flex: 1, color: "var(--text-primary)" }}>{question}</strong>
      <ChevronRight size={20} style={{ color: "var(--text-secondary)" }} />
    </button>
  );
}
