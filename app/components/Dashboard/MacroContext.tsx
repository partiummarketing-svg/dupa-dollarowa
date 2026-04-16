"use client";
import type { ModelOutput } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

const LEVEL_CFG = {
  NORMAL:   { color: "#166534", bg: "#f0fdf4", border: "#86efac", label: "NORMALNY" },
  ELEVATED: { color: "#92400e", bg: "#fffbeb", border: "#fcd34d", label: "PODWYŻSZONY" },
  HIGH:     { color: "#991b1b", bg: "#fff1f2", border: "#fca5a5", label: "WYSOKI" },
};

export function MacroContext({ data }: { data: ModelOutput }) {
  const cb = data.cbGoldDemand;
  const cfg = LEVEL_CFG[cb.level];
  const quarters = cb.quarters.slice(-6);

  const maxTonnes = Math.max(...quarters.map(q => q.tonnes));

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <Tooltip width={340} content={<TT title="Central Bank Gold Demand" body="Kwartalne dane IMF/WGC o zakupach złota przez banki centralne na świecie. Nie wchodzi do dziennego score — służy jako makro-kontekst. Gdy banki centralne kupują rekordowe ilości złota, sygnały modelu mają większy ciężar: instytucje zabezpieczają się przed czymś, co widzą z wyprzedzeniem." />}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", cursor: "help" }}>
            🏛️ Macro Context — Popyt banków centralnych na złoto
          </span>
        </Tooltip>
        <Tooltip width={280} content={<TT title={`Poziom: ${cfg.label}`} body="NORMALNY: zakupy w historycznym zakresie (poniżej 600t/rok). PODWYŻSZONY: powyżej historycznej średniej (600–900t). WYSOKI: rekordowe tempo zakupów (900t+/rok) — tak jak w latach 2022–2024." />}>
          <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 5, cursor: "help" }}>
            {cfg.label} — {cb.trailingYear}t / rok
          </span>
        </Tooltip>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
        {/* Bar chart */}
        <div>
          <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            ZAKUPY NETTO (TONY) — OSTATNIE 6 KWARTAŁÓW
          </div>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-end", height: 60 }}>
            {quarters.map((q) => {
              const barH = Math.max((q.tonnes / maxTonnes) * 52, 4);
              const isLatest = q.quarter === cb.latestQuarter;
              return (
                <Tooltip key={q.quarter} width={220} content={<span style={{ fontSize: "0.71rem" }}><strong>{q.quarter}</strong><br />{q.tonnes} ton netto</span>}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "help" }}>
                    <span style={{ fontSize: "0.58rem", fontWeight: 700, color: isLatest ? cfg.color : "#64748b" }}>
                      {q.tonnes}
                    </span>
                    <div style={{
                      width: 32, height: barH,
                      background: isLatest ? cfg.color : "#94a3b8",
                      borderRadius: "3px 3px 0 0",
                      opacity: isLatest ? 1 : 0.6,
                    }} />
                    <span style={{ fontSize: "0.52rem", color: "#94a3b8", textAlign: "center", lineHeight: 1.2, maxWidth: 36 }}>
                      {q.quarter.replace(" 20", " '")}
                    </span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: "0.75rem 1rem", minWidth: 160 }}>
          <div style={{ fontSize: "0.6rem", color: cfg.color, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>TRAILING 12M</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{cb.trailingYear}<span style={{ fontSize: "0.8rem" }}>t</span></div>
          <div style={{ fontSize: "0.62rem", color: cfg.color, opacity: 0.8, marginTop: 4 }}>
            {cb.level === "HIGH" ? "Rekordowe tempo zakupów" : cb.level === "ELEVATED" ? "Powyżej historycznej normy" : "W historycznym zakresie"}
          </div>
          <div style={{ fontSize: "0.58rem", color: "#94a3b8", marginTop: 6 }}>
            Ostatni kwartał: {cb.latestQuarter}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "0.75rem", fontSize: "0.68rem", color: "#64748b", lineHeight: 1.6, borderTop: "1px solid #f1f5f9", paddingTop: "0.6rem" }}>
        {cb.level === "HIGH"
          ? "⚠ Banki centralne kupują złoto w rekordowym tempie. Wzmacnia sygnały modelu — instytucje zabezpieczają się przed zmianą systemu."
          : cb.level === "ELEVATED"
          ? "Zakupy powyżej historycznej średniej. Dodatkowy kontekst dla sygnałów modelu."
          : "Zakupy w historycznej normie — brak wzmocnienia makro-kontekstowego."}
        <span style={{ color: "#94a3b8" }}> Źródło: {cb.source}. Dane kwartalne.</span>
      </div>
    </div>
  );
}
