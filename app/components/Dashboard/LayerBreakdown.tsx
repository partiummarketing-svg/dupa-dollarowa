"use client";
import type { ModelOutput } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

function Pip({ active, label, tooltip }: { active: boolean; label: string; tooltip: string }) {
  return (
    <Tooltip content={<span style={{ fontSize: "0.71rem", lineHeight: 1.6 }}>{tooltip}</span>} width={280}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: active ? "#fee2e2" : "#f1f5f9",
        color: active ? "#991b1b" : "#94a3b8",
        borderRadius: 4, padding: "2px 7px", fontSize: "0.62rem", fontWeight: 700,
        letterSpacing: "0.06em", marginRight: 4, marginBottom: 4,
        border: `1px solid ${active ? "#fca5a5" : "#e2e8f0"}`,
        cursor: "help",
      }}>
        <span style={{ fontSize: "0.65rem" }}>{active ? "●" : "○"}</span>
        {label}
      </span>
    </Tooltip>
  );
}

function LayerRow({
  label, total, max, pips, tooltipTitle, tooltipBody,
}: {
  label: string; total: number; max: number;
  pips: React.ReactNode; tooltipTitle: string; tooltipBody: string;
}) {
  const pct = Math.min((total / max) * 100, 100);
  const color = pct >= 70 ? "#ef4444" : pct >= 40 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 60px 120px 1fr", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid #f1f5f9" }}>
      <Tooltip content={<TT title={tooltipTitle} body={tooltipBody} />} width={310}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#334155", letterSpacing: "0.04em", cursor: "help" }}>
          {label}
        </span>
      </Tooltip>

      <span style={{ fontSize: "0.78rem", fontWeight: 800, color }}>
        {total.toFixed(0)}<span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 400 }}>/{max}</span>
      </span>

      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap" }}>{pips}</div>
    </div>
  );
}

