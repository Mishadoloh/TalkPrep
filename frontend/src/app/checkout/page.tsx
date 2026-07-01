"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, Sparkles, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { playSuccessSound } from "@/lib/audio-effects";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState("");

  // Card details state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session details. Please try initiating checkout again.");
      setLoading(false);
      return;
    }

    const fetchTransactionDetails = async () => {
      try {
        const res = await fetch(`/api/billing/transaction/${sessionId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setTransaction(data.transaction);
        } else {
          setError(data.error || "Failed to load payment session.");
        }
      } catch (e) {
        setError("Failed to communicate with billing system.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [sessionId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setError("");
    setPaymentProcessing(true);
    setProcessingStep(0);

    // Simulate Stripe payment gateway steps
    const steps = [
      "Contacting secure Stripe servers...",
      "Validating card information...",
      "Requesting authorization from bank...",
      "Securing payment authorization...",
    ];

    const timer = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1200);

    // Make the actual call to update database after simulation finishes
    setTimeout(async () => {
      try {
        const res = await fetch("/api/billing/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, status: "SUCCESS" }),
        });
        const data = await res.json();
        clearInterval(timer);

        if (res.ok && data.success) {
          setPaymentSuccess(true);
          playSuccessSound();
          // Trigger confetti!
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          });
          // Dispatch user update event for header sync
          window.dispatchEvent(new Event("user-updated"));
        } else {
          setError(data.error || "Payment simulation failed.");
          setPaymentProcessing(false);
        }
      } catch (err) {
        setError("Failed to execute payment callback.");
        setPaymentProcessing(false);
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <Loader2 size={36} className="animate-spin" style={{ color: "var(--color-secondary)" }} />
        <span style={{ marginLeft: "12px", color: "var(--color-text-secondary)" }}>Loading billing details...</span>
      </div>
    );
  }

  if (error && !paymentSuccess) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "20px", padding: "24px" }}>
        <div style={{ color: "var(--color-error)", fontSize: "1.2rem", textAlign: "center" }}>{error}</div>
        <Link href="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const stepsText = [
    "Contacting secure Stripe servers...",
    "Validating card information...",
    "Requesting authorization from bank...",
    "Securing payment authorization...",
  ];

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>

      {paymentSuccess ? (
        // 1. Success Panel
        <div className="glass-card" style={{ width: "100%", maxWidth: "460px", padding: "40px 30px", textAlign: "center", animation: "pulseGlow 2s" }}>
          <div className="flex-center" style={{ color: "var(--color-success)", marginBottom: "20px" }}>
            <CheckCircle size={64} style={{ filter: "drop-shadow(0 0 10px rgba(0, 230, 118, 0.4))" }} />
          </div>
          <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>Payment Successful!</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>
            Thank you for your purchase. Your account has been upgraded.
          </p>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
              padding: "16px",
              borderRadius: "var(--radius-sm)",
              textAlign: "left",
              fontSize: "0.85rem",
              marginBottom: "30px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Item:</span>
              <strong style={{ color: "var(--color-text-primary)" }}>
                {transaction.type === "SUBSCRIPTION" ? "Unlimited Pro Subscription" : "5-Interview Credit Pack"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Amount Paid:</span>
              <strong style={{ color: "var(--color-text-primary)" }}>${transaction.amount.toFixed(2)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Receipt ID:</span>
              <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                {transaction.id.slice(0, 8)}...
              </span>
            </div>
          </div>

          <Link href="/dashboard" className="btn btn-primary" style={{ width: "100%" }}>
            Go to Dashboard
          </Link>
        </div>
      ) : paymentProcessing ? (
        // 2. Processing Loader Panel
        <div className="glass-card" style={{ width: "100%", maxWidth: "460px", padding: "60px 40px", textAlign: "center" }}>
          <div className="flex-center" style={{ marginBottom: "24px" }}>
            <Loader2
              size={48}
              style={{
                color: "var(--color-secondary)",
                animation: "spin 1.5s linear infinite",
              }}
            />
          </div>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>Processing Payment</h3>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {stepsText[processingStep]}
          </div>
        </div>
      ) : (
        // 3. Billing Payment Form
        <div className="glass-card" style={{ width: "100%", maxWidth: "480px", padding: "40px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <Link href="/dashboard" style={{ color: "var(--color-text-muted)" }}>
              <ArrowLeft size={20} />
            </Link>
            <h2 style={{ fontSize: "1.4rem" }}>Stripe Secure Checkout</h2>
          </div>

          <div
            style={{
              background: "rgba(124, 77, 255, 0.05)",
              border: "1px solid var(--border-color)",
              padding: "16px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                Purchasing
              </span>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "2px" }}>
                {transaction.type === "SUBSCRIPTION" ? "Unlimited Pro Subscription" : "5-Interview Credit Pack"}
              </div>
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-secondary)", fontFamily: "var(--font-mono)" }}>
              ${transaction.amount.toFixed(2)}
            </div>
          </div>

          <form onSubmit={handlePay}>
            <div className="form-group">
              <label className="form-label" htmlFor="cardName">
                Name on Card
              </label>
              <input
                type="text"
                id="cardName"
                className="form-input"
                placeholder="Jane Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cardNumber">
                Card Number
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  id="cardNumber"
                  className="form-input"
                  style={{ paddingLeft: "44px" }}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    // Simple card formatting 4-4-4-4
                    const val = e.target.value.replace(/\D/g, "");
                    const matches = val.match(/\d{4,16}/g);
                    const match = (matches && matches[0]) || "";
                    const parts = [];
                    for (let i = 0, len = match.length; i < len; i += 4) {
                      parts.push(match.substring(i, i + 4));
                    }
                    setCardNumber(parts.length > 0 ? parts.join(" ") : val);
                  }}
                  required
                />
                <CreditCard
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "14px",
                    color: "var(--color-text-muted)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cardExpiry">
                  Expiration
                </label>
                <input
                  type="text"
                  id="cardExpiry"
                  className="form-input"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length >= 2) {
                      val = val.substring(0, 2) + "/" + val.substring(2, 4);
                    }
                    setCardExpiry(val);
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cardCvc">
                  CVC
                </label>
                <input
                  type="text"
                  id="cardCvc"
                  className="form-input"
                  placeholder="123"
                  maxLength={3}
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "1rem", marginTop: "16px" }}
            >
              <ShieldCheck size={16} />
              Simulate Secure Payment
            </button>
          </form>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              marginTop: "20px",
              color: "var(--color-text-muted)",
              fontSize: "0.75rem",
            }}
          >
            <ShieldCheck size={14} style={{ color: "var(--color-success)" }} />
            Encrypted Stripe Sandbox. No real money will be charged.
          </div>
        </div>
      )}
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <Loader2 size={36} className="animate-spin" style={{ color: "var(--color-secondary)" }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
