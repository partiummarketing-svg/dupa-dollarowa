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

      {/* Petrodollar Analysis */}
      {assets.some(a => a.status !== "loading" && a.status !== "error") && (() => {
        const spx = assets.find(a => a.key === "SPY");
        const btc = assets.find(a => a.key === "BTC");
        const dxy = assets.find(a => a.key === "DX-Y");
        const tnx = assets.find(a => a.key === "TNX");
        const gld = assets.find(a => a.key === "GLD");
        const uso = assets.find(a => a.key === "USO");

        // Petrodollar Stress Index (0–5)
        let stressScore = 0;
        if (gld?.status === "risk-off") stressScore++;
        if (btc?.price != null && btc?.ma200 != null && btc.price > btc.ma200) stressScore++;
        if (dxy?.status === "risk-on") stressScore++;
        if (tnx?.price != null && tnx?.ma200 != null && tnx.price > tnx.ma200) stressScore++;
        if (uso?.price != null && uso?.ma200 != null && uso.price > uso.ma200) stressScore++;

        // Correlation Break Score (0–3)
        const oilUsdAnomaly  = uso?.change != null && dxy?.change != null && uso.change > 0 && dxy.change > 0;
        const goldUsdAnomaly = gld?.change != null && dxy?.change != null && gld.change > 0 && dxy.change > 0;
        const bondUsdAnomaly = tnx?.change != null && dxy?.change != null && tnx.change > 0 && dxy.change < 0;
        const spxUsdAnomaly  = spx?.change != null && dxy?.change != null && spx.change < 0 && dxy.change < 0;
        const btcGldAnomaly  = btc?.change != null && gld?.change != null && dxy?.change != null && btc.change > 0 && gld.change > 0 && dxy.change >= 0;
        const corrBreakScore = [oilUsdAnomaly, goldUsdAnomaly, bondUsdAnomaly].filter(Boolean).length;

        const systemState: "normal" | "cracks" | "systemic" =
          stressScore >= 4 ? "systemic" : stressScore >= 2 || corrBreakScore >= 2 ? "cracks" : "normal";

        const systemCfg = {
          normal:   { label: "NORMALNY SYSTEM",   desc: "Petrodolar działa — klasyczne relacje trzymają",          color: "#166534", bg: "#f0fdf4", border: "#86efac" },
          cracks:   { label: "PĘKNIĘCIA",          desc: "Klasyczne zależności zaczynają się psuć — obserwuj",     color: "#92400e", bg: "#fffbeb", border: "#fcd34d" },
          systemic: { label: "SYSTEMOWY PROBLEM",  desc: "Utrata zaufania do dolara jako fundamentu systemu",      color: "#991b1b", bg: "#fff1f2", border: "#fca5a5" },
        };
        const sc = systemCfg[systemState];

        const fmt = (change: number | null, upLabel = "↑", downLabel = "↓") =>
          change == null ? "—" : change > 0 ? upLabel : downLabel;

        const relations = [
          {
            label: "Ropa vs USD", icons: "🛢️ vs 💵",
            normal: "ropa ↑ → USD ↓ (odwrotna korelacja)",
            anomalyDesc: "ropa ↑ mimo silnego USD → możliwy sygnał zmiany systemu",
            isAnomaly: oilUsdAnomaly,
            signal: uso?.change != null && dxy?.change != null ? `Ropa ${fmt(uso.change)}  USD ${fmt(dxy.change)}` : "—",
          },
          {
            label: "Złoto vs USD", icons: "🪙 vs 💵",
            normal: "złoto ↑ → USD ↓ (odwrotna korelacja)",
            anomalyDesc: "złoto ↑ mimo silnego USD → ucieczka od dolara jako rezerwy",
            isAnomaly: goldUsdAnomaly,
            signal: gld?.change != null && dxy?.change != null ? `Złoto ${fmt(gld.change)}  USD ${fmt(dxy.change)}` : "—",
          },
          {
            label: "BTC + Złoto vs USD", icons: "₿🪙 vs 💵",
            normal: "BTC rośnie przy luzowaniu finansowym",
            anomalyDesc: "BTC ↑ + złoto ↑ + USD nie spada → systemowa nieufność do fiat",
            isAnomaly: btcGldAnomaly,
            signal: btc?.change != null && gld?.change != null ? `BTC ${fmt(btc.change)}  GLD ${fmt(gld.change)}` : "—",
          },
          {
            label: "Obligacje vs USD", icons: "🏦 vs 💵",
            normal: "risk-off → obligacje ↑ (safe haven)",
            anomalyDesc: "obligacje ↓ + USD ↓ → utrata zaufania do długu USA",
            isAnomaly: bondUsdAnomaly,
            signal: tnx?.change != null && dxy?.change != null ? `Yields ${fmt(tnx.change)}  USD ${fmt(dxy.change)}` : "—",
          },
          {
            label: "S&P 500 vs USD", icons: "📊 vs 💵",
            normal: "USD ↓ → akcje ↑",
            anomalyDesc: "akcje ↓ + USD ↓ → kapitał ucieka z USA (alarm)",
            isAnomaly: spxUsdAnomaly,
            signal: spx?.change != null && dxy?.change != null ? `SPX ${fmt(spx.change)}  USD ${fmt(dxy.change)}` : "—",
          },
        ];

        const stressItems = [
          { label: "Złoto > 200MA",                    active: gld?.status === "risk-off" },
          { label: "BTC > 200MA",                      active: !!(btc?.price != null && btc?.ma200 != null && btc.price > btc.ma200) },
          { label: "USD < 200MA",                      active: dxy?.status === "risk-on" },
          { label: "Yields > 200MA (obligacje słabe)", active: !!(tnx?.price != null && tnx?.ma200 != null && tnx.price > tnx.ma200) },
          { label: "Ropa > 200MA",                     active: !!(uso?.price != null && uso?.ma200 != null && uso.price > uso.ma200) },
        ];

        return (
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🧠 Analiza Petrodolara
            </div>

            {/* System state + scores */}
            <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: sc.color, letterSpacing: "0.05em" }}>{sc.label}</div>
                <div style={{ fontSize: "0.75rem", color: sc.color, opacity: 0.8, marginTop: "0.15rem" }}>{sc.desc}</div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ textAlign: "center", background: "#fff", border: `1px solid ${sc.border}`, borderRadius: "8px", padding: "0.5rem 1rem" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: sc.color }}>{stressScore}<span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>/5</span></div>
                  <div style={{ fontSize: "0.55rem", color: "#94a3b8", letterSpacing: "0.1em", fontWeight: 600 }}>STRESS INDEX</div>
                </div>
                <div style={{ textAlign: "center", background: "#fff", border: `1px solid ${sc.border}`, borderRadius: "8px", padding: "0.5rem 1rem" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: corrBreakScore >= 2 ? "#991b1b" : corrBreakScore === 1 ? "#92400e" : "#166534" }}>{corrBreakScore}<span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>/3</span></div>
                  <div style={{ fontSize: "0.55rem", color: "#94a3b8", letterSpacing: "0.1em", fontWeight: 600 }}>CORR BREAKS</div>
                </div>
              </div>
            </div>

            {/* Key relationships grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {relations.map((rel, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem 1.25rem", borderLeft: `4px solid ${rel.isAnomaly ? "#ef4444" : "#22c55e"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>{rel.label}</div>
                      <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "0.1rem" }}>{rel.icons}</div>
                    </div>
                    <span style={{ background: rel.isAnomaly ? "#fee2e2" : "#dcfce7", color: rel.isAnomaly ? "#991b1b" : "#166534", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: "4px" }}>
                      {rel.isAnomaly ? "⚠ ANOMALIA" : "✓ NORMALNIE"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.35rem" }}>
                    <span style={{ color: "#94a3b8" }}>Dziś: </span><strong>{rel.signal}</strong>
                  </div>
                  <div style={{ fontSize: "0.68rem", color: rel.isAnomaly ? "#991b1b" : "#64748b", fontStyle: rel.isAnomaly ? "normal" : "italic" }}>
                    {rel.isAnomaly ? `⚠ ${rel.anomalyDesc}` : `Norma: ${rel.normal}`}
                  </div>
                </div>
              ))}
            </div>

            {/* Stress index breakdown */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem 1.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: "0.72rem", color: "#475569", marginBottom: "0.6rem", letterSpacing: "0.08em" }}>
                PETRODOLLAR STRESS INDEX — składniki
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.4rem" }}>
                {stressItems.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: item.active ? "#991b1b" : "#64748b", background: item.active ? "#fff1f2" : "#f8fafc", borderRadius: "6px", padding: "0.4rem 0.6rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>{item.active ? "●" : "○"}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Czerwona Dupa */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
        <svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
          {/* left cheek */}
          <ellipse cx="72" cy="80" rx="62" ry="70" fill="#e53e3e" />
          {/* right cheek */}
          <ellipse cx="128" cy="80" rx="62" ry="70" fill="#c53030" />
          {/* crack */}
          <path d="M100 10 Q94 80 100 150" stroke="#9b2c2c" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* highlight left */}
          <ellipse cx="58" cy="52" rx="18" ry="22" fill="#fc8181" opacity="0.4" />
          {/* highlight right */}
          <ellipse cx="142" cy="52" rx="18" ry="22" fill="#fc8181" opacity="0.25" />
        </svg>
      </div>
    </div>
  );
}
