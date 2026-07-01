"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  Check, 
  Plus, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function VacanciesPage() {
  const [activeCategory, setActiveCategory] = useState("Frontend");
  const [activeFilters, setActiveFilters] = useState<string[]>(["Junior"]);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const categories = [
    "Frontend", "Backend", "Full Stack", "DevOps", 
    "QA", "Mobile", "Project Manager", "UI/UX Designer", "Data Analyst"
  ];
  
  const filterOptions = [
    "Віддалено", "Офіс", "Гібрид", "З зарплатою", "Збіг 70%+", "Junior", "Middle", "Senior"
  ];

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => 
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  React.useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/vacancies?category=${encodeURIComponent(activeCategory)}&page=${currentPage}`);
        const data = await res.json();
        if (data.vacancies) {
          setVacancies(data.vacancies);
        }
      } catch (err) {
        console.error("Failed to fetch jobs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [activeCategory, currentPage]);

  return (
    <div className="page-content" style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 100 }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.8rem" }}>Вакансії</h1>
        <p>Знаходь вакансії за своєю роллю та зберігай у трекер</p>
      </div>

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={18} style={{ position: "absolute", left: 16, top: 16, color: "var(--text-muted)" }} />
        <input 
          type="text" 
          placeholder="Пошук: посада, технологія, компанія..." 
          style={{
            width: "100%",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "15px 16px 15px 46px",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            outline: "none"
          }} 
        />
      </div>

      {/* Category Chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              background: activeCategory === cat ? "var(--accent)" : "rgba(255,255,255,0.06)",
              color: activeCategory === cat ? "#fff" : "var(--text-secondary)",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter Block */}
      <div className="glass-card" style={{ padding: "16px 20px", marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>
            <SlidersHorizontal size={16} /> Фільтри
          </div>
          <button style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer" }}>
            Скинути ({activeFilters.length})
          </button>
        </div>
        
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {filterOptions.map(f => (
            <button 
              key={f}
              onClick={() => toggleFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                background: activeFilters.includes(f) ? "var(--accent)" : "transparent",
                color: activeFilters.includes(f) ? "#fff" : "var(--text-secondary)",
                border: activeFilters.includes(f) ? `1px solid var(--accent)` : `1px solid var(--border)`,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <MapPin size={16} style={{ position: "absolute", left: 14, top: 14, color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Місто або країна..." 
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px 12px 40px",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none"
            }} 
          />
        </div>
      </div>

      {/* Vacancy List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            Шукаємо свіжі вакансії на Djinni та DOU...
          </div>
        ) : vacancies.map(vac => (
          <div key={vac.id} className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              
              <div style={{ display: "flex", gap: 16 }}>
                {vac.logo ? (
                  <img src={vac.logo} alt={vac.company} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: vac.logoBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.2rem", fontWeight: 700 }}>
                    {vac.initial}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                    {vac.company}
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: 2 }}>
                    {vac.role}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {vac.location}
                  </div>
                </div>
              </div>

              <button className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem", borderRadius: "var(--radius-full)", color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                Додай резюме
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              {vac.desc}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {vac.inTracker ? (
                <button style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#22c55e", padding: "8px 16px", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer" }}>
                  <Check size={16} /> У трекері
                </button>
              ) : (
                <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "8px 16px", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background="var(--bg-hover)"} onMouseOut={e => e.currentTarget.style.background="transparent"}>
                  <Plus size={16} /> У трекер
                </button>
              )}

              <a href={vac.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", padding: "8px 20px", borderRadius: "var(--radius-full)", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background="var(--accent-light)"} onMouseOut={e => e.currentTarget.style.background="var(--accent)"}>
                Відгукнутися <ExternalLink size={16} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40 }}>
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <ChevronLeft size={16} />
        </button>
        {[1, 2, 3, 4, 5, 6].map(page => (
          <button 
            key={page}
            onClick={() => setCurrentPage(page)}
            style={{ 
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", 
              background: page === currentPage ? "var(--accent)" : "transparent", 
              border: "none", 
              color: page === currentPage ? "#fff" : "var(--text-secondary)", 
              fontWeight: page === currentPage ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {page}
          </button>
        ))}
        <button 
          onClick={() => setCurrentPage(p => Math.min(6, p + 1))}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Bottom Action */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button style={{ background: "transparent", border: "none", color: "var(--accent-light)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
          Додай резюме →
        </button>
      </div>

    </div>
  );
}
