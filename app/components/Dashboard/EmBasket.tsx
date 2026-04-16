"use client";
import type { ModelOutput } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

interface CurrencyRowProps {
  label: string;
  flag: string;
  price: number;
  ma50: number;
  aboveMa: boolean;
  change: number;
  tooltipBody: string;
}

function CurrencyRow({ label, flag, price, ma50, aboveMa, change, tooltipBody }: CurrencyRowProps) {
  const changeStr = (change > 0 ? "+" : "") + change.toFixed(2) + "%";
  const dir = change > 0 ? "↑" : "↓";
  return (
    <Tooltip width={280} content={<TT title={`USD/${label}`} body={tooltipBody} />}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.5rem 0.75rem", background: aboveMa ? "#fff7ed" : "#f8fafc",
        borderRadius: 7, cursor: "help",
        border: `1px solid ${aboveMa ? "#fdba74" : "#e2e8f0"}`,
      }}>
        <span style={{ fontSize: "1.1rem" }}>{flag}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0f172a" }}>USD/{label}</div>
          <div style={{ fontSize: "0.62rem", color: "#64748b" }}>MA50: {ma50.toFixed(4)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>{price.toFixed(4)}</div>
          <div style={{ fontSize: "0.62rem", color: change > 0 ? "#991b1b" : "#166534", fontWeight: 600 }}>
            {dir} {changeStr}
          </div>
        </div>
        <span style={{
          fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.08em",
          background: aboveMa ? "#fef3c7" : "#dcfce7",
          color: aboveMa ? "#92400e" : "#166534",
          padding: "2px 7px", borderRadius: 3,
        }}>
          {aboveMa ? "USD↑" : "USD↓"}
        </span>
      </div>
    </Tooltip>
  );
}

export function EmBasket({ data }: { data: ModelOutput }) {
  const { emBasket, layers } = data;
  const p5Active = layers.trend.P5 === 1;

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <Tooltip width={340} content={<TT title="EM FX Basket" body="Koszyk walut rynków wschodzących: USD/CNY, USD/BRL, USD/TRY. Mierzy siłę dolara wobec EM. DXY oparty głównie na EUR/JPY — gdy dolar mocnieje tylko wobec EM, to inny sygnał (Dollar Milkshake) niż ogólna siła USD." />}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "0.75rem", cursor: "help" }}>
          🌍 EM FX Basket
        </div>
      </Tooltip>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {/* Currency pairs */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1rem 1.25rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.72rem", color: "#475569", marginBottom: "0.6rem", letterSpacing: "0.05em" }}>
            SKŁADNIKI KOSZYKA
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <CurrencyRow
              label="CNY" flag="🇨🇳"
              price={emBasket.cny.price} ma50={emBasket.cny.ma50}
              aboveMa={emBasket.cny.aboveMa} change={emBasket.cny.changePercent}
              tooltipBody="Kurs USD do chińskiego juana. CNY jest częściowo kontrolowany przez PBOC. Gwałtowne osłabienie juana może być celowe (wsparcie eksportu) lub wymuszone odpływem kapitału."
            />
            <CurrencyRow
              label="BRL" flag="🇧🇷"
              price={emBasket.brl.price} ma50={emBasket.brl.ma50}
              aboveMa={emBasket.brl.aboveMa} change={emBasket.brl.changePercent}
              tooltipBody="Kurs USD do brazylijskiego reala. BRL jest jedną z najbardziej zmiennych walut EM — silny sygnał globalnego risk-off gdy gwałtownie słabnie."
            />
            <CurrencyRow
              label="TRY" flag="🇹🇷"
              price={emBasket.try_.price} ma50={emBasket.try_.ma50}
              aboveMa={emBasket.try_.aboveMa} change={emBasket.try_.changePercent}
              tooltipBody="Kurs USD do tureckiej liry. TRY systematycznie słabnie ze względu na strukturalne problemy gospodarcze Turcji. Używany jako składnik koszyka, nie jako izolowany sygnał."
            />
          </div>
        </div>

        {/* Basket signal */}
        <Tooltip width={300} content={<TT title="Dollar Milkshake" body="Teoria Dollar Milkshake (Brent Johnson): Fed zaciskając politykę 'wciąga' kapitał z całego świata do USA jak przez słomkę. Objawia się silnym dolarem przy jednoczesnym stresie na rynkach wschodzących. Paradoks: dolar silny = świat w kryzysie, nie USA w dobrej formie." />}>
          <div style={{
            background: p5Active ? "#fff7ed" : "#f0fdf4",
            border: `1px solid ${p5Active ? "#fdba74" : "#86efac"}`,
            borderRadius: 10, padding: "1.25rem",
            display: "flex", flexDirection: "column", justifyContent: "center",
            cursor: "help",
          }}>
            <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: "0.5rem" }}>
              {p5Active ? "🌪️" : "🌊"}
            </div>
            <div style={{ textAlign: "center", fontWeight: 800, fontSize: "0.85rem", color: p5Active ? "#92400e" : "#166534", letterSpacing: "0.04em" }}>
              {p5Active ? "DOLLAR MILKSHAKE" : "BEZ SYGNAŁU"}
            </div>
            <div style={{ textAlign: "center", fontSize: "0.68rem", color: p5Active ? "#92400e" : "#166534", opacity: 0.8, marginTop: 4, lineHeight: 1.5 }}>
              {p5Active
                ? `USD mocny kosztem EM (${emBasket.strengthCount}/3 par powyżej MA50). P5 aktywny w modelu.`
                : `Tylko ${emBasket.strengthCount}/3 par EM powyżej MA50. Brak Dollar Milkshake.`}
            </div>
            <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              {["CNY", "BRL", "TRY"].map((label, i) => {
                const above = [emBasket.cny.aboveMa, emBasket.brl.aboveMa, emBasket.try_.aboveMa][i];
                return (
                  <span key={label} style={{
                    fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                    background: above ? "#fef3c7" : "#f1f5f9",
                    color: above ? "#92400e" : "#94a3b8",
                  }}>
                    {label} {above ? "↑" : "↓"}
                  </span>
                );
              })}
            </div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
