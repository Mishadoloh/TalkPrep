"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  ChevronRight,
  FileText,
  TrendingUp,
  Mic,
  Award,
  Calendar,
  Briefcase,
  Zap,
  Sparkles,
  ChevronLeft,
  Lock,
  Plus,
  User
} from "lucide-react";
import { Locale } from "@/lib/translations";

interface UserData {
  id: string;
  email: string;
  username: string;
  isPro: boolean;
  credits: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("uk-UA");

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
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/user");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          } else {
            router.push("/login");
          }
        }
      } catch (e) {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    fetchSession();
  }, [router]);

  if (authLoading) {
    return <div className="page-content flex-center" style={{ minHeight: "100vh" }}>Завантаження...</div>;
  }

  const uk = locale === "uk-UA";
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return uk ? "Доброго ранку" : "Good morning";
    if (hour < 18) return uk ? "Доброго дня" : "Good afternoon";
    return uk ? "Доброго вечора" : "Good evening";
  };

  return (
    <div className="page-content" style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 40px", paddingBottom: 100 }}>
      
      {/* ── 1. Greeting & Activity Card ── */}
      <section className="glass-card" style={{ padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            {getGreeting()}, {user?.username || "Гість"} <span style={{ fontSize: "1.5rem" }}>👋</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
            {uk ? "Готовий до нових перемог?" : "Ready for new wins?"}
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.2)", padding: "4px 12px", borderRadius: "var(--radius-full)", color: "var(--color-streak)", fontSize: "0.8rem", fontWeight: 600 }}>
            <Flame size={14} />
            {uk ? "1 день поспіль" : "1 day streak"}
          </div>
        </div>
        
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>
            {uk ? "Активність тижня" : "Weekly Activity"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Пн","Вт","Ср","Чт","Пт","Сб","Нд"].map((day, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: "50%", 
                  background: i === 1 ? "var(--accent)" : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: i === 1 ? "#fff" : "transparent"
                }}>
                  {i === 1 && <Flame size={14} />}
                </div>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>{day}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Readiness & Pro Banner ── */}
      <section className="glass-card" style={{ padding: "32px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 32, alignItems: "center", marginBottom: 24 }}>
          {/* Circular Progress */}
          <div style={{ position: "relative", width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-text-primary)" strokeWidth="3" strokeDasharray="0, 100" />
            </svg>
            <div style={{ position: "absolute", fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>
              0<span style={{ fontSize: "1rem" }}>%</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-light)", textTransform: "uppercase", marginBottom: 6 }}>
              {uk ? "Твоя готовність" : "Your Readiness"}
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>
              {uk ? "Чудовий старт — почнімо!" : "Great start — let's go!"}
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>
              {uk ? "Що підтягнути" : "What to improve"}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem", gap: 6, borderRadius: "var(--radius-full)" }}>
                <FileText size={14} /> {uk ? "Створи перше резюме" : "Create first resume"} <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </button>
              <button className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem", gap: 6, borderRadius: "var(--radius-full)" }}>
                <Sparkles size={14} /> {uk ? "Підніми ATS до 70%+" : "Boost ATS to 70%+"} <ChevronRight size={14} style={{ opacity: 0.5 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Pro Banner inside card */}
        <div style={{ background: "rgba(108, 92, 231, 0.1)", border: "1px solid rgba(108, 92, 231, 0.2)", borderRadius: "var(--radius-md)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                {uk ? "З PRO готовність росте вдвічі швидше — безліміт симуляцій і AI-розборів." : "With PRO readiness grows twice as fast — unlimited simulations."}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={12} style={{ color: "#f59e0b" }} />
                {uk ? "200+ уже отримали офер з Doorora" : "200+ got offers with Doorora"}
              </div>
            </div>
          </div>
          <Link href="/pricing" className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", fontSize: "0.85rem" }}>
            {uk ? "Спробувати PRO" : "Try PRO"} <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── 3. Continue Interview & Weekly Challenge ── */}
      <section className="glass-card" style={{ padding: "24px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--bg-card-alt)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <Mic size={20} />
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                {uk ? "Продовжити інтерв'ю" : "Continue interview"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {uk ? "Ти зупинився на питанні 1/10" : "You stopped at question 1/10"}
              </div>
            </div>
          </div>
          <Link href="/interview" className="btn btn-primary" style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", fontSize: "0.85rem" }}>
            {uk ? "Продовжити" : "Continue"} <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Award size={20} style={{ color: "#06b6d4" }} />
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{uk ? "Виклик тижня" : "Weekly Challenge"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{uk ? "3 симуляції співбесід" : "3 interview simulations"}</div>
              </div>
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>0/3</div>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "0%", background: "#06b6d4" }} />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
            <Zap size={14} /> {uk ? "Почати симуляцію" : "Start simulation"}
          </button>
        </div>
      </section>

      {/* ── 4. Two Columns: Daily Challenge & Goal ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Daily Challenge */}
        <section className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              <Flame size={18} />
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>{uk ? "Челендж дня" : "Daily Challenge"}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{uk ? "5 хвилин на день — і ти в формі" : "5 mins a day keeps you in shape"}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: Mic, label: uk ? "Відповісти на 1 питання співбесіди" : "Answer 1 interview question" },
              { icon: Plus, label: uk ? "Переглянути 1 нову вакансію" : "View 1 new vacancy" },
              { icon: FileText, label: uk ? "Зазирнути в резюме" : "Check your resume" }
            ].map((item, i) => (
              <div key={i} className="list-item" style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--text-muted)" }} />
                  <item.icon size={16} style={{ color: "var(--accent-light)" }} />
                  <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{item.label}</span>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {uk ? "Не загуби серію — лишилось 0 з 3" : "Don't lose streak — 0 of 3 left"}
          </div>
        </section>

        {/* Set Goal */}
        <section className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(108, 92, 231, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-light)" }}>
              <Award size={18} />
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>{uk ? "Постав ціль" : "Set Goal"}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{uk ? "Ціль тримає в тонусі — і ми покажемо твій прогрес." : "A goal keeps you going — we'll show progress."}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>{uk ? "Хочу офер до" : "Want offer by"}</label>
              <div style={{ position: "relative" }}>
                <input type="text" placeholder="ДД.ММ.РРРР" className="form-input" style={{ paddingRight: 36 }} />
                <Calendar size={16} style={{ position: "absolute", right: 12, top: 12, color: "var(--text-muted)" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>{uk ? "Відгуків на тиждень" : "Applications per week"}</label>
              <input type="number" defaultValue="5" className="form-input" />
            </div>
          </div>
          <button className="btn" style={{ width: "100%", background: "var(--bg-active)", color: "var(--accent-light)", fontWeight: 600 }}>
            {uk ? "Зберегти ціль" : "Save goal"}
          </button>
        </section>
      </div>

      {/* ── 5. Achievements ── */}
      <section className="glass-card" style={{ padding: "24px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <Award size={18} />
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>{uk ? "Досягнення" : "Achievements"}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>0 / 25 {uk ? "відкрито" : "unlocked"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="topbar-icon-btn"><ChevronLeft size={16} /></button>
            <button className="topbar-icon-btn"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
          {[
            { icon: FileText, label: uk ? "Перше резюме" : "First Resume" },
            { icon: Briefcase, label: uk ? "Перший відгук" : "First Apply" },
            { icon: Mic, label: uk ? "Перше інтерв'ю" : "First Interview" },
            { icon: FileText, label: uk ? "Перший ATS" : "First ATS" },
            { icon: Flame, label: uk ? "Серія 3 дні" : "3-day streak" },
            { icon: Briefcase, label: uk ? "5 вакансій" : "5 vacancies" },
            { icon: Mic, label: uk ? "3 інтерв'ю" : "3 interviews" },
            { icon: User, label: uk ? "Перший реферал" : "First referral" },
            { icon: Flame, label: uk ? "Серія 7 днів" : "7-day streak" },
          ].map((ach, i) => (
            <div key={i} style={{ width: 80, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: 0.5 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--bg-card-alt)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ach.icon size={22} style={{ color: "var(--text-muted)" }} />
              </div>
              <span style={{ fontSize: "0.7rem", textAlign: "center", lineHeight: 1.2, color: "var(--text-secondary)" }}>{ach.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Career Progress ── */}
      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>{uk ? "Кар'єрний прогрес" : "Career Progress"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { value: "0", label: uk ? "Відгуків" : "Applications", color: "var(--text-primary)" },
            { value: "0%", label: uk ? "Сер. ATS" : "Avg. ATS", color: "#ef4444" },
            { value: "0", label: uk ? "Інтерв'ю" : "Interviews", color: "var(--text-primary)" }
          ].map((stat, i) => (
            <div key={i} className="glass-card" style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Recommended Vacancies ── */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{uk ? "Рекомендовані вакансії" : "Recommended Vacancies"}</h3>
          <button style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer" }}>{uk ? "Усі →" : "All →"}</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { company: "GreyHunter", role: "Junior Front-end Developer", color: "#22c55e", initial: "G" },
            { company: "DEV-3", role: "Junior Front-end Developer", color: "#0ea5e9", initial: "D" },
            { company: "ABP", role: "Trainee Front-End Developer", color: "#ef4444", initial: "A" }
          ].map((vac, i) => (
            <div key={i} className="list-item">
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: "8px", background: vac.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                  {vac.initial}
                </div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{vac.company}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{vac.role}</div>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem", borderRadius: "var(--radius-full)" }}>
                {uk ? "Додай резюме" : "Add resume"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. Vacancies in process & Quick Actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)" }}>{uk ? "Вакансії в процесі" : "Vacancies in process"}</h3>
            <button style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer" }}>{uk ? "Всі →" : "All →"}</button>
          </div>
          <div className="glass-card" style={{ padding: "16px", display: "inline-block", minWidth: 180 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>Evoplay</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 12 }}>Front-end Developer (...</div>
            <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", fontSize: "0.7rem", fontWeight: 500, padding: "4px 10px" }}>
              {uk ? "Список" : "List"}
            </span>
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 16 }}>{uk ? "Швидкі дії" : "Quick actions"}</h3>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button className="btn btn-primary" style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", gap: 8, flex: 1 }}>
              <Zap size={16} /> {uk ? "Бліц-інтерв'ю 5 хв" : "5 min blitz interview"}
            </button>
            <button className="btn btn-secondary" style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", gap: 8, flex: 1 }}>
              <FileText size={16} /> {uk ? "Оптимізувати резюме" : "Optimize resume"}
            </button>
            <button className="btn btn-secondary" style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", gap: 8, flex: 1 }}>
              <Plus size={16} /> {uk ? "Додати вакансію" : "Add vacancy"}
            </button>
          </div>
          
          <div className="glass-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: "8px", background: "rgba(6, 182, 212, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#06b6d4" }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>{uk ? "Порада дня" : "Tip of the day"}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {uk ? "Адаптуй резюме під кожну вакансію — навіть кілька ключових слів підвищують шанс пройти ATS." : "Adapt your resume for each vacancy — even a few keywords increase ATS passing chances."}
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
