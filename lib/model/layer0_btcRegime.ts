import { rollingCorr } from "./utils";
import type { Layer0Result } from "./types";

export function computeLayer0(
  btcCloses: number[],
  ndxCloses: number[],
  goldCloses: number[],
  upTo?: number // optional index slice for historical scoring
): Layer0Result {
  const btc = upTo !== undefined ? btcCloses.slice(0, upTo) : btcCloses;
  const ndx = upTo !== undefined ? ndxCloses.slice(0, upTo) : ndxCloses;
  const gold = upTo !== undefined ? goldCloses.slice(0, upTo) : goldCloses;

  const corrBtcNdx = rollingCorr(btc, ndx, 30);
  const corrBtcGold = rollingCorr(btc, gold, 30);

  const regime = corrBtcGold > corrBtcNdx ? "systemowy" : "spekulacyjny";
  const btcWeight = regime === "systemowy" ? 1.0 : 0.5;

  return { regime, corrBtcNdx, corrBtcGold, btcWeight };
}
