import type { Layer4Result } from "./types";

export function computeLayer4(
  changePercent: {
    oil: number;
    gold: number;
    tlt: number;   // bond proxy (falling price = rising yield)
    dxy: number;
  }
): Layer4Result {
  // A4: ropa i dolar rosną razem dziś
  const A4 = changePercent.oil > 0 && changePercent.dxy > 0 ? 1 : 0;
  // A5: złoto i dolar rosną razem dziś
  const A5 = changePercent.gold > 0 && changePercent.dxy > 0 ? 1 : 0;
  // A6: obligacje i dolar spadają razem dziś
  const A6 = changePercent.tlt < 0 && changePercent.dxy < 0 ? 1 : 0;

  return { A4, A5, A6, total: A4 + A5 + A6 };
}
