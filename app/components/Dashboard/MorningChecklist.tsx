"use client";
import type { ModelOutput } from "@/lib/model/types";
import { Tooltip, TT } from "./Tooltip";

export function MorningChecklist({ data }: { data: ModelOutput }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <Tooltip width={320} content={<TT title="Morning Checklist" body="Codzienne pytania które trzeba zadać patrząc na dane. Nie chodzi o odpowiedź tak/nie — chodzi o to czy wszystkie pytania wskazują w tym samym kierunku, czy się ze sobą kłócą. Dyssonans jest informacją." />}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "0.75rem", cursor: "help" }}>
          🧩 Morning Checklist
        </div>
      </Tooltip>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.5rem" }}>
        {data.checklist.map((item, i) => {
          const isWarn = item.includes("poniżej") || item.includes("ucieka") || item.includes("stres") || item.includes("systemowy") || item.includes("nieufności");
          return (
            <div key={i} style={{
              fontSize: "0.72rem", color: "#334155",
              background: isWarn ? "#fff7ed" : "#f8fafc",
              borderRadius: 6, padding: "0.5rem 0.75rem",
              display: "flex", alignItems: "flex-start", gap: "0.5rem",
              border: `1px solid ${isWarn ? "#fdba74" : "#e2e8f0"}`,
            }}>
              <span style={{ color: "#94a3b8", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              {item}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "0.75rem", fontSize: "0.68rem", color: "#94a3b8", fontStyle: "italic" }}>
        Zadaj sobie pytanie: czy te sygnały opowiadają tę samą historię — czy się ze sobą kłócą?
      </div>
    </div>
  );
}
