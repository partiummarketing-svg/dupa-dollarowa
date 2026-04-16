"use client";
import type { ModelOutput, AssetSnapshot } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

type SignalStatus = "risk-on" | "risk-off" | "neutral" | "loading";

const statusColor = (s: SignalStatus) =>
  s === "risk-on" ? "#166534" : s === "risk-off" ? "#991b1b" : s === "neutral" ? "#92400e" : "#6b7280";
const statusBg = (s: SignalStatus) =>
  s === "risk-on" ? "#dcfce7" : s === "risk-off" ? "#fee2e2" : s === "neutral" ? "#fef3c7" : "#f3f4f6";
const statusLabel = (s: SignalStatus) =>
  s === "risk-on" ? "RISK ON" : s === "risk-off" ? "RISK OFF" : s === "neutral" ? "NEUTRALNY" : "—";

interface AssetMeta {
  key: keyof ModelOutput["assets"];
  label: string;
  sublabel: string;
  icon: string;
  question: string;
  tooltipTitle: string;
  tooltipBody: string;
  getStatus: (a: AssetSnapshot, extra?: number) => SignalStatus;
  getInterpretation: (a: AssetSnapshot, extra?: number) => string;
}

const ASSETS: AssetMeta[] = [
  {
    key: "SPX", label: "S&P 500", sublabel: "^GSPC", icon: "📊",
    question: "Czy rynek chce ryzyka?",
    tooltipTitle: "S&P 500",
    tooltipBody: "Reprezentant globalnego apetytu na ryzyko. Powyżej 200MA = trend wzrostowy, rynek wierzy w gospodarkę. Gdy SPX jest w trendzie a inne sygnały są risk-off — mamy dyssonans, który sam w sobie jest informacją.",
    getStatus: (a) => a.price > a.ma200 ? "risk-on" : "risk-off",
    getInterpretation: (a) => a.price > a.ma200 ? "Powyżej 200MA — trend wzrostowy aktywny" : "Poniżej 200MA — trend spadkowy aktywny",
  },
  {
    key: "BTC", label: "Bitcoin", sublabel: "BTC-USD", icon: "₿",
    question: "Czy crypto potwierdza apetyt na ryzyko?",
    tooltipTitle: "Bitcoin",
    tooltipBody: "Aktywo dualne: spekulacyjne lub systemowe, zależnie od reżimu korelacji. Model klasyfikuje reżim BTC w Warstwie 0. W reżimie systemowym wzrost BTC = sygnał nieufności do fiat. W reżimie spekulacyjnym = risk-on trade.",
    getStatus: (a) => a.price > a.ma200 ? "risk-on" : "risk-off",
    getInterpretation: (a) => a.price > a.ma200 ? "Powyżej 200MA — apetyt na ryzyko obecny" : "Poniżej 200MA — apetyt na ryzyko nieobecny",
  },
  {
    key: "DXY", label: "US Dollar", sublabel: "DXY Index", icon: "💵",
    question: "Czy świat chce trzymać dolary?",
    tooltipTitle: "US Dollar Index (DXY)",
    tooltipBody: "Fundament systemu rozliczeń globalnych. Silny dolar w klasycznym systemie = świat potrzebuje USD do transakcji. Ale: silny dolar przy jednoczesnym rosnącym złocie = anomalia. DXY oparty głównie na EUR/JPY — sprawdź też EM basket.",
    getStatus: (a) => a.price > a.ma200 ? "risk-off" : "risk-on",
    getInterpretation: (a) => a.price > a.ma200 ? "Silny USD — stres/ucieczka do gotówki" : "Słaby USD — środowisko wspierające aktywa ryzykowne",
  },
  {
    key: "TNX", label: "10Y Yield", sublabel: "US Treasury", icon: "🏦",
    question: "Czy pieniądz jest drogi?",
    tooltipTitle: "US 10-Year Treasury Yield",
    tooltipBody: "Rentowność 10-letnich obligacji USA. Rosnąca = obligacje tańsze, koszt kapitału wyższy, presja na wszystkie aktywa. Kluczowy sygnał: gdy zarówno yield jak i DXY rosną — risk-off. Gdy yield rośnie a USD spada — możliwy sygnał ucieczki z długu USA.",
    getStatus: (a) => (a.changePercent ?? 0) > 0 ? "risk-off" : "risk-on",
    getInterpretation: (a) => (a.changePercent ?? 0) > 0 ? "Rentowności rosną — presja na rynki" : "Rentowności spadają — ulga dla rynków",
  },
  {
    key: "GLD", label: "Złoto", sublabel: "GLD ETF", icon: "🪙",
    question: "Czy zaufanie do systemu się kruszy?",
    tooltipTitle: "Złoto (GLD ETF)",
    tooltipBody: "Klasyczne zabezpieczenie przed utratą wartości pieniądza i alternatywa systemowa. Złoto rosnące MIMO silnego USD = silny sygnał erozji dolara jako rezerwy. Sprawdź też PHYS/GLD ratio — fizyczne vs papierowe złoto.",
    getStatus: (a) => a.price > a.ma200 ? "risk-off" : "neutral",
    getInterpretation: (a) => a.price > a.ma200 ? "Powyżej 200MA — brak zaufania do systemu" : "Poniżej 200MA — bez sygnału paniki",
  },
  {
    key: "OIL", label: "Ropa WTI", sublabel: "CL=F Futures", icon: "🛢️",
    question: "Czy buduje się stres inflacyjny?",
    tooltipTitle: "Ropa naftowa (WTI)",
    tooltipBody: "Surowiec historycznie rozliczany w dolarach (petrodolar). Ropa rosnąca RAZEM z USD = anomalia i sygnał zmiany systemu. Ropa outperformująca SPX (RS_Oil) = ważniejszy sygnał niż sam poziom ceny.",
    getStatus: (a) => a.price > a.ma200 ? "neutral" : "risk-on",
    getInterpretation: (a) => a.price > a.ma200 ? "Powyżej 200MA — wysokie ceny energii, ryzyko inflacyjne" : "Poniżej 200MA — ceny energii stonowane",
  },
  {
    key: "VIX", label: "Zmienność", sublabel: "VIX Index", icon: "🔥",
    question: "Czy reżim się zmienia?",
    tooltipTitle: "VIX — Indeks zmienności",
    tooltipBody: "Mierzy oczekiwaną zmienność S&P 500. VIX > 25: wysoki strach, reżim może się zmieniać. VIX 15–25: podwyższony, obserwuj. VIX < 15: spokój. Uwaga: VIX może być niski nawet gdy model pokazuje pęknięcia korelacji — to różne wymiary ryzyka.",
    getStatus: (a) => a.price > 25 ? "risk-off" : a.price > 15 ? "neutral" : "risk-on",
    getInterpretation: (a) => a.price > 25 ? "Wysoki strach — reżim może się zmieniać" : a.price > 15 ? "Podwyższony — obserwuj uważnie" : "Niska zmienność — spokojne środowisko",
  },
];

