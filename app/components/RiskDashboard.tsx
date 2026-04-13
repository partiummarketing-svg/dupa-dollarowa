"use client";

import { useEffect, useState } from "react";

type SignalStatus = "risk-on" | "risk-off" | "neutral" | "loading" | "error";

type Asset = {
  key: string;
  label: string;
  sublabel: string;
  icon: string;
  price: number | null;
  ma200: number | null;
  change: number | null;
  status: SignalStatus;
  pctFromMA: number | null;
  interpretation: string;
  question: string;
};

type OverallRegime = "easy" | "risk-off" | "chaos" | "loading";

const ASSETS = [
  { key: "SPY",  label: "S&P 500",       sublabel: "SPX",          question: "Does the market want risk?",           icon: "📊" },
  { key: "BTC",  label: "Bitcoin",        sublabel: "BTC/USD",      question: "Does crypto confirm risk appetite?",   icon: "₿"  },
  { key: "DX-Y", label: "US Dollar",      sublabel: "DXY Index",    question: "Does the world want to hold USD?",     icon: "💵" },
  { key: "TNX",  label: "10Y Yield",      sublabel: "Treasury",     question: "Is money getting more expensive?",     icon: "🏦" },
  { key: "GLD",  label: "Gold",           sublabel: "XAU/USD",      question: "Is trust breaking down?",             icon: "🪙" },
  { key: "USO",  label: "Crude Oil",      sublabel: "WTI",          question: "Is inflation stress building?",        icon: "🛢️" },
  { key: "VIX",  label: "Volatility",     sublabel: "VIX Index",    question: "Is the regime changing?",             icon: "🔥" },
];

