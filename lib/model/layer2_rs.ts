import { calcMA, rsRatio } from "./utils";
import type { Layer0Result, Layer2Result } from "./types";

function rsSignal(a: number[], b: number[], upTo?: number): 0 | 1 {
  const aS = upTo !== undefined ? a.slice(0, upTo) : a;
  const bS = upTo !== undefined ? b.slice(0, upTo) : b;
  const ratio = rsRatio(aS, bS);
  if (ratio.length < 2) return 0;
  const ma50 = calcMA(ratio, 50);
  return ratio[ratio.length - 1] > ma50 ? 1 : 0;
}

export function computeLayer2(
  closes: {
    gold: number[];
    btc: number[];
    oil: number[];
    spx: number[];
    phys: number[];
    gld: number[];
  },
  btcRegime: Layer0Result,
  upTo?: number
): Layer2Result {
  const RS_Gold     = rsSignal(closes.gold, closes.spx, upTo);
  const RS_BTC_raw  = rsSignal(closes.btc,  closes.spx, upTo);
  const RS_Oil      = rsSignal(closes.oil,  closes.spx, upTo);
  const RS_Physical = rsSignal(closes.phys, closes.gld, upTo);

  // Weight BTC by regime
  const RS_BTC = Math.round(RS_BTC_raw * btcRegime.btcWeight) as 0 | 1;

  return {
    RS_Gold,
    RS_BTC,
    RS_Oil,
    RS_Physical,
    total: RS_Gold + RS_BTC + RS_Oil + RS_Physical,
  };
}
