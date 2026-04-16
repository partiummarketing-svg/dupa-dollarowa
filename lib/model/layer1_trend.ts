import { calcMA } from "./utils";
import type { Layer0Result, Layer1Result } from "./types";

export function computeLayer1(
  closes: {
    gold: number[];
    btc: number[];
    dxy: number[];
    tlt: number[];
    emMajority: boolean; // 2+/3 EM pairs above their MA50
  },
  btcRegime: Layer0Result,
  upTo?: number
): Layer1Result {
  function tail(arr: number[]) {
    return upTo !== undefined ? arr.slice(0, upTo) : arr;
  }

  const gold = tail(closes.gold);
  const btc  = tail(closes.btc);
  const dxy  = tail(closes.dxy);
  const tlt  = tail(closes.tlt);

  const goldLast = gold[gold.length - 1];
  const btcLast  = btc[btc.length - 1];
  const dxyLast  = dxy[dxy.length - 1];
  const tltLast  = tlt[tlt.length - 1];

  const P1 = goldLast > calcMA(gold, 200) ? 1 : 0;

  const btcAbove = btcLast > calcMA(btc, 200) ? 1 : 0;
  // In speculative regime BTC contributes 0.5 weight → round to nearest integer
  const P2 = Math.round(btcAbove * btcRegime.btcWeight);

  const P3 = dxyLast < calcMA(dxy, 200) ? 1 : 0;  // USD below trend = stress
  const P4 = tltLast < calcMA(tlt, 200) ? 1 : 0;  // bonds below trend
  const P5 = closes.emMajority ? 1 : 0;

  return { P1, P2, P3, P4, P5, total: P1 + P2 + P3 + P4 + P5 };
}
