"use client";
import type { ModelOutput } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

function CorrCard({
  title, icons, short, long, score, maxScore,
  normalDesc, anomalyDesc,
}: {
  title: string; icons: string;
  short: number; long: number;
  score: number; maxScore: number;
  normalDesc: string; anomalyDesc: string;
}) {
  const isStructural = score === maxScore && score >= 2;
  const isShortOnly  = score === 1;
  const isNormal     = score === 0;

  const borderColor = isStructural ? "#ef4444" : isShortOnly ? "#f59e0b" : "#22c55e";
  const badgeBg     = isStructural ? "#fee2e2" : isShortOnly ? "#fef3c7" : "#dcfce7";
  const badgeColor  = isStructural ? "#991b1b" : isShortOnly ? "#92400e" : "#166534";
  const badgeText   = isStructural ? "⚠ STRUKTURALNE" : isShortOnly ? "⚠ SHORT ANOMALIA" : "✓ NORMALNIE";

  const fmtCorr = (v: number) => (v > 0 ? "+" : "") + v.toFixed(2);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1rem 1.25rem", borderLeft: `4px solid ${borderColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>{title}</div>
          <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 2 }}>{icons}</div>
        </div>
        <span style={{ background: badgeBg, color: badgeColor, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 4 }}>
          {badgeText}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.6rem" }}>
        <Tooltip width={260} content={<TT title="Korelacja krótka (20d)" body="Pearson na 20-dniowych stopach zwrotu. Dla par Oil/USD i Gold/USD: wartość pozytywna = anomalia (normalnie odwrotna korelacja). Dla Bond/USD: wartość negatywna = anomalia." />}>
          <div style={{ background: "#f8fafc", borderRadius: 6, padding: "0.4rem 0.6rem", cursor: "help" }}>
            <div style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em" }}>SHORT (20d)</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: Math.abs(short) > 0.3 ? badgeColor : "#334155" }}>{fmtCorr(short)}</div>
          </div>
        </Tooltip>
        <Tooltip width={260} content={<TT title="Korelacja długa (90d)" body="Pearson na 90-dniowych stopach zwrotu. Gdy oba okna (20d i 90d) pokazują anomalię jednocześnie — sygnał jest STRUKTURALNY i wart podwójnej wagi. Zmiana strukturalna trwa, nie jest chwilowa." />}>
          <div style={{ background: "#f8fafc", borderRadius: 6, padding: "0.4rem 0.6rem", cursor: "help" }}>
            <div style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em" }}>LONG (90d)</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: Math.abs(long) > 0.3 ? badgeColor : "#334155" }}>{fmtCorr(long)}</div>
          </div>
        </Tooltip>
      </div>

      <div style={{ fontSize: "0.68rem", color: isNormal ? "#64748b" : badgeColor, fontStyle: isNormal ? "italic" : "normal", lineHeight: 1.5 }}>
        {isNormal ? `Norma: ${normalDesc}` : `⚠ ${isStructural ? "[STRUKTURALNE] " : ""}${anomalyDesc}`}
      </div>
    </div>
  );
}

export function CorrelationAnomalies({ data }: { data: ModelOutput }) {
  const { layers, usDeSpread } = data;
  const { corr } = layers;

  const spreadVal = usDeSpread.spread;
  const spreadMa  = usDeSpread.ma50;

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <Tooltip width={340} content={<TT title="Anomalie korelacji" body="Serce modelu. System mierzy czy klasyczne zależności między aktywami nadal działają. Dwa okna: krótkie (20d) łapie momentum, długie (90d) łapie zmiany strukturalne. Gdy oba okna są zgodne — waga sygnału jest podwójna." />}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "0.75rem", cursor: "help" }}>
          🔗 Anomalie korelacji
        </div>
      </Tooltip>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <CorrCard
          title="Ropa vs USD" icons="🛢️ vs 💵"
          short={corr.details.oilUsd.short} long={corr.details.oilUsd.long}
          score={corr.A1} maxScore={2}
          normalDesc="ropa ↑ → USD ↓ (odwrotna korelacja)"
          anomalyDesc="ropa i USD rosną razem → możliwy sygnał zmiany systemu petrodolara"
        />
        <CorrCard
          title="Złoto vs USD" icons="🪙 vs 💵"
          short={corr.details.goldUsd.short} long={corr.details.goldUsd.long}
          score={corr.A2} maxScore={2}
          normalDesc="złoto ↑ → USD ↓ (odwrotna korelacja)"
          anomalyDesc="złoto i USD rosną razem → ucieczka od dolara jako rezerwy"
        />
        <CorrCard
          title="Obligacje vs USD" icons="🏦 vs 💵"
          short={corr.details.bondUsd.short} long={corr.details.bondUsd.long}
          score={corr.A3} maxScore={2}
          normalDesc="risk-off → obligacje i USD jako safe haven"
          anomalyDesc="obligacje i USD tracą razem → kapitał ucieka z USA jako systemu"
        />
      </div>

      {/* US-DE Yield Spread */}
      <Tooltip width={340} content={<TT title="US-DE Yield Spread" body="Różnica rentowności obligacji USA i Niemiec. Gdy USA musi płacić coraz więcej ponad bezpieczne Niemcy — rynek żąda premii za ryzyko od długu amerykańskiego. Historycznie USA było 'bezpieczniejsze' niż Niemcy — zmiana tej relacji to zmiana fundamentalnego założenia systemu." />}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1rem 1.5rem", cursor: "help" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a", marginBottom: 2 }}>
                📊 US-DE Yield Spread (A7)
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                {spreadVal != null && spreadMa != null
                  ? `Spread: ${spreadVal.toFixed(2)}% | MA50: ${spreadMa.toFixed(2)}% | ${corr.A7 === 1 ? "⚠ POWYŻEJ ŚREDNIEJ — rynek żąda premii za ryzyko od USA" : "✓ W normie"}`
                  : usDeSpread.deYield == null
                  ? "Dane ECB niedostępne — spread nie obliczony"
                  : `US: ${usDeSpread.usYield.toFixed(2)}% | DE: ${usDeSpread.deYield?.toFixed(2) ?? "—"}%`}
              </div>
            </div>
            <span style={{
              background: corr.A7 === 1 ? "#fee2e2" : "#dcfce7",
              color: corr.A7 === 1 ? "#991b1b" : "#166534",
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em",
              padding: "3px 10px", borderRadius: 4,
            }}>
              {corr.A7 === 1 ? "⚠ AKTYWNY" : "✓ NORMALNIE"}
            </span>
          </div>

          {spreadVal != null && spreadMa != null && (
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, position: "relative", overflow: "visible" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min((spreadVal / 4) * 100, 100)}%`,
                  background: corr.A7 === 1 ? "#ef4444" : "#22c55e",
                  borderRadius: 3,
                }} />
                {/* MA50 marker */}
                <div style={{
                  position: "absolute", top: -3, bottom: -3,
                  left: `${Math.min((spreadMa / 4) * 100, 100)}%`,
                  width: 2, background: "#94a3b8", borderRadius: 1,
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>0%</span>
                <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>MA50: {spreadMa.toFixed(2)}%</span>
                <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>4%</span>
              </div>
            </div>
          )}
        </div>
      </Tooltip>
    </div>
  );
}
