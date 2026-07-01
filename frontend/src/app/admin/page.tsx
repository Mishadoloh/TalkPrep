"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getTranslation, Locale } from "@/lib/translations";
import { 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  Loader2, 
  Search, 
  Database,
  ArrowLeft,
  Download,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Server
} from "lucide-react";

export default function AdminPanel() {
  const [locale, setLocale] = useState<Locale>("en-US");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [authError, setAuthError] = useState("");

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"metrics" | "users" | "transactions">("metrics");
  
  // Service health checks
  const [healthStatus, setHealthStatus] = useState<any>({
    auth: { status: "unknown", db: "unknown", disk: "0" },
    ai: { status: "unknown", db: "unknown", disk: "0" },
    billing: { status: "unknown", db: "unknown", disk: "0" }
  });

  // Search states
  const [userQuery, setUserQuery] = useState("");
  const [txQuery, setTxQuery] = useState("");

  // Feedbacks
  const [seeding, setSeeding] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

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

  // SEO
  useEffect(() => {
    document.title = locale === "uk-UA" ? "Панель Адміністратора - TalkPrep AI" : "Administrative Console - TalkPrep AI";
  }, [locale]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase === "internal-admin-bypass-token" || passphrase === "admin") {
      setIsUnlocked(true);
      setAuthError("");
      loadAdminData();
    } else {
      setAuthError(locale === "uk-UA" ? "Невірний майстер-ключ доступу" : "Invalid master credential key");
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, uRes, tRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/users"),
        fetch("/api/admin/transactions")
      ]);

      const mData = await mRes.json();
      const uData = await uRes.json();
      const tData = await tRes.json();

      if (mData.success) setMetrics(mData.metrics);
      if (uData.success) setUsers(uData.users);
      if (tData.success) setTransactions(tData.transactions);
      
      // Perform health check probes
      probeServiceHealth();
    } catch (e) {
      console.error("Failed to load admin logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const probeServiceHealth = async () => {
    const defaultVal = { status: "offline", db: "offline", disk: "N/A" };
    try {
      const authHealth = await fetch("http://localhost:3010/healthz").then(r => r.json()).catch(() => defaultVal);
      const aiHealth = await fetch("http://localhost:3020/healthz").then(r => r.json()).catch(() => defaultVal);
      const billingHealth = await fetch("http://localhost:3030/healthz").then(r => r.json()).catch(() => defaultVal);

      setHealthStatus({
        auth: { status: authHealth.status || "offline", db: authHealth.database?.status || "offline", disk: authHealth.system?.disk_free_gb || "N/A" },
        ai: { status: aiHealth.status || "offline", db: aiHealth.database?.status || "offline", disk: aiHealth.system?.disk_free_gb || "N/A" },
        billing: { status: billingHealth.status || "offline", db: billingHealth.database?.status || "offline", disk: billingHealth.system?.disk_free_gb || "N/A" }
      });
    } catch (err) {
      console.error("Health probe failure:", err);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    setActionSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/unlock`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(locale === "uk-UA" ? `Акаунт ${userId.slice(0,6)}... успішно розблоковано!` : `Account ${userId.slice(0,6)}... successfully unlocked!`);
        loadAdminData();
      } else {
        alert(data.error || "Unlock failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDevSeed = async () => {
    setSeeding(true);
    setSeedingSuccess("");
    try {
      const res = await fetch("/api/dev/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedingSuccess(locale === "uk-UA" ? "Демо-дані успішно посіяно в базі!" : "Demo data successfully seeded!");
        loadAdminData();
      }
    } catch (e) {
      console.error("Seed failed:", e);
    } finally {
      setSeeding(false);
    }
  };

  const downloadCSVReport = (dataList: any[], reportName: string) => {
    if (dataList.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = Object.keys(dataList[0]).join(",");
    const rows = dataList.map(row => 
      Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter lists based on queries
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.id.includes(userQuery)
  );

  const filteredTxs = transactions.filter(t => 
    t.id.includes(txQuery) || 
    t.userId.includes(txQuery) ||
    t.type.toLowerCase().includes(txQuery.toLowerCase())
  );

  // Group metrics for visual chart
  const subscriptionSales = transactions.filter(t => t.type === "SUBSCRIPTION" && t.status === "SUCCESS").reduce((acc, curr) => acc + curr.amount, 0);
  const packSales = transactions.filter(t => t.type === "PACK" && t.status === "SUCCESS").reduce((acc, curr) => acc + curr.amount, 0);
  const maxSales = Math.max(subscriptionSales, packSales, 100);

  if (!isUnlocked) {
    return (
      <>
        <main className="container flex-center" style={{ minHeight: "80vh", padding: "40px 24px" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "420px", padding: "40px 30px", textAlign: "center" }}>
            <div style={{ background: "rgba(255, 82, 82, 0.1)", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ShieldAlert style={{ color: "var(--color-error)" }} size={28} />
            </div>
            <h1 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>
              {locale === "uk-UA" ? "Адмін-панель" : "Admin Portal"}
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>
              {locale === "uk-UA" 
                ? "Цей розділ обмежено. Будь ласка, введіть майстер-токен для авторизації." 
                : "This directory is locked. Enter the master bypass token to proceed."}
            </p>

            <form onSubmit={handleUnlock}>
              <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
                <label className="form-label" htmlFor="passphrase">Master Access Token</label>
                <input
                  type="password"
                  id="passphrase"
                  className="form-input"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter token..."
                  required
                />
              </div>

              {authError && (
                <div style={{ color: "var(--color-error)", fontSize: "0.85rem", marginBottom: "16px", fontWeight: 600 }}>
                  {authError}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                {locale === "uk-UA" ? "Увійти в консоль" : "Unlock Console"}
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>

      <main className="container" style={{ flex: 1, padding: "50px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "8px", textDecoration: "none" }}>
              <ArrowLeft size={14} />
              {locale === "uk-UA" ? "Назад в кабінет" : "Dashboard"}
            </Link>
            <h1 style={{ fontSize: "2.4rem" }}>
              {locale === "uk-UA" ? "Адміністративний кабінет" : "Admin Console"}
            </h1>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={handleDevSeed} 
              className="btn btn-secondary" 
              style={{ padding: "10px 16px", fontSize: "0.85rem" }}
              disabled={seeding}
            >
              <Database size={14} />
              {seeding ? "Seeding..." : (locale === "uk-UA" ? "Посіяти тестові дані" : "Seed Test Data")}
            </button>
          </div>
        </div>

        {seedingSuccess && (
          <div className="glass-card" style={{ padding: "16px", border: "1px solid var(--color-success)", color: "var(--color-success)", marginBottom: "30px", fontSize: "0.9rem" }}>
            {seedingSuccess}
          </div>
        )}

        {actionSuccess && (
          <div className="glass-card" style={{ padding: "16px", border: "1px solid var(--color-secondary)", color: "var(--color-secondary)", marginBottom: "30px", fontSize: "0.9rem" }}>
            {actionSuccess}
          </div>
        )}

        {/* METRICS ROW */}
        {metrics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            <div className="glass-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ background: "rgba(0, 229, 255, 0.1)", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DollarSign style={{ color: "var(--color-secondary)" }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                  {locale === "uk-UA" ? "Загальний дохід" : "Total Revenue"}
                </span>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  ${metrics.totalRevenue.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ background: "rgba(124, 77, 255, 0.1)", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp style={{ color: "var(--color-primary-hover)" }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                  {locale === "uk-UA" ? "Шомісячний дохід (MRR)" : "Monthly Run-Rate"}
                </span>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  ${metrics.monthlyRecurringRevenue.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ background: "rgba(76, 175, 80, 0.1)", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users style={{ color: "#4caf50" }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                  {locale === "uk-UA" ? "Успішні транзакції" : "Successful Sales"}
                </span>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  {metrics.successfulTransactions}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ background: "rgba(255, 235, 59, 0.1)", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Percent style={{ color: "#fdd835" }} size={24} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                  {locale === "uk-UA" ? "Конверсія платежів" : "Checkout Conversion"}
                </span>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  {metrics.conversionRatePercentage}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div style={{ display: "flex", gap: "12px", borderBottom: "1.5px solid var(--border-color)", paddingBottom: "1px", marginBottom: "30px" }}>
          <button 
            onClick={() => setActiveSubTab("metrics")} 
            className={`tab-btn ${activeSubTab === "metrics" ? "active" : ""}`}
            style={{ background: "none", border: "none", color: activeSubTab === "metrics" ? "var(--color-secondary)" : "var(--color-text-muted)", fontSize: "0.95rem", padding: "10px 16px", cursor: "pointer", fontWeight: 600, borderBottom: activeSubTab === "metrics" ? "2px solid var(--color-secondary)" : "none" }}
          >
            {locale === "uk-UA" ? "Огляд систем" : "System Overview"}
          </button>
          <button 
            onClick={() => setActiveSubTab("users")} 
            className={`tab-btn ${activeSubTab === "users" ? "active" : ""}`}
            style={{ background: "none", border: "none", color: activeSubTab === "users" ? "var(--color-secondary)" : "var(--color-text-muted)", fontSize: "0.95rem", padding: "10px 16px", cursor: "pointer", fontWeight: 600, borderBottom: activeSubTab === "users" ? "2px solid var(--color-secondary)" : "none" }}
          >
            {locale === "uk-UA" ? "База користувачів" : "Users Directory"}
          </button>
          <button 
            onClick={() => setActiveSubTab("transactions")} 
            className={`tab-btn ${activeSubTab === "transactions" ? "active" : ""}`}
            style={{ background: "none", border: "none", color: activeSubTab === "transactions" ? "var(--color-secondary)" : "var(--color-text-muted)", fontSize: "0.95rem", padding: "10px 16px", cursor: "pointer", fontWeight: 600, borderBottom: activeSubTab === "transactions" ? "2px solid var(--color-secondary)" : "none" }}
          >
            {locale === "uk-UA" ? "Журнал платежів" : "Transaction Logs"}
          </button>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex-center" style={{ padding: "60px" }}>
            <Loader2 size={36} className="animate-spin" style={{ color: "var(--color-secondary)" }} />
            <span style={{ marginLeft: "12px", color: "var(--color-text-secondary)" }}>Loading admin reports...</span>
          </div>
        ) : (
          <>
            {/* SUB-TAB 1: SYSTEM OVERVIEW */}
            {activeSubTab === "metrics" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "30px" }}>
                
                {/* Visual Chart CSS Block */}
                <div className="glass-card" style={{ padding: "30px" }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "20px" }}>
                    {locale === "uk-UA" ? "Розподіл фінансових продажів" : "Financial Sales Distribution"}
                  </h3>
                  
                  <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "200px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
                    
                    {/* Bar 1: Packs */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "6px" }}>${packSales}</span>
                      <div 
                        style={{ 
                          width: "36px", 
                          height: `${(packSales / maxSales) * 150}px`, 
                          background: "linear-gradient(to top, var(--color-primary), var(--color-secondary))", 
                          borderRadius: "4px 4px 0 0",
                          boxShadow: "0 0 10px rgba(0, 229, 255, 0.3)"
                        }}
                      />
                      <span style={{ fontSize: "0.85rem", marginTop: "8px", fontWeight: "bold" }}>Packs</span>
                    </div>

                    {/* Bar 2: Subscriptions */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "6px" }}>${subscriptionSales}</span>
                      <div 
                        style={{ 
                          width: "36px", 
                          height: `${(subscriptionSales / maxSales) * 150}px`, 
                          background: "linear-gradient(to top, #4cfa7a, #00e5ff)", 
                          borderRadius: "4px 4px 0 0",
                          boxShadow: "0 0 10px rgba(76, 250, 122, 0.3)"
                        }}
                      />
                      <span style={{ fontSize: "0.85rem", marginTop: "8px", fontWeight: "bold" }}>Pro Sub</span>
                    </div>

                  </div>
                  
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                    {locale === "uk-UA" 
                      ? "Співвідношення одноразових пакетів токенів та довгострокових Pro підписок на сервісі." 
                      : "Ratio of single-purchase token packs to monthly Pro recurring subscriptions."}
                  </p>
                </div>

                {/* Service Health Probe Stats */}
                <div className="glass-card" style={{ padding: "30px" }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Server size={18} style={{ color: "var(--color-secondary)" }} />
                    {locale === "uk-UA" ? "Діагностика хмари" : "Cloud Diagnostic Metrics"}
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
                      <div>
                        <strong>Auth Service</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Disk Free: {healthStatus.auth.disk} GB</div>
                      </div>
                      <span className="badge" style={{ background: healthStatus.auth.status === "healthy" ? "rgba(76,175,80,0.15)" : "rgba(255,82,82,0.15)", color: healthStatus.auth.status === "healthy" ? "var(--color-success)" : "var(--color-error)" }}>
                        {healthStatus.auth.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
                      <div>
                        <strong>AI Service</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Disk Free: {healthStatus.ai.disk} GB</div>
                      </div>
                      <span className="badge" style={{ background: healthStatus.ai.status === "healthy" ? "rgba(76,175,80,0.15)" : "rgba(255,82,82,0.15)", color: healthStatus.ai.status === "healthy" ? "var(--color-success)" : "var(--color-error)" }}>
                        {healthStatus.ai.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>Billing Service</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Disk Free: {healthStatus.billing.disk} GB</div>
                      </div>
                      <span className="badge" style={{ background: healthStatus.billing.status === "healthy" ? "rgba(76,175,80,0.15)" : "rgba(255,82,82,0.15)", color: healthStatus.billing.status === "healthy" ? "var(--color-success)" : "var(--color-error)" }}>
                        {healthStatus.billing.status.toUpperCase()}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB 2: USERS DIRECTORY */}
            {activeSubTab === "users" && (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  {/* Search Bar */}
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", padding: "12px 16px", borderRadius: "var(--radius-sm)" }}>
                    <Search size={16} style={{ color: "var(--color-text-muted)" }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ border: "none", padding: 0, margin: 0, background: "transparent" }}
                      placeholder={locale === "uk-UA" ? "Пошук за поштою, ім'ям або ID..." : "Search by email, name or ID..."}
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={() => downloadCSVReport(users, "talkprep_users")} 
                    className="btn btn-secondary" 
                    style={{ padding: "0 16px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Download size={14} />
                    CSV
                  </button>
                </div>

                <div className="glass-card" style={{ padding: "20px", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--color-text-secondary)" }}>
                        <th style={{ padding: "12px" }}>User ID</th>
                        <th style={{ padding: "12px" }}>Username</th>
                        <th style={{ padding: "12px" }}>Email</th>
                        <th style={{ padding: "12px" }}>Plan</th>
                        <th style={{ padding: "12px" }}>Credits</th>
                        <th style={{ padding: "12px" }}>Lockout reset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{u.id.slice(0, 12)}...</td>
                          <td style={{ padding: "12px", fontWeight: "bold" }}>{u.username}</td>
                          <td style={{ padding: "12px" }}>{u.email}</td>
                          <td style={{ padding: "12px" }}>
                            {u.isPro ? (
                              <span className="badge badge-pro" style={{ fontSize: "0.7rem" }}>PRO</span>
                            ) : (
                              <span className="badge" style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)" }}>FREE</span>
                            )}
                          </td>
                          <td style={{ padding: "12px", fontFamily: "var(--font-mono)" }}>{u.credits}</td>
                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() => handleUnlockUser(u.id)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              title="Unlock account login lockouts"
                            >
                              <Unlock size={10} />
                              {locale === "uk-UA" ? "Скинути" : "Reset Lock"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: TRANSACTION LOGS */}
            {activeSubTab === "transactions" && (
              <div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  {/* Search Bar */}
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", padding: "12px 16px", borderRadius: "var(--radius-sm)" }}>
                    <Search size={16} style={{ color: "var(--color-text-muted)" }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ border: "none", padding: 0, margin: 0, background: "transparent" }}
                      placeholder={locale === "uk-UA" ? "Пошук за ID сесії чи типом..." : "Search by session ID or type..."}
                      value={txQuery}
                      onChange={(e) => setTxQuery(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={() => downloadCSVReport(transactions, "talkprep_transactions")} 
                    className="btn btn-secondary" 
                    style={{ padding: "0 16px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Download size={14} />
                    CSV
                  </button>
                </div>

                <div className="glass-card" style={{ padding: "20px", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--color-text-secondary)" }}>
                        <th style={{ padding: "12px" }}>Session ID</th>
                        <th style={{ padding: "12px" }}>User ID</th>
                        <th style={{ padding: "12px" }}>Amount</th>
                        <th style={{ padding: "12px" }}>Credits</th>
                        <th style={{ padding: "12px" }}>Type</th>
                        <th style={{ padding: "12px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.map((t) => (
                        <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{t.id.slice(0, 12)}...</td>
                          <td style={{ padding: "12px", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{t.userId.slice(0, 8)}...</td>
                          <td style={{ padding: "12px", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>${t.amount.toFixed(2)}</td>
                          <td style={{ padding: "12px", fontFamily: "var(--font-mono)" }}>{t.credits}</td>
                          <td style={{ padding: "12px" }}>{t.type}</td>
                          <td style={{ padding: "12px" }}>
                            {t.status === "SUCCESS" ? (
                              <span className="badge" style={{ background: "rgba(0, 230, 118, 0.15)", color: "var(--color-success)", fontSize: "0.7rem" }}>SUCCESS</span>
                            ) : t.status === "PENDING" ? (
                              <span className="badge" style={{ background: "rgba(255, 179, 0, 0.15)", color: "var(--color-warning)", fontSize: "0.7rem" }}>PENDING</span>
                            ) : (
                              <span className="badge" style={{ background: "rgba(255, 82, 82, 0.15)", color: "var(--color-error)", fontSize: "0.7rem" }}>FAILED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
