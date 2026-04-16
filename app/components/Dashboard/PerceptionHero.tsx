"use client";
import type { ModelOutput } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

const STATE_CFG = {
  normalny: {
    label: "NORMALNY SYSTEM",
    desc: "Korelacje działają zgodnie z logiką — rynek wierzy w dotychczasowe zasady.",
    color: "#166534", bg: "#f0fdf4", border: "#86efac", bar: "#22c55e",
  },
  "pęknięcia": {
    label: "FAZA PĘKNIĘĆ",
    desc: "Kilka klasycznych zależności zaczyna się psuć — moment największej przewagi informacyjnej.",
    color: "#92400e", bg: "#fffbeb", border: "#fcd34d", bar: "#f59e0b",
  },
  zmiana_percepcji: {
    label: "ZMIANA PERCEPCJI",
    desc: "Wiele zależności psuje się jednocześnie — rynek przestaje wierzyć w dotychczasowe zasady.",
    color: "#9a3412", bg: "#fff7ed", border: "#fdba74", bar: "#f97316",
  },
  ekstremalny: {
    label: "EKSTREMALNY STRES",
    desc: "Prawie wszystkie sygnały pokazują systemową nieufność — historycznie rzadki poziom.",
    color: "#991b1b", bg: "#fff1f2", border: "#fca5a5", bar: "#ef4444",
  },
};

const MAX_SCORE = 19;

export function PerceptionHero({ data }: { data: ModelOutput }) {
  const cfg = STATE_CFG[data.state];
  const pct = Math.min((data.score / MAX_SCORE) * 100, 100);

  const regimeBg = data.btcRegime.regime === "systemowy" ? "#fef3c7" : "#f0fdf4";
  const regimeColor = data.btcRegime.regime === "systemowy" ? "#92400e" : "#166534";

  const accSign = data.acceleration > 0 ? "+" : "";
  const accColor = data.acceleration > 1 ? "#ef4444" : data.acceleration < -1 ? "#22c55e" : "#f59e0b";

  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: "1.5rem 2rem", marginBottom: "1.25rem" }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <Tooltip width={320} content={<TT title="Stan systemu" body="Klasyfikacja oparta na Perception Score. Normalny: 0–7. Pęknięcia: 8–12. Zmiana percepcji: 13–16. Ekstremalny: 17–19. Zmiany systemowe zawsze zaczynają się w korelacjach — zanim pojawią się w danych makro i nagłówkach." />}>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: cfg.color, letterSpacing: "0.04em" }}>
              {cfg.label}
            </div>
          </Tooltip>
          <div style={{ fontSize: "0.78rem", color: cfg.color, opacity: 0.8, marginTop: "0.25rem", maxWidth: 480 }}>
            {cfg.desc}
          </div>
        </div>

        <Tooltip width={300} content={<TT title="Perception Score" body="Suma sygnałów z 5 warstw modelu. Mierzy ile klasycznych zależności finansowych psuje się jednocześnie. Maksimum 19. Zero = wszystko normalne." />}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "3rem", fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
              {data.score.toFixed(0)}
            </span>
            <span style={{ fontSize: "1.1rem", color: cfg.color, opacity: 0.5 }}> / {MAX_SCORE}</span>
          </div>
        </Tooltip>
      </div>

      {/* Score bar */}
      <Tooltip width={280} content={<TT title="Skala 0–19" body="Zielony: system stabilny (0–7). Żółty: pęknięcia (8–12). Pomarańczowy: zmiana percepcji (13–16). Czerwony: ekstremalny stres (17–19)." />}>
        <div style={{ height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 4, marginBottom: "1.25rem", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: cfg.bar, borderRadius: 4, transition: "width 0.6s ease" }} />
        </div>
      </Tooltip>

      {/* Metric row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        {/* 10d avg */}
        <Tooltip width={300} content={<TT title="Średnia 10-dniowa" body="Wygładza codzienny szum. Pojedynczy wysoki score może być przypadkowy — wysoka 10d avg oznacza utrzymujący się stres. Dwa tygodnie to wystarczający czas by odróżnić trend od przypadku." />}>
          <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "0.75rem 1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: cfg.color }}>
              {data.score_avg_10d.toFixed(1)}
            </div>
            <div style={{ fontSize: "0.55rem", color: "#64748b", letterSpacing: "0.1em", fontWeight: 700, marginTop: 2 }}>10d ŚREDNIA</div>
          </div>
        </Tooltip>

        {/* Acceleration */}
        <Tooltip width={300} content={<TT title="Acceleration" body="Tempo zmiany score: score dziś minus średnia z 5 dni temu. Wysoki score + przyspieszenie = moment przejścia systemu. Wysoki score + hamowanie = zmiana już nastąpiła." />}>
          <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "0.75rem 1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: accColor }}>
              {accSign}{data.acceleration.toFixed(1)}
            </div>
            <div style={{ fontSize: "0.55rem", color: "#64748b", letterSpacing: "0.1em", fontWeight: 700, marginTop: 2 }}>ACCELERATION</div>
          </div>
        </Tooltip>

        {/* BTC Regime */}
        <Tooltip width={320} content={<TT title="Reżim Bitcoina" body={`ρ ze złotem: ${data.btcRegime.corrBtcGold.toFixed(2)} | ρ z Nasdaq: ${data.btcRegime.corrBtcNdx.toFixed(2)}. Gdy BTC koreluje bardziej ze złotem niż z NDX — działa jako sygnał systemowy, nie spekulacyjny. Model waży BTC ${data.btcRegime.btcWeight === 1 ? "pełną wagą (1.0)" : "połową wagi (0.5)"}.`} />}>
          <div style={{ background: regimeBg, borderRadius: 8, padding: "0.75rem 1rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: regimeColor, letterSpacing: "0.05em" }}>
              {data.btcRegime.regime.toUpperCase()}
            </div>
            <div style={{ fontSize: "0.6rem", color: regimeColor, opacity: 0.8, marginTop: 2 }}>
              ρ_GOLD={data.btcRegime.corrBtcGold.toFixed(2)} | ρ_NDX={data.btcRegime.corrBtcNdx.toFixed(2)}
            </div>
            <div style={{ fontSize: "0.55rem", color: "#64748b", letterSpacing: "0.1em", fontWeight: 700, marginTop: 4 }}>REŻIM BTC</div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
