"use client";

import React, { useState } from "react";
import { Briefcase, Plus, ChevronRight } from "lucide-react";

export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState("Всі");

  const stats = [
    { label: "Список", count: 1 },
    { label: "Відгукнувся", count: 0 },
    { label: "Співбесіда", count: 0 },
    { label: "Оффер", count: 0 },
  ];

  const tabs = [
    { label: "Всі", count: 1 },
    { label: "Список", count: 1 },
    { label: "Відгукнувся", count: 0 },
    { label: "Співбесіда", count: 0 },
    { label: "Оффер", count: 0 },
    { label: "Відмова", count: 0 },
  ];

  const trackedJobs = [
    {
      id: 1,
      company: "Evoplay",
      logo: "https://images.weserv.nl/?url=https://avatars.githubusercontent.com/u/41584984&w=100&h=100&fit=cover",
      role: "Front-end Developer (Vue.JS)",
      status: "Список"
    }
  ];

  return (
    <div className="page-content" style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 100 }}>
      
      {/* Header Card */}
      <div className="glass-card" style={{ padding: "24px", position: "relative", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ 
            width: "48px", height: "48px", borderRadius: "12px", 
            background: "rgba(108, 92, 231, 0.1)", display: "flex", 
            alignItems: "center", justifyContent: "center", color: "var(--accent)" 
          }}>
            <Briefcase size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              Мої вакансії
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Твоя воронка пошуку роботи
            </p>
            <button style={{ 
              display: "flex", alignItems: "center", gap: "8px", 
              background: "rgba(108, 92, 231, 0.1)", border: "1px solid rgba(108, 92, 231, 0.2)", 
              color: "var(--accent-light)", padding: "8px 16px", borderRadius: "var(--radius-md)", 
              fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" 
            }}>
              <Plus size={16} /> Додати
            </button>
          </div>
        </div>
        
        {/* Total Count Badge */}
        <div style={{ 
          position: "absolute", top: "24px", right: "24px",
          width: "32px", height: "32px", borderRadius: "50%",
          background: "rgba(108, 92, 231, 0.1)", color: "var(--accent-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 600, fontSize: "1rem"
        }}>
          1
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
              {stat.count}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(tab.label)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                background: isActive ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Tracked Jobs List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {trackedJobs.filter(job => activeTab === "Всі" || job.status === activeTab).map((job) => (
          <div key={job.id} className="glass-card" style={{ 
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "all 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
          onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img 
                src={job.logo} 
                alt={job.company} 
                style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover" }} 
              />
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                  {job.company}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  {job.role}
                </div>
                <div style={{ 
                  display: "inline-block", padding: "4px 10px", borderRadius: "var(--radius-sm)",
                  background: "rgba(255, 255, 255, 0.05)", color: "var(--text-secondary)",
                  fontSize: "0.75rem", fontWeight: 500
                }}>
                  {job.status}
                </div>
              </div>
            </div>
            
            <div style={{ color: "var(--text-secondary)" }}>
              <ChevronRight size={20} />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
