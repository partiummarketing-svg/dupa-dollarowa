import { rollingCorr, calcMA } from "./utils";
import type { Layer3Result } from "./types";

export function computeLayer3(
  closes: {
    oil: number[];
    gold: number[];
    tlt: number[];
    dxy: number[];
    usTenYear: number[];   // US 10Y yield series
    deTenYear: number[];   // German Bund 10Y yield series (may be empty)
  },
  upTo?: number
): Layer3Result {
  function tail(arr: number[]) {
    return upTo !== undefined ? arr.slice(0, upTo) : arr;
  }

  const oil  = tail(closes.oil);
  const gold = tail(closes.gold);
  const tlt  = tail(closes.tlt);
  const dxy  = tail(closes.dxy);

  const oilUsdShort  = rollingCorr(oil, dxy, 20);
  const oilUsdLong   = rollingCorr(oil, dxy, 90);
  const goldUsdShort = rollingCorr(gold, dxy, 20);
  const goldUsdLong  = rollingCorr(gold, dxy, 90);
  const bondUsdShort = rollingCorr(tlt, dxy, 20);
  const bondUsdLong  = rollingCorr(tlt, dxy, 90);

  // Anomaly: oil/gold and USD moving SAME direction (positive corr = anomaly)
  const A1 = oilUsdShort > 0 && oilUsdLong > 0 ? 2 : oilUsdShort > 0 ? 1 : 0;
  const A2 = goldUsdShort > 0 && goldUsdLong > 0 ? 2 : goldUsdShort > 0 ? 1 : 0;
  // Anomaly: bonds AND USD falling together (negative corr between TLT and DXY
  // means they move opposite — anomaly is both falling = SAME direction = positive corr)
  // Wait: both falling = same direction = positive corr between tlt and dxy daily returns
  // But spec says A3 = 1 if ρ_Bond,USD < 0
  // Negative corr means they move opposite (one up, one down).
  // If bonds fall and USD falls = same direction = positive corr.
  // Spec: "obligacje i dolar spadają razem" = anomaly, ρ_Bond,USD < 0?
  // Let's re-read: A3 = 1 jeśli ρ_short_Bond,USD < 0
  // ρ < 0 means they move opposite: one up, one down.
  // But "Bond i USD falling together" would be ρ > 0 (moving same direction).
  // I think the spec means: the anomaly is ρ < 0 because normally in risk-off,
  // bonds up and USD up (positive corr). Negative = bonds down when USD up = capital flight from US.
  const A3 = bondUsdShort < 0 && bondUsdLong < 0 ? 2 : bondUsdShort < 0 ? 1 : 0;

  // US-DE Yield Spread (A7)
  let A7 = 0;
  let spreadValue = 0;
  let spreadMa50 = 0;

  const usYld = upTo !== undefined ? closes.usTenYear.slice(0, upTo) : closes.usTenYear;
  const deYld = upTo !== undefined ? closes.deTenYear.slice(0, upTo) : closes.deTenYear;

  if (usYld.length > 0 && deYld.length > 0) {
    const n = Math.min(usYld.length, deYld.length);
    const spreads = Array.from({ length: n }, (_, i) =>
      usYld[usYld.length - n + i] - deYld[deYld.length - n + i]
    );
    spreadValue = spreads[spreads.length - 1];
    spreadMa50 = calcMA(spreads, Math.min(50, spreads.length));
    A7 = spreadValue > spreadMa50 ? 1 : 0;
  }

  return {
    A1, A2, A3, A7,
    total: A1 + A2 + A3 + A7,
    details: {
      oilUsd:  { short: oilUsdShort,  long: oilUsdLong  },
      goldUsd: { short: goldUsdShort, long: goldUsdLong  },
      bondUsd: { short: bondUsdShort, long: bondUsdLong  },
      usDeSpread: { value: spreadValue, ma50: spreadMa50 },
    },
  };
}