export function LayerBreakdown({ data }: { data: ModelOutput }) {
  const { layers, btcRegime } = data;
  const totalScore = data.score;

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <Tooltip width={320} content={<TT title="Skąd pochodzi score?" body="Model składa się z 5 warstw. Każda mierzy inny aspekt zachowania rynku. Suma wszystkich daje Perception Score. Kliknij poszczególne składniki by zobaczyć co dokładnie mierzą." />}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", cursor: "help" }}>
            📊 Skąd pochodzi score?
          </span>
        </Tooltip>
        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
          Łącznie: <strong style={{ color: "#0f172a" }}>{totalScore.toFixed(0)}/19</strong>
        </span>
      </div>

      <LayerRow
        label="TREND (200MA)"
        total={layers.trend.total} max={5}
        tooltipTitle="Warstwa 1 — Trend"
        tooltipBody="Czy aktywa są po właściwej stronie swoich 200-dniowych średnich? Konfiguracja kilku aktywów jednocześnie mówi więcej niż pojedynczy poziom."
        pips={<>
          <Pip active={layers.trend.P1 === 1} label="GLD↑" tooltip="P1: Złoto powyżej 200MA — długoterminowy trend wzrostowy złota = sygnał systemowy." />
          <Pip active={layers.trend.P2 === 1} label={`BTC↑${btcRegime.btcWeight < 1 ? " ½" : ""}`} tooltip={`P2: BTC powyżej 200MA. Reżim: ${btcRegime.regime}. Waga: ${btcRegime.btcWeight}x. W reżimie spekulacyjnym sygnał jest ważony połową.`} />
          <Pip active={layers.trend.P3 === 1} label="USD↓" tooltip="P3: Dolar PONIŻEJ 200MA = słaby USD. Przy jednoczesnym wzroście złota i BTC = sygnał utraty zaufania do dolara." />
          <Pip active={layers.trend.P4 === 1} label="TLT↓" tooltip="P4: Obligacje USA (TLT) poniżej 200MA = rynek sprzedaje dług USA. Szczególnie istotne gdy jednocześnie spada USD." />
          <Pip active={layers.trend.P5 === 1} label="EM↑" tooltip="P5: Dollar Milkshake — siła USD pochodzi głównie z rynków wschodzących (2+ par powyżej MA50). Inny rodzaj stresu niż klasyczny risk-off." />
        </>}
      />

      <LayerRow
        label="RELATIVE STRENGTH"
        total={layers.rs.total} max={4}
        tooltipTitle="Warstwa 2 — Relative Strength"
        tooltipBody="Nie chodzi o poziom ceny — chodzi o to czy aktywo bije S&P 500. Gdy złoto, ropa i BTC systematycznie outperformują akcje, kapitał ucieka z systemu do alternatyw."
        pips={<>
          <Pip active={layers.rs.RS_Gold === 1} label="GLD/SPX" tooltip="RS_Gold: Gold/SPX powyżej swojej 50-dniowej średniej. Złoto systematycznie bije akcje = kapitał szuka schronienia." />
          <Pip active={layers.rs.RS_BTC === 1} label={`BTC/SPX${btcRegime.btcWeight < 1 ? " ½" : ""}`} tooltip={`RS_BTC: BTC/SPX powyżej MA50. W reżimie ${btcRegime.regime} — ${btcRegime.regime === "systemowy" ? "sygnał systemowej nieufności do fiat." : "sygnał risk-on trade, nie systemowy."}`} />
          <Pip active={layers.rs.RS_Oil === 1} label="OIL/SPX" tooltip="RS_Oil: Ropa outperformuje gospodarkę (SPX). Czytelniejszy sygnał petrodolara niż sam poziom ceny ropy — eliminuje przypadek gdy ropa rośnie razem z całą gospodarką." />
          <Pip active={layers.rs.RS_Physical === 1} label="PHYS/GLD" tooltip="RS_Physical: Fizyczne złoto (PHYS) outperformuje papierowe (GLD). Jeden z najrzadszych i najsilniejszych sygnałów — ludzie nie ufają obietnicom dostawy złota przez ETF." />
        </>}
      />

      <LayerRow
        label="KORELACJE"
        total={layers.corr.total} max={7}
        tooltipTitle="Warstwa 3 — Korelacje kroczące"
        tooltipBody="Serce modelu. Mierzy czy klasyczne zależności między aktywami nadal działają. Dwa okna: 20d (krótkie) i 90d (długie). Gdy oba okna zgadzają się — sygnał strukturalny, wart podwójnej wagi."
        pips={<>
          <Pip active={layers.corr.A1 > 0} label={`A1=${layers.corr.A1}`} tooltip={`A1: Oil/USD anomalia. ${layers.corr.A1 === 2 ? "STRUKTURALNE — oba okna (20d+90d) zgodne. Najsilniejszy sygnał." : layers.corr.A1 === 1 ? "Tylko krótkie okno (20d). Obserwuj czy się utrwali." : "Brak anomalii — ropa i USD poruszają się odwrotnie (normalnie)."}`} />
          <Pip active={layers.corr.A2 > 0} label={`A2=${layers.corr.A2}`} tooltip={`A2: Gold/USD anomalia. ${layers.corr.A2 === 2 ? "STRUKTURALNE — oba okna zgodne." : layers.corr.A2 === 1 ? "Tylko krótkie okno. Jeszcze nie strukturalne." : "Normalnie — złoto i USD odwrotnie skorelowane."}`} />
          <Pip active={layers.corr.A3 > 0} label={`A3=${layers.corr.A3}`} tooltip={`A3: Bond/USD anomalia. ${layers.corr.A3 === 2 ? "STRUKTURALNE — obligacje i USD przestają ze sobą korelować w obu oknach." : layers.corr.A3 === 1 ? "Krótkoterminowa anomalia korelacji obligacji z USD." : "Normalnie — safe haven działa."}`} />
          <Pip active={layers.corr.A7 === 1} label="A7 US-DE" tooltip="A7: US-DE Yield Spread powyżej swojej 50-dniowej średniej. Rynek żąda premii za ryzyko od długu USA ponad bezpieczne Niemcy. Bezpośredni sygnał zmiany percepcji długu amerykańskiego." />
        </>}
      />

      <LayerRow
        label="MOMENTUM DZIŚ"
        total={layers.momentum.total} max={3}
        tooltipTitle="Warstwa 4 — Momentum"
        tooltipBody="Czy anomalie dzieją się właśnie teraz? Sygnały z ostatnich 24 godzin potwierdzające lub zaprzeczające obrazowi zbudowanemu przez poprzednie warstwy."
        pips={<>
          <Pip active={layers.momentum.A4 === 1} label="A4 OIL+USD↑" tooltip="A4: Dziś ropa i dolar rosną jednocześnie. Normalnie powinny iść odwrotnie — ropa w dolarach powinna tanieć gdy USD mocnieje. Anomalia dzienna." />
          <Pip active={layers.momentum.A5 === 1} label="A5 GLD+USD↑" tooltip="A5: Dziś złoto i dolar rosną jednocześnie. Klasycznie się wykluczają. Gdy rosną razem — rynek szuka schronienia w obu naraz = głęboki brak zaufania." />
          <Pip active={layers.momentum.A6 === 1} label="A6 TLT+USD↓" tooltip="A6: Dziś i obligacje USA i dolar tracą jednocześnie. Najpoważniejszy dzienny sygnał — obie 'bezpieczne przystanie' sprzedawane naraz = ucieczka kapitału z USA jako systemu." />
        </>}
      />
    </div>
  );
}
