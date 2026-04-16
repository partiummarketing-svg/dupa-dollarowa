"use client";
import type { ModelOutput } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

const MAX_SCORE = 19;

const STATE_COLOR = (s: number) =>
  s >= 17 ? "#ef4444" : s >= 13 ? "#f97316" : s >= 8 ? "#f59e0b" : "#22c55e";

export function PersistenceChart({ data }: { data: ModelOutput }) {
  const { scoreHistory, score_avg_10d, acceleration } = data;

  if (!scoreHistory || scoreHistory.length === 0) return null;

  const W = 600;
  const H = 120;
  const PAD = { top: 10, right: 16, bottom: 24, left: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const n = scoreHistory.length;
  const toX = (i: number) => PAD.left + (i / (n - 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - (v / MAX_SCORE) * innerH;

  // Polyline for score
  const pts = scoreHistory.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  // 10d moving avg line
  const avg10: number[] = [];
  for (let i = 0; i < scoreHistory.length; i++) {
    const window = scoreHistory.slice(Math.max(0, i - 9), i + 1);
    avg10.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  const avgPts = avg10.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  // Threshold lines
  const thresholds = [
    { v: 7,  label: "7",  color: "#22c55e" },
    { v: 12, label: "12", color: "#f59e0b" },
    { v: 16, label: "16", color: "#f97316" },
  ];

  const accSign = acceleration > 0 ? "+" : "";
  const accColor = acceleration > 1 ? "#ef4444" : acceleration < -1 ? "#22c55e" : "#f59e0b";

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <Tooltip width={320} content={<TT title="Historia Perception Score" body="Każdy punkt to dzienny score (0–19). Biała linia = raw score. Pomarańczowa = 10-dniowa średnia krocząca (wygładza szum). Trend rosnący przez kilka tygodni = zmiana strukturalna, nie przypadkowa." />}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", cursor: "help" }}>
            📈 Historia Score — ostatnie {scoreHistory.length} sesji
          </span>
        </Tooltip>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Tooltip width={300} content={<TT title="Średnia 10-dniowa" body="Wygładza codzienny szum i pokazuje trend. Gdy ta linia jest wyraźnie rosnąca przez kilka tygodni — zmiana jest strukturalna, nie przypadkowa." />}>
            <span style={{ fontSize: "0.7rem", color: "#64748b", cursor: "help" }}>
              Avg10d: <strong style={{ color: STATE_COLOR(score_avg_10d) }}>{score_avg_10d.toFixed(1)}</strong>
            </span>
          </Tooltip>
          <Tooltip width={300} content={<TT title="Acceleration" body="Tempo zmiany: score dziś minus średnia z 5 dni temu. Wysoki score + przyspieszenie = moment przejścia systemu. Wysoki score + hamowanie = zmiana już nastąpiła." />}>
            <span style={{ fontSize: "0.7rem", color: "#64748b", cursor: "help" }}>
              Acc: <strong style={{ color: accColor }}>{accSign}{acceleration.toFixed(1)}</strong>
            </span>
          </Tooltip>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 320, display: "block" }}>
          {/* Threshold zones */}
          <rect x={PAD.left} y={toY(MAX_SCORE)} width={innerW} height={toY(16) - toY(MAX_SCORE)} fill="#fee2e2" opacity={0.4} />
          <rect x={PAD.left} y={toY(16)} width={innerW} height={toY(12) - toY(16)} fill="#fef3c7" opacity={0.4} />
          <rect x={PAD.left} y={toY(12)} width={innerW} height={toY(7) - toY(12)} fill="#fef9c3" opacity={0.3} />

          {/* Threshold lines */}
          {thresholds.map(({ v, label, color }) => (
            <g key={v}>
              <line x1={PAD.left} y1={toY(v)} x2={PAD.left + innerW} y2={toY(v)} stroke={color} strokeDasharray="3,3" strokeWidth={1} opacity={0.6} />
              <text x={PAD.left - 4} y={toY(v) + 4} textAnchor="end" fontSize={9} fill={color} opacity={0.8}>{label}</text>
            </g>
          ))}

          {/* Y axis labels */}
          {[0, MAX_SCORE].map(v => (
            <text key={v} x={PAD.left - 4} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{v}</text>
          ))}

          {/* Score area fill */}
          <polygon
            points={`${toX(0)},${toY(0)} ${pts} ${toX(n - 1)},${toY(0)}`}
            fill={STATE_COLOR(data.score)}
            opacity={0.08}
          />

          {/* Score dots */}
          {scoreHistory.map((v, i) => (
            <circle key={i} cx={toX(i)} cy={toY(v)} r={2.5} fill={STATE_COLOR(v)} opacity={0.8} />
          ))}

          {/* Score line */}
          <polyline points={pts} fill="none" stroke={STATE_COLOR(data.score)} strokeWidth={1.5} strokeLinejoin="round" />

          {/* 10d avg line */}
          <polyline points={avgPts} fill="none" stroke="#f97316" strokeWidth={2} strokeLinejoin="round" strokeDasharray="4,2" />

          {/* X axis */}
          <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#e2e8f0" strokeWidth={1} />
          <text x={PAD.left} y={H - 6} fontSize={9} fill="#94a3b8">-{scoreHistory.length - 1}d</text>
          <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize={9} fill="#94a3b8">dziś</text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 16, height: 2, background: "#94a3b8", borderRadius: 1 }} />
          <span style={{ fontSize: "0.62rem", color: "#64748b" }}>Dzienny score</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 16, height: 2, background: "#f97316", borderRadius: 1, borderTop: "2px dashed #f97316" }} />
          <span style={{ fontSize: "0.62rem", color: "#64748b" }}>Średnia 10d</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: "50%" }} />
          <span style={{ fontSize: "0.62rem", color: "#64748b" }}>0–7 normalny</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 8, height: 8, background: "#f59e0b", borderRadius: "50%" }} />
          <span style={{ fontSize: "0.62rem", color: "#64748b" }}>8–12 pęknięcia</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 8, height: 8, background: "#ef4444", borderRadius: "50%" }} />
          <span style={{ fontSize: "0.62rem", color: "#64748b" }}>13+ stres</span>
        </div>
      </div>
    </div>
  );
}