function calcMA(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export default function RiskDashboard() {
  const [assets, setAssets] = useState<Asset[]>(
    ASSETS.map((a) => ({
      ...a,
      price: null,
      ma200: null,
      change: null,
      status: "loading",
      pctFromMA: null,
      interpretation: "",
    }))
  );
  const [regime, setRegime] = useState<OverallRegime>("loading");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);

  const fetchAll = async () => {
    const results = await Promise.all(
      ASSETS.map(async (a) => {
        try {
          const res = await fetch(`/api/market-data?symbol=${a.key}`);
          if (!res.ok) throw new Error();
          return await res.json();
        } catch {
          return null;
        }
      })
    );

    const updated: Asset[] = ASSETS.map((a, i) => {
      const d = results[i];
      if (!d) return { ...a, price: null, ma200: null, change: null, status: "error" as SignalStatus, pctFromMA: null, interpretation: "Data unavailable" };

      const pct = d.ma200 ? ((d.price - d.ma200) / d.ma200) * 100 : null;
      let status: SignalStatus = "neutral";
      let interpretation = "";

      if (a.key === "SPY") {
        status = d.price > d.ma200 ? "risk-on" : "risk-off";
        interpretation = d.price > d.ma200 ? "Above 200 MA — uptrend intact" : "Below 200 MA — downtrend active";
      } else if (a.key === "BTC") {
        status = d.price > d.ma200 ? "risk-on" : "risk-off";
        interpretation = d.price > d.ma200 ? "Above 200 MA — risk appetite present" : "Below 200 MA — risk appetite absent";
      } else if (a.key === "DX-Y") {
        status = d.price > d.ma200 ? "risk-off" : "risk-on";
        interpretation = d.price > d.ma200 ? "Strong USD — stress / flight to cash" : "Weak USD — tailwind for risk assets";
      } else if (a.key === "TNX") {
        status = d.change && d.change > 0 ? "risk-off" : "risk-on";
        interpretation = d.change && d.change > 0 ? "Yields rising — pressure on everything" : "Yields falling — relief for markets";
      } else if (a.key === "GLD") {
        status = d.price > d.ma200 ? "risk-off" : "neutral";
        interpretation = d.price > d.ma200 ? "Gold elevated — lack of trust in system" : "Gold calm — no panic signal";
      } else if (a.key === "USO") {
        status = d.price > d.ma200 ? "neutral" : "risk-on";
        interpretation = d.price > d.ma200 ? "Oil high — inflation / cost stress" : "Oil contained — no inflation pressure";
      } else if (a.key === "VIX") {
        status = d.price > 20 ? "risk-off" : d.price > 15 ? "neutral" : "risk-on";
        interpretation = d.price > 25 ? "High fear — regime may be changing" : d.price > 15 ? "Elevated — watch carefully" : "Low volatility — calm environment";
      }

      return { ...a, price: d.price, ma200: d.ma200 ?? null, change: d.change ?? null, status, pctFromMA: pct, interpretation };
    });

    setAssets(updated);
    setLastUpdated(new Date().toLocaleTimeString());

    // Determine overall regime
    const spx = updated.find((a) => a.key === "SPY");
    const btc = updated.find((a) => a.key === "BTC");
    const dxy = updated.find((a) => a.key === "DX-Y");
    const tnx = updated.find((a) => a.key === "TNX");
    const gld = updated.find((a) => a.key === "GLD");
    const uso = updated.find((a) => a.key === "USO");

    const riskOnCount = [spx, btc, dxy, tnx].filter((a) => a?.status === "risk-on").length;
    const riskOffCount = [spx, btc, dxy, tnx].filter((a) => a?.status === "risk-off").length;
    const chaosSignals = [gld, uso].filter((a) => a?.status === "risk-off" || a?.status === "neutral").length;

    if (riskOnCount >= 3 && chaosSignals < 2) setRegime("easy");
    else if (riskOffCount >= 3) setRegime("risk-off");
    else setRegime("chaos");

    // Build checklist
    setChecklist([
      `SPX ${spx?.status === "risk-on" ? "↑ above 200 MA" : "↓ below 200 MA"}`,
      `BTC ${btc?.status === "risk-on" ? "↑ above 200 MA" : "↓ below 200 MA"}`,
      `USD ${dxy?.status === "risk-off" ? "↑ strong — stress signal" : "↓ weak — easing signal"}`,
      `Yields ${tnx?.status === "risk-off" ? "↑ rising — pressure" : "↓ falling — relief"}`,
      `Gold ${gld?.status === "risk-off" ? "↑ elevated — fear signal" : "calm — no panic"}`,
      `Oil ${uso?.status !== "risk-on" ? "↑ elevated — inflation risk" : "contained — benign"}`,
    ]);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const regimeCfg = {
    easy: {
      emoji: "🟢",
      label: "EASY MODE",
      desc: "All signals aligned — risk-on environment",
      detail: "SPX ↑  BTC ↑  USD ↓  Yields ↓",
      color: "#166534",
      bg: "#f0fdf4",
      border: "#86efac",
      badge: "#dcfce7",
    },
    "risk-off": {
      emoji: "🔴",
      label: "RISK OFF",
      desc: "Defensive signals dominant — protect capital",
      detail: "SPX ↓  BTC ↓  USD ↑  Yields ↑",
      color: "#991b1b",
      bg: "#fff1f2",
      border: "#fca5a5",
      badge: "#fee2e2",
    },
    chaos: {
      emoji: "🟡",
      label: "CHAOS",
      desc: "Signals conflicting — most difficult environment",
      detail: "Gold ↑  USD ↑  SPX ↓  Oil ↑",
      color: "#92400e",
      bg: "#fffbeb",
      border: "#fcd34d",
      badge: "#fef3c7",
    },
    loading: {
      emoji: "⏳",
      label: "LOADING",
      desc: "Fetching market data...",
      detail: "",
      color: "#374151",
      bg: "#f9fafb",
      border: "#e5e7eb",
      badge: "#f3f4f6",
    },
  };

  const rc = regimeCfg[regime];

  const statusColor = (s: SignalStatus) =>
    s === "risk-on" ? "#166534" : s === "risk-off" ? "#991b1b" : s === "neutral" ? "#92400e" : "#6b7280";
  const statusBg = (s: SignalStatus) =>
    s === "risk-on" ? "#dcfce7" : s === "risk-off" ? "#fee2e2" : s === "neutral" ? "#fef3c7" : "#f3f4f6";
  const statusLabel = (s: SignalStatus) =>
    s === "risk-on" ? "RISK ON" : s === "risk-off" ? "RISK OFF" : s === "neutral" ? "NEUTRAL" : "—";

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "#f8fafc",
      minHeight: "100vh",
      padding: "2rem",
      color: "#0f172a",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: "0.25rem", fontWeight: 600 }}>
            DUPA DOLLAROWA
          </div>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" }}>
            Market Perception Dashboard
          </h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
            Do these all tell the same story — or do they conflict?
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {lastUpdated && (
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", letterSpacing: "0.05em" }}>
              Updated {lastUpdated}
            </span>
          )}
          <button onClick={fetchAll} style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontSize: "0.7rem",
            padding: "5px 12px",
            cursor: "pointer",
            borderRadius: "6px",
            fontFamily: "inherit",
            fontWeight: 500,
          }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Regime Banner */}
      <div style={{
        background: rc.bg,
        border: `1px solid ${rc.border}`,
        borderRadius: "10px",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "2rem" }}>{rc.emoji}</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: rc.color, letterSpacing: "0.05em" }}>
              {rc.label}
            </div>
            <div style={{ fontSize: "0.8rem", color: rc.color, opacity: 0.8, marginTop: "0.1rem" }}>
              {rc.desc}
            </div>
          </div>
        </div>
        {rc.detail && (
          <div style={{
            background: rc.badge,
            border: `1px solid ${rc.border}`,
            borderRadius: "6px",
            padding: "0.4rem 0.8rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: rc.color,
            letterSpacing: "0.05em",
          }}>
            {rc.detail}
          </div>
        )}
      </div>

      {/* Asset Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {assets.map((asset) => (
          <div key={asset.key} style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "1.25rem",
            borderTop: `3px solid ${statusColor(asset.status)}`,
          }}>
            {/* Card header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>{asset.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{asset.label}</div>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", letterSpacing: "0.08em" }}>{asset.sublabel}</div>
                </div>
              </div>
              <span style={{
                background: statusBg(asset.status),
                color: statusColor(asset.status),
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "3px 8px",
                borderRadius: "4px",
              }}>
                {statusLabel(asset.status)}
              </span>
            </div>

            {/* Price row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                <div style={{ fontSize: "0.55rem", color: "#94a3b8", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.2rem" }}>PRICE</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                  {asset.price !== null
                    ? asset.key === "BTC"
                      ? `$${asset.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                      : asset.key === "TNX" || asset.key === "VIX"
                      ? `${asset.price.toFixed(2)}`
                      : `$${asset.price.toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                <div style={{ fontSize: "0.55rem", color: "#94a3b8", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.2rem" }}>200 MA</div>
                <div style={{ fontSize: "1rem", fontWeight: 500, color: "#64748b" }}>
                  {asset.ma200 !== null
                    ? asset.key === "BTC"
                      ? `$${asset.ma200.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                      : `${asset.ma200.toFixed(2)}`
                    : asset.key === "TNX" || asset.key === "VIX" ? "—" : "—"}
                </div>
              </div>
            </div>

            {/* Pct from MA bar */}
            {asset.pctFromMA !== null && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.6rem", color: "#94a3b8", letterSpacing: "0.08em" }}>DIST FROM 200 MA</span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: statusColor(asset.status) }}>
                    {asset.pctFromMA > 0 ? "+" : ""}{asset.pctFromMA.toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2 }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(Math.abs(asset.pctFromMA) * 2, 100)}%`,
                    background: statusColor(asset.status),
                    borderRadius: 2,
                    opacity: 0.7,
                  }} />
                </div>
              </div>
            )}

            {/* Interpretation */}
            <div style={{
              fontSize: "0.72rem",
              color: "#475569",
              borderTop: "1px solid #f1f5f9",
              paddingTop: "0.6rem",
              lineHeight: 1.5,
            }}>
              {asset.interpretation || "Loading..."}
            </div>

            {/* Question */}
            <div style={{
              fontSize: "0.65rem",
              color: "#94a3b8",
              fontStyle: "italic",
              marginTop: "0.35rem",
            }}>
              {asset.question}
            </div>
          </div>
        ))}
      </div>

      {/* Morning Checklist */}
      {checklist.length > 0 && (
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "1.25rem 1.5rem",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🧩 Morning Checklist
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
            {checklist.map((item, i) => (
              <div key={i} style={{
                fontSize: "0.75rem",
                color: "#334155",
                background: "#f8fafc",
                borderRadius: "6px",
                padding: "0.5rem 0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                <span style={{ color: "#94a3b8", fontWeight: 700 }}>{i + 1}.</span>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic" }}>
            Ask yourself: do these all tell the same story, or do they conflict?
          </div>
        </div>
      )}
    </div>
  );
}
