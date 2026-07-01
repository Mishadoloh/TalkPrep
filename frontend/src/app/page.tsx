"use client";

import { useState } from "react";
import Link from "next/link";
import { Moon, Sparkles, ArrowRight, ShieldCheck, Zap, FileText, MessageSquare, BarChart2, TrendingUp, UploadCloud, Trophy, Rocket, Grid, Mail, Target, List, Headphones } from "lucide-react";
import { SiDocker, SiKubernetes, SiPostgresql, SiFigma, SiJavascript, SiTypescript, SiReact, SiNodedotjs, SiPython, SiGo } from "react-icons/si";
import { FaAws, FaJava } from "react-icons/fa";

export default function HomePage() {
  const [lang, setLang] = useState("UKR");
  
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0d0e15",
      backgroundImage: "radial-gradient(circle at 15% 50%, rgba(66, 46, 126, 0.25) 0%, transparent 40%), radial-gradient(circle at 85% 80%, rgba(20, 80, 110, 0.2) 0%, transparent 40%)",
      color: "#ffffff",
      fontFamily: "var(--font-sans)",
      overflowX: "hidden"
    }}>
      {/* Navbar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 5%",
        maxWidth: "1400px",
        margin: "0 auto",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.4rem", fontWeight: 700 }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold"
          }}>
            D
          </div>
          Doorora
        </div>
        
        {/* Nav Links */}
        <nav style={{ display: "flex", gap: "32px", fontSize: "0.95rem", color: "#a0a4b8", fontWeight: 500 }}>
          <a href="#" style={{ color: "white", textDecoration: "none" }}>Можливості</a>
          <a href="#" style={{ textDecoration: "none", color: "inherit", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "#a0a4b8"}>Як це працює</a>
          <a href="#" style={{ textDecoration: "none", color: "inherit", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "#a0a4b8"}>Відгуки</a>
          <a href="#" style={{ textDecoration: "none", color: "inherit", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "#a0a4b8"}>Тарифи</a>
        </nav>
        
        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a4b8", cursor: "pointer" }}>
            <Moon size={18} />
          </button>
          
          {/* Lang Toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "20px", padding: "4px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button onClick={() => setLang("UKR")} style={{ background: lang === "UKR" ? "#4f46e5" : "transparent", color: lang === "UKR" ? "white" : "#a0a4b8", border: "none", borderRadius: "16px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>UKR</button>
            <button onClick={() => setLang("ENG")} style={{ background: lang === "ENG" ? "#4f46e5" : "transparent", color: lang === "ENG" ? "white" : "#a0a4b8", border: "none", borderRadius: "16px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>ENG</button>
          </div>
          
          <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "6px 14px", fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0", cursor: "pointer" }}>
            <Zap size={14} color="#fbbf24" fill="#fbbf24" /> Pro
          </button>
          
          <Link href="/login" style={{ color: "white", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 12px" }}>
            Увійти
          </Link>
          
          <Link href="/register" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "white", textDecoration: "none", padding: "10px 24px", borderRadius: "24px", fontSize: "0.95rem", fontWeight: 600, boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)", transition: "transform 0.2s" }}
             onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
             onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            Зареєструватися
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 5%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "60px" }}>
        
        {/* Left Content */}
        <div style={{ flex: 1, maxWidth: "650px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "6px 16px", fontSize: "0.85rem", fontWeight: 500, color: "#c7d2fe", marginBottom: "32px" }}>
            <Sparkles size={14} color="#818cf8" />
            AI-коуч для кар'єри
          </div>
          
          <h1 style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-0.02em" }}>
            Шукаєш роботу<br/>
            <span style={{ background: "linear-gradient(90deg, #c4b5fd 0%, #5eead4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>вже місяцями?</span>
          </h1>
          
          <p style={{ fontSize: "1.2rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "40px", maxWidth: "500px" }}>
            AI напише резюме, підбере вакансії й підготує до співбесіди.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-start" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#10b981", color: "white", textDecoration: "none", padding: "16px 32px", borderRadius: "32px", fontSize: "1.1rem", fontWeight: 700, boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)", transition: "all 0.2s" }}
               onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
               onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              Спробуй безкоштовно <ArrowRight size={20} />
            </Link>
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#64748b" }}>
              <ShieldCheck size={14} color="#10b981" /> Без картки · реєстрація 30 секунд
            </div>
          </div>
          
          {/* Stats */}
          <div style={{ display: "flex", gap: "48px", marginTop: "80px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "32px" }}>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>300+</div>
              <div style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.4 }}>оптимізованих<br/>резюме</div>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>500+</div>
              <div style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.4 }}>проведених<br/>співбесід</div>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>200+</div>
              <div style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.4 }}>активних<br/>користувачів</div>
            </div>
          </div>
        </div>
        
        {/* Right Content / Card */}
        <div style={{ flex: "0 0 500px", display: "none" }} className="hero-card-container">
          {/* Rendered via CSS media query below */}
        </div>
        
        <div style={{ flex: 1, maxWidth: "550px", background: "rgba(20, 22, 35, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.05rem", fontWeight: 600 }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={16} color="white" />
              </div>
              Підбери свій план за 2 кліки
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "0.75rem", fontWeight: 700, padding: "4px 12px", borderRadius: "12px" }}>
              Безкоштовно
            </div>
          </div>
          
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "1px", marginBottom: "16px" }}>ТВІЙ НАПРЯМ</div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {["Frontend", "Backend", "Full Stack", "QA", "Mobile", "DevOps", "Data", "PM", "Designer"].map((pill, i) => (
              <button key={i} style={{ 
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", 
                padding: "10px 20px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" 
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#cbd5e1";
              }}>
                {pill}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Marquee */}
      <section style={{ padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.02)", background: "linear-gradient(to bottom, rgba(13, 14, 21, 0), rgba(13, 14, 21, 1))" }}>
        <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "#475569", letterSpacing: "1.5px", marginBottom: "40px" }}>
          ПИТАННЯ ТА ТЕХНОЛОГІЇ З РЕАЛЬНИХ СПІВБЕСІД
        </div>
        
        <div style={{ overflow: "hidden", display: "flex", whiteSpace: "nowrap", position: "relative" }}>
          <div className="marquee-track" style={{ display: "flex", gap: "20px", animation: "scroll 30s linear infinite" }}>
            {/* Duplicated twice for infinite effect */}
            {[...Array(2)].map((_, j) => (
              <div key={j} style={{ display: "flex", gap: "20px" }}>
                {[
                  { name: "Docker", color: "#2496ed", Icon: SiDocker },
                  { name: "Kubernetes", color: "#326ce5", Icon: SiKubernetes },
                  { name: "PostgreSQL", color: "#336791", Icon: SiPostgresql },
                  { name: "AWS", color: "#ff9900", Icon: FaAws },
                  { name: "Figma", color: "#f24e1e", Icon: SiFigma },
                  { name: "JavaScript", color: "#f7df1e", Icon: SiJavascript },
                  { name: "TypeScript", color: "#3178c6", Icon: SiTypescript },
                  { name: "React", color: "#61dafb", Icon: SiReact },
                  { name: "Node.js", color: "#339933", Icon: SiNodedotjs },
                  { name: "Python", color: "#3776ab", Icon: SiPython },
                  { name: "Go", color: "#00add8", Icon: SiGo },
                  { name: "Java", color: "#007396", Icon: FaJava },
                ].map((tech, i) => (
                  <div key={i} style={{ 
                    display: "flex", alignItems: "center", gap: "10px", 
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", 
                    padding: "12px 24px", borderRadius: "30px", color: "#cbd5e1", fontSize: "1rem", fontWeight: 500 
                  }}>
                    <tech.Icon size={18} color={tech.color} />
                    {tech.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Усе для пошуку роботи в одному місці */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 5%" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 800, marginBottom: "16px", color: "white" }}>
            Усе для пошуку роботи в одному місці
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
            Чотири інструменти, що працюють разом, щоб ти швидше отримав оффер.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
          {[
            {
              icon: FileText, title: "AI-резюме та ATS-оптимізація",
              desc: "Генеруй і допрацьовуй резюме під конкретну вакансію. ATS-аналіз показує, що покращити."
            },
            {
              icon: MessageSquare, title: "Симулятор співбесід",
              desc: "Тренуйся в чаті з AI-інтерв'юером, отримуй оцінку відповідей і поради щодо покращення."
            },
            {
              icon: BarChart2, title: "Трекер вакансій",
              desc: "Канбан-воронка: Список → Відгукнувся → Співбесіда → Оффер. Нагадування про співбесіди."
            },
            {
              icon: TrendingUp, title: "Прогрес і досягнення",
              desc: "Серія активності, досягнення та реферальні бонуси тримають тебе в темпі щодня."
            }
          ].map((item, i) => (
            <div key={i} style={{ 
              background: "rgba(30, 35, 55, 0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", 
              padding: "32px", transition: "all 0.3s", cursor: "default" 
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(40, 45, 75, 0.5)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(30, 35, 55, 0.4)"}>
              <div style={{ 
                width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", 
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px",
                color: "#818cf8"
              }}>
                <item.icon size={24} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "white", marginBottom: "16px", lineHeight: 1.4 }}>{item.title}</h3>
              <p style={{ fontSize: "0.95rem", color: "#94a3b8", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Як це працює */}
      <section style={{ background: "linear-gradient(to bottom, rgba(15, 16, 22, 1), rgba(25, 20, 50, 0.4))", padding: "100px 5%" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 800, marginBottom: "16px", color: "white" }}>Як це працює</h2>
            <p style={{ fontSize: "1.1rem", color: "#94a3b8" }}>Три кроки від резюме до офферу.</p>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", gap: "20px" }}>
            <div style={{ position: "absolute", top: "32px", left: "10%", right: "10%", height: "1px", background: "rgba(255,255,255,0.1)", zIndex: 0 }}></div>
            
            {[
              { num: "1", icon: UploadCloud, title: "Створи профіль", desc: "Зареєструйся за хвилину, додай резюме та обери цільову позицію." },
              { num: "2", icon: Sparkles, title: "Оптимізуй під вакансію", desc: "AI підлаштує резюме під опис вакансії та підготує тебе до співбесіди." },
              { num: "3", icon: Trophy, title: "Відстежуй і отримуй оффери", desc: "Веди всі відгуки в трекері й рухайся до офферу з аналітикою прогресу." },
            ].map((step, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", zIndex: 1 }}>
                <div style={{ position: "relative", marginBottom: "32px" }}>
                  <div style={{ 
                    width: "64px", height: "64px", borderRadius: "16px", 
                    background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                    boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)"
                  }}>
                    <step.icon size={28} />
                  </div>
                  <div style={{ 
                    position: "absolute", top: "-8px", right: "-8px", width: "24px", height: "24px", 
                    borderRadius: "50%", background: "#0f172a", border: "2px solid #1e293b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700, color: "white"
                  }}>
                    {step.num}
                  </div>
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "12px" }}>{step.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.5, maxWidth: "260px" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Знаходь роботу швидше */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 5%" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 800, marginBottom: "16px", color: "white" }}>
            Знаходь роботу швидше — без хаосу
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
            Doorora бере на себе рутину пошуку роботи, щоб ти зосередився на офері.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
          {[
            { icon: Rocket, title: "Швидкий старт", desc: "Завантаж резюме або створи з нуля — і за хвилини маєш готовий до подачі документ." },
            { icon: Grid, title: "Простий, зрозумілий інтерфейс", desc: "Чистий дизайн без зайвого: усі інструменти в одному місці, нічого вчити не треба." },
            { icon: TrendingUp, title: "Більше відповідей рекрутерів", desc: "ATS-готові резюме й аналіз вакансій підвищують шанс пройти перший відбір." },
            { icon: ShieldCheck, title: "Впевненість на співбесіді", desc: "Тренуйся з AI-інтерв'юером і заходь на реальну співбесіду підготовленим." }
          ].map((item, i) => (
            <div key={i} style={{ 
              background: "rgba(30, 35, 55, 0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", 
              padding: "32px", transition: "all 0.3s" 
            }}>
              <div style={{ 
                width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", 
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", color: "white",
                boxShadow: "0 8px 20px rgba(59, 130, 246, 0.25)"
              }}>
                <item.icon size={20} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "white", marginBottom: "16px", lineHeight: 1.4 }}>{item.title}</h3>
              <p style={{ fontSize: "0.95rem", color: "#94a3b8", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Чому варто оформити Premium */}
      <section style={{ background: "rgba(20, 22, 35, 0.5)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "100px 5%" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 800, marginBottom: "16px", color: "white" }}>
              Чому варто оформити Premium
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
              Повний набір AI-інструментів, щоб отримати офер швидше — усе в одному місці.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {[
              { icon: FileText, title: "AI-генератор резюме", desc: "Створюй професійні резюме з нуля за хвилини — AI підбере структуру, формулювання та акценти під твою спеціальність." },
              { icon: Target, title: "ATS-аналіз резюме", desc: "Глибока перевірка резюме на сумісність з ATS: ключові слова, оцінка та конкретні поради, що покращити." },
              { icon: Mail, title: "Супровідні листи (Cover Letter)", desc: "Персональний супровідний лист під конкретну компанію та вакансію — переконливо й без шаблонів." },
              { icon: BarChart2, title: "Аналіз вакансій", desc: "AI розбирає вакансію, показує відсоток збігу з твоїм резюме та чого бракує, щоб пройти відбір." },
              { icon: MessageSquare, title: "Симулятор співбесід", desc: "Необмежені тренування співбесід з AI-інтерв'юером і миттєвим фідбеком — текстом або голосом." },
              { icon: List, title: "Банк питань з реальних співбесід", desc: "Питання та технології з реальних співбесід для Python, Go, Java та інших — з прикладами відповідей.", highlight: true },
              { icon: BarChart2, title: "Трекер вакансій", desc: "Веди всі відгуки в одному канбані: статуси, нагадування та аналітика твого пошуку роботи." },
              { icon: Headphones, title: "Пріоритетна підтримка", desc: "Відповідаємо першими й допомагаємо на кожному етапі пошуку роботи." },
            ].map((item, i) => (
              <div key={i} style={{ 
                background: "rgba(30, 35, 55, 0.3)", border: item.highlight ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255,255,255,0.05)", 
                borderRadius: "20px", padding: "32px", transition: "all 0.3s",
                boxShadow: item.highlight ? "0 0 20px rgba(99, 102, 241, 0.1) inset" : "none"
              }}>
                <div style={{ 
                  width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", 
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", color: "#818cf8"
                }}>
                  <item.icon size={20} />
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "16px", lineHeight: 1.4 }}>{item.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track:hover {
          animation-play-state: paused !important;
        }
        @media (max-width: 900px) {
          main { flexDirection: column !important; padding: 40px 5% !important; }
          header nav { display: none !important; }
        }
      `}} />
    </div>
  );
}