function AssetCard({ meta, snap, regime }: { meta: AssetMeta; snap: AssetSnapshot; regime?: string }) {
  const status = meta.getStatus(snap);
  const interpretation = meta.getInterpretation(snap);
  const sc = statusColor(status);
  const sb = statusBg(status);

  const fmtPrice = (key: string, p: number) => {
    if (key === "BTC") return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    if (key === "TNX" || key === "VIX") return p.toFixed(2);
    return `$${p.toFixed(2)}`;
  };

  return (
    <Tooltip width={300} content={<TT title={meta.tooltipTitle} body={meta.tooltipBody} />}>
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
        padding: "1.1rem 1.25rem", borderTop: `3px solid ${sc}`, cursor: "help",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.65rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1.05rem" }}>{meta.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{meta.label}</div>
              <div style={{ fontSize: "0.6rem", color: "#94a3b8", letterSpacing: "0.08em" }}>{meta.sublabel}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            <span style={{ background: sb, color: sc, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 4 }}>
              {statusLabel(status)}
            </span>
            {meta.key === "BTC" && regime && (
              <span style={{ background: regime === "systemowy" ? "#fef3c7" : "#f0fdf4", color: regime === "systemowy" ? "#92400e" : "#166534", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>
                [{regime.toUpperCase().slice(0, 3)}]
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.6rem" }}>
          <div style={{ background: "#f8fafc", borderRadius: 6, padding: "0.4rem 0.6rem" }}>
            <div style={{ fontSize: "0.52rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em" }}>CENA</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{fmtPrice(meta.key, snap.price)}</div>
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 6, padding: "0.4rem 0.6rem" }}>
            <div style={{ fontSize: "0.52rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em" }}>200 MA</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#64748b" }}>{fmtPrice(meta.key, snap.ma200)}</div>
          </div>
        </div>

        {snap.pctFromMA200 !== 0 && (
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: "0.57rem", color: "#94a3b8", letterSpacing: "0.08em" }}>DIST OD 200MA</span>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: sc }}>
                {snap.pctFromMA200 > 0 ? "+" : ""}{snap.pctFromMA200.toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 3, background: "#f1f5f9", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${Math.min(Math.abs(snap.pctFromMA200) * 2, 100)}%`, background: sc, borderRadius: 2, opacity: 0.7 }} />
            </div>
          </div>
        )}

        <div style={{ fontSize: "0.68rem", color: "#475569", borderTop: "1px solid #f1f5f9", paddingTop: "0.5rem", lineHeight: 1.5 }}>
          {interpretation}
        </div>
        <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontStyle: "italic", marginTop: "0.25rem" }}>
          {meta.question}
        </div>
      </div>
    </Tooltip>
  );
}

export function AssetGrid({ data }: { data: ModelOutput }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <Tooltip width={320} content={<TT title="Aktywa rynkowe" body="7 kluczowych aktywów — każde mierzone względem 200-dniowej średniej. Ważne jest nie tyle samo przekroczenie, co konfiguracja kilku aktywów jednocześnie. Patrz na całość, nie pojedyncze sygnały." />}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "0.75rem", cursor: "help" }}>
          📈 Aktywa rynkowe
        </div>
      </Tooltip>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
        {ASSETS.map((meta) => (
          <AssetCard
            key={meta.key}
            meta={meta}
            snap={data.assets[meta.key]}
            regime={meta.key === "BTC" ? data.btcRegime.regime : undefined}
          />
        ))}
      </div>
    </div>
  );
}
