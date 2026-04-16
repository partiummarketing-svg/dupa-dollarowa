"use client";
import type { ModelOutput } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

interface RSCardProps {
  label: string;
  icons: string;
  active: boolean;
  detail: string;
  tooltipTitle: string;
  tooltipBody: string;
  special?: boolean;
}

function RSCard({ label, icons, active, detail, tooltipTitle, tooltipBody, special }: RSCardProps) {
  return (
    <Tooltip width={300} content={<TT title={tooltipTitle} body={tooltipBody} />}>
      <div style={{
        background: "#fff", border: `1px solid ${active ? (special ? "#fcd34d" : "#86efac") : "#e2e8f0"}`,
        borderRadius: 10, padding: "1rem 1.25rem",
        borderLeft: `4px solid ${active ? (special ? "#f59e0b" : "#22c55e") : "#e2e8f0"}`,
        cursor: "help",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>{label}</div>
            <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 2 }}>{icons}</div>
          </div>
          <span style={{
            background: active ? (special ? "#fef3c7" : "#dcfce7") : "#f1f5f9",
            color: active ? (special ? "#92400e" : "#166534") : "#94a3b8",
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 4,
          }}>
            {active ? (special ? "⚠ AKTYWNY" : "● AKTYWNY") : "○ BRAK"}
          </span>
        </div>
        <div style={{ fontSize: "0.68rem", color: active ? "#334155" : "#94a3b8", lineHeight: 1.5 }}>
          {detail}
        </div>
      </div>
    </Tooltip>
  );
}

export function RelativeStrength({ data }: { data: ModelOutput }) {
  const { layers, btcRegime } = data;
  const { rs } = layers;

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <Tooltip width={320} content={<TT title="Relative Strength" body="Nie chodzi o poziom ceny — chodzi o to czy aktywo bije S&P 500. Gdy złoto, BTC i ropa systematycznie outperformują akcje (RS > MA50), kapitał ucieka z systemu do alternatyw." />}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "0.75rem", cursor: "help" }}>
          ⚖️ Relative Strength vs S&P 500
        </div>
      </Tooltip>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        <RSCard
          label="Złoto / SPX" icons="🪙 vs 📊"
          active={rs.RS_Gold === 1}
          detail={rs.RS_Gold === 1 ? "Gold/SPX > MA50 — złoto systematycznie bije akcje" : "Gold/SPX < MA50 — brak trwałego outperformance"}
          tooltipTitle="RS Złoto vs S&P 500"
          tooltipBody="Gdy złoto systematycznie rośnie szybciej niż akcje — kapitał ucieka do safe haven. Silniejszy sygnał niż sam poziom złota bo eliminuje efekt ogólnego wzrostu rynku."
        />
        <RSCard
          label="BTC / SPX" icons="₿ vs 📊"
          active={rs.RS_BTC === 1}
          detail={`BTC/SPX ${rs.RS_BTC === 1 ? "> MA50" : "< MA50"} | Reżim: ${btcRegime.regime} (waga ${btcRegime.btcWeight}x)`}
          tooltipTitle="RS Bitcoin vs S&P 500"
          tooltipBody={`W reżimie ${btcRegime.regime}: ${btcRegime.regime === "systemowy" ? "BTC bijący akcje = systemowa nieufność do fiat — silny sygnał." : "BTC bijący akcje = risk-on trade spekulacyjny — model waży go połową."}`}
        />
        <RSCard
          label="Ropa / SPX" icons="🛢️ vs 📊"
          active={rs.RS_Oil === 1}
          detail={rs.RS_Oil === 1 ? "Oil/SPX > MA50 — ropa outperformuje gospodarkę" : "Oil/SPX < MA50 — ropa nie wywiera presji inflacyjnej"}
          tooltipTitle="RS Ropa vs S&P 500"
          tooltipBody="Ropa outperformująca gospodarkę (SPX) to sygnał inflacyjny i potencjalny stres petrodolara. Czytelniejszy niż sam poziom ceny ropy — eliminuje przypadek gdy ropa rośnie razem z całą gospodarką."
        />
        <RSCard
          label="PHYS / GLD" icons="🥇 vs 📄"
          active={rs.RS_Physical === 1}
          detail={rs.RS_Physical === 1 ? "Fizyczne złoto outperformuje papierowe — sygnał systemowej nieufności!" : "Brak rozbieżności fizyczne vs papierowe złoto"}
          tooltipTitle="Fizyczne vs Papierowe Złoto"
          tooltipBody="Gdy PHYS (Sprott Physical Gold) systematycznie drożeje względem GLD (SPDR Gold ETF) — inwestorzy wolą mieć złoto w skarbcu niż obietnicę dostawy od ETF. Jeden z najrzadszych i najsilniejszych sygnałów w modelu — nieufność do systemu finansowego jako takiego."
          special
        />
      </div>
    </div>
  );
}
