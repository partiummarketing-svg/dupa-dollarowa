"use client";

import { useEffect, useState, useCallback } from "react";
import type { ModelOutput } from "@/lib/model/types";
import { PerceptionHero } from "./PerceptionHero";
import { LayerBreakdown } from "./LayerBreakdown";
import { CorrelationAnomalies } from "./CorrelationAnomalies";
import { AssetGrid } from "./AssetGrid";
import { RelativeStrength } from "./RelativeStrength";
import { EmBasket } from "./EmBasket";
import { PersistenceChart } from "./PersistenceChart";
import { MorningChecklist } from "./MorningChecklist";
import { MacroContext } from "./MacroContext";
import { RedButt } from "./RedButt";

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0 1rem" }}>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.15em", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "#f8fafc", minHeight: "100vh", padding: "2rem",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem", animation: "pulse 2s infinite" }}>⏳</div>
        <div style={{ fontWeight: 700, color: "#334155", fontSize: "0.9rem" }}>Ładowanie danych rynkowych…</div>
        <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.5rem" }}>
          Pobieranie ~13 serii historycznych. Może potrwać kilkanaście sekund.
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "#f8fafc", minHeight: "100vh", padding: "2rem",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
        <div style={{ fontWeight: 700, color: "#991b1b", fontSize: "0.9rem" }}>Błąd pobierania danych</div>
        <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.5rem", marginBottom: "1rem" }}>
          Sprawdź połączenie z internetem lub spróbuj ponownie.
        </div>
        <button onClick={onRetry} style={{
          background: "#0f172a", color: "#fff", border: "none", borderRadius: 6,
          padding: "8px 20px", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit",
        }}>
          ↻ Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<ModelOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/perception-score");
      if (!res.ok) throw new Error("API error");
      const json: ModelOutput = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString("pl-PL"));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000); // 15 min
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <Skeleton />;
  if (error || !data) return <ErrorState onRetry={fetchData} />;

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "#f8fafc",
      minHeight: "100vh",
      padding: "2rem",
      color: "#0f172a",
      maxWidth: 1280,
      margin: "0 auto",
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.75rem",
      }}>
        <div>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: "0.25rem", fontWeight: 700 }}>
            DUPA DOLLAROWA
          </div>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
            Market Perception System
          </h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>
            Detekcja momentu w którym rynek przestaje wierzyć w dotychczasowe zasady globalnego systemu finansowego.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {lastUpdated && (
            <span style={{ fontSize: "0.62rem", color: "#94a3b8", letterSpacing: "0.05em" }}>
              Zaktualizowano: {lastUpdated}
            </span>
          )}
          <button onClick={fetchData} style={{
            background: "#fff", border: "1px solid #e2e8f0", color: "#475569",
            fontSize: "0.7rem", padding: "5px 12px", cursor: "pointer", borderRadius: 6,
            fontFamily: "inherit", fontWeight: 600,
          }}>
            ↻ Odśwież
          </button>
        </div>
      </div>

      {/* ── SEKCJA 1: PERCEPTION HERO ──────────────────────────────────── */}
      <PerceptionHero data={data} />

      {/* ── SEKCJA 2: LAYER BREAKDOWN ──────────────────────────────────── */}
      <LayerBreakdown data={data} />

      {/* ── SEKCJA 3: HISTORIA SCORE ───────────────────────────────────── */}
      <PersistenceChart data={data} />

      <Divider label="ANALIZA KORELACJI" />

      {/* ── SEKCJA 4: ANOMALIE KORELACJI ───────────────────────────────── */}
      <CorrelationAnomalies data={data} />

      <Divider label="AKTYWA RYNKOWE" />

      {/* ── SEKCJA 5: ASSET GRID ───────────────────────────────────────── */}
      <AssetGrid data={data} />

      <Divider label="PRZEPŁYWY KAPITAŁU" />

      {/* ── SEKCJA 6: RELATIVE STRENGTH ────────────────────────────────── */}
      <RelativeStrength data={data} />

      {/* ── SEKCJA 7: EM BASKET ────────────────────────────────────────── */}
      <EmBasket data={data} />

      <Divider label="KONTEKST MAKRO" />

      {/* ── SEKCJA 8: MACRO CONTEXT ────────────────────────────────────── */}
      <MacroContext data={data} />

      <Divider label="MORNING CHECKLIST" />

      {/* ── SEKCJA 9: MORNING CHECKLIST ────────────────────────────────── */}
      <MorningChecklist data={data} />

      {/* ── DUPA ───────────────────────────────────────────────────────── */}
      <RedButt />
    </div>
  );
}
