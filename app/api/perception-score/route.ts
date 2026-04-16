import { NextResponse } from "next/server";
import { fetchYahooHistorical } from "@/lib/data/fetchHistorical";
import { fetchGermanBund10Y } from "@/lib/data/fetchECB";
import { fetchCbGoldDemand } from "@/lib/data/fetchIMF";
import { computeLayer0 } from "@/lib/model/layer0_btcRegime";
import { computeLayer1 } from "@/lib/model/layer1_trend";
import { computeLayer2 } from "@/lib/model/layer2_rs";
import { computeLayer3 } from "@/lib/model/layer3_correlations";
import { computeLayer4 } from "@/lib/model/layer4_momentum";
import { computeComposite } from "@/lib/model/composite";
import { computePersistence } from "@/lib/model/persistence";
import { calcMA } from "@/lib/model/utils";
import type { AssetSnapshot, EmCurrency, ModelOutput } from "@/lib/model/types";

// ── Symbol map ────────────────────────────────────────────────────────────────
const SYMBOLS = {
  SPX:  "^GSPC",
  BTC:  "BTC-USD",
  DXY:  "DX-Y.NYB",
  NDX:  "^NDX",
  GLD:  "GLD",
  PHYS: "PHYS",
  OIL:  "CL=F",
  TLT:  "TLT",
  TNX:  "^TNX",
  VIX:  "^VIX",
  CNY:  "USDCNY=X",
  BRL:  "USDBRL=X",
  TRY:  "USDTRY=X",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function snapshot(
  closes: number[],
  changePercent: number
): AssetSnapshot {
  const price = closes[closes.length - 1];
  const ma200 = calcMA(closes, 200);
  const ma50  = calcMA(closes, 50);
  return {
    price,
    ma200,
    ma50,
    changePercent,
    pctFromMA200: ma200 !== 0 ? ((price - ma200) / ma200) * 100 : 0,
  };
}

function emCurrency(closes: number[], changePercent: number): EmCurrency {
  const price = closes[closes.length - 1];
  const ma50  = calcMA(closes, 50);
  return { price, ma50, aboveMa: price > ma50, changePercent };
}

// ── EM basket majority signal ──────────────────────────────────────────────
function emMajority(
  cny: EmCurrency,
  brl: EmCurrency,
  tryC: EmCurrency
): boolean {
  return (
    [cny.aboveMa, brl.aboveMa, tryC.aboveMa].filter(Boolean).length >= 2
  );
}

// ── Compute full model at a given data index ──────────────────────────────
interface AllCloses {
  spx: number[]; btc: number[]; dxy: number[]; ndx: number[];
  gld: number[]; phys: number[]; oil: number[]; tlt: number[];
  tnx: number[]; vix: number[]; cny: number[]; brl: number[]; tryC: number[];
  deYield: number[];
}

function runModel(c: AllCloses, upTo?: number) {
  const t = (arr: number[]) =>
    upTo !== undefined ? arr.slice(0, upTo) : arr;

  const cnyEM  = emCurrency(t(c.cny),  pctChange(c.cny));
  const brlEM  = emCurrency(t(c.brl),  pctChange(c.brl));
  const tryEM  = emCurrency(t(c.tryC), pctChange(c.tryC));
  const majority = emMajority(cnyEM, brlEM, tryEM);

  const l0 = computeLayer0(c.btc, c.ndx, c.gld, upTo);
  const l1 = computeLayer1(
    { gold: c.gld, btc: c.btc, dxy: c.dxy, tlt: c.tlt, emMajority: majority },
    l0, upTo
  );
  const l2 = computeLayer2(
    { gold: c.gld, btc: c.btc, oil: c.oil, spx: c.spx, phys: c.phys, gld: c.gld },
    l0, upTo
  );
  const l3 = computeLayer3(
    { oil: c.oil, gold: c.gld, tlt: c.tlt, dxy: c.dxy,
      usTenYear: c.tnx, deTenYear: c.deYield },
    upTo
  );

  const tltArr = t(c.tlt);
  const tltChg = tltArr.length >= 2
    ? (tltArr[tltArr.length - 1] - tltArr[tltArr.length - 2]) /
      tltArr[tltArr.length - 2] * 100
    : 0;
  const gldArr = t(c.gld);
  const gldChg = gldArr.length >= 2
    ? (gldArr[gldArr.length - 1] - gldArr[gldArr.length - 2]) /
      gldArr[gldArr.length - 2] * 100
    : 0;
  const oilArr = t(c.oil);
  const oilChg = oilArr.length >= 2
    ? (oilArr[oilArr.length - 1] - oilArr[oilArr.length - 2]) /
      oilArr[oilArr.length - 2] * 100
    : 0;
  const dxyArr = t(c.dxy);
  const dxyChg = dxyArr.length >= 2
    ? (dxyArr[dxyArr.length - 1] - dxyArr[dxyArr.length - 2]) /
      dxyArr[dxyArr.length - 2] * 100
    : 0;

  const l4 = computeLayer4({ oil: oilChg, gold: gldChg, tlt: tltChg, dxy: dxyChg });
  const comp = computeComposite(l1, l2, l3, l4);

  return { l0, l1, l2, l3, l4, comp };
}

function pctChange(arr: number[]): number {
  if (arr.length < 2) return 0;
  const prev = arr[arr.length - 2];
  return prev !== 0 ? ((arr[arr.length - 1] - prev) / prev) * 100 : 0;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export const revalidate = 900; // 15 min ISR

export async function GET() {
  try {
    // Fetch all assets in parallel
    const [
      spxData, btcData, dxyData, ndxData, gldData,
      physData, oilData, tltData, tnxData, vixData,
      cnyData, brlData, tryData, ecbData, cbGold,
    ] = await Promise.all([
      fetchYahooHistorical(SYMBOLS.SPX),
      fetchYahooHistorical(SYMBOLS.BTC),
      fetchYahooHistorical(SYMBOLS.DXY),
      fetchYahooHistorical(SYMBOLS.NDX),
      fetchYahooHistorical(SYMBOLS.GLD),
      fetchYahooHistorical(SYMBOLS.PHYS),
      fetchYahooHistorical(SYMBOLS.OIL),
      fetchYahooHistorical(SYMBOLS.TLT),
      fetchYahooHistorical(SYMBOLS.TNX),
      fetchYahooHistorical(SYMBOLS.VIX),
      fetchYahooHistorical(SYMBOLS.CNY),
      fetchYahooHistorical(SYMBOLS.BRL),
      fetchYahooHistorical(SYMBOLS.TRY),
      fetchGermanBund10Y(),
      fetchCbGoldDemand(),
    ]);

    // Require core assets
    if (!spxData || !btcData || !dxyData || !gldData || !tltData) {
      return NextResponse.json({ error: "Core data unavailable" }, { status: 503 });
    }

    // Build aligned close arrays (use available data, fallback to gold for missing)
    const c: AllCloses = {
      spx:  spxData.closes,
      btc:  btcData.closes,
      dxy:  dxyData.closes,
      ndx:  ndxData?.closes ?? spxData.closes,
      gld:  gldData.closes,
      phys: physData?.closes ?? gldData.closes,
      oil:  oilData?.closes ?? gldData.closes,
      tlt:  tltData.closes,
      tnx:  tnxData?.closes ?? [],
      vix:  vixData?.closes ?? [],
      cny:  cnyData?.closes ?? [],
      brl:  brlData?.closes ?? [],
      tryC: tryData?.closes ?? [],
      deYield: ecbData.map(p => p.value),
    };

    // ── Current model ────────────────────────────────────────────────────────
    const { l0, l1, l2, l3, l4, comp } = runModel(c);

    // ── Score history (last 30 data points) ─────────────────────────────────
    const minLen = Math.min(c.spx.length, c.btc.length, c.dxy.length, c.tlt.length);
    const histLen = Math.min(30, minLen - 100); // need at least 100 points for MA200
    const scoreHistory: number[] = [];

    for (let offset = histLen; offset >= 1; offset--) {
      const idx = minLen - offset;
      if (idx < 100) continue;
      const { comp: hComp } = runModel(c, idx);
      scoreHistory.push(hComp.score);
    }
    // Add today
    scoreHistory.push(comp.score);

    const { score_avg_10d, acceleration } = computePersistence(scoreHistory);

    // ── Asset snapshots ──────────────────────────────────────────────────────
    const assets = {
      SPX:  snapshot(c.spx,  spxData.changePercent),
      BTC:  snapshot(c.btc,  btcData.changePercent),
      DXY:  snapshot(c.dxy,  dxyData.changePercent),
      TNX:  snapshot(c.tnx.length > 1 ? c.tnx : [0, 0], tnxData?.changePercent ?? 0),
      GLD:  snapshot(c.gld,  gldData.changePercent),
      OIL:  snapshot(c.oil,  oilData?.changePercent ?? 0),
      VIX:  snapshot(c.vix.length > 1 ? c.vix : [0, 0], vixData?.changePercent ?? 0),
      PHYS: snapshot(c.phys, physData?.changePercent ?? 0),
      TLT:  snapshot(c.tlt,  tltData.changePercent),
    };

    // ── EM basket ────────────────────────────────────────────────────────────
    const cnyEM  = emCurrency(c.cny,  cnyData?.changePercent  ?? 0);
    const brlEM  = emCurrency(c.brl,  brlData?.changePercent  ?? 0);
    const tryEM  = emCurrency(c.tryC, tryData?.changePercent  ?? 0);
    const strengthCount = [cnyEM.aboveMa, brlEM.aboveMa, tryEM.aboveMa].filter(Boolean).length;

    const emBasket = {
      cny:  cnyEM,
      brl:  brlEM,
      try_: tryEM,
      strengthCount,
      p5Active: l1.P5 === 1,
      trend: strengthCount >= 2 ? "ROSNĄCY" : strengthCount === 1 ? "MIESZANY" : "MALEJĄCY",
    };

    // ── US-DE Yield Spread ───────────────────────────────────────────────────
    const usYield = c.tnx.length > 0 ? c.tnx[c.tnx.length - 1] : null;
    const deYield = c.deYield.length > 0 ? c.deYield[c.deYield.length - 1] : null;
    const usDeSpread = {
      usYield: usYield ?? 0,
      deYield,
      spread: usYield != null && deYield != null ? usYield - deYield : null,
      ma50: l3.details.usDeSpread.ma50 || null,
      aboveMa: l3.A7 === 1 ? true : l3.details.usDeSpread.value !== 0 ? false : null,
    };

    // ── Morning checklist ────────────────────────────────────────────────────
    const checklist = [
      `SPX ${l1.P1 ? "↑ powyżej 200MA — trend wzrostowy" : "↓ poniżej 200MA — trend spadkowy"}`,
      `BTC w reżimie ${l0.regime} — sygnał ${l0.regime === "systemowy" ? "systemowy (liczy się pełną wagą)" : "spekulacyjny (połowa wagi)"}`,
      `USD ${l1.P3 ? "↓ poniżej 200MA — słaby dolar, sygnał stresu" : "↑ powyżej 200MA — silny dolar"}`,
      `Obligacje ${l1.P4 ? "↓ poniżej 200MA — kapitał ucieka z długu USA" : "↑ powyżej 200MA — safe haven działa"}`,
      `EM Basket ${emBasket.p5Active ? "↑ USD mocny kosztem rynków wschodzących (P5 aktywny)" : "stabilny, brak Dollar Milkshake"}`,
      `Złoto ${l2.RS_Gold ? "outperformuje akcje — RS powyżej MA50" : "underperformuje akcje — brak sygnału RS"}`,
      `Fizyczne złoto ${l2.RS_Physical ? "↑ outperformuje papierowe — sygnał nieufności do systemu" : "bez sygnału systemowej nieufności"}`,
    ];

    const output: ModelOutput = {
      timestamp: new Date().toISOString(),
      score: comp.score,
      state: comp.state,
      score_avg_10d,
      acceleration,
      btcRegime: l0,
      layers: { trend: l1, rs: l2, corr: l3, momentum: l4 },
      assets,
      emBasket,
      usDeSpread,
      scoreHistory,
      cbGoldDemand: cbGold,
      checklist,
    };

    return NextResponse.json(output);
  } catch (err) {
    console.error("[perception-score]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
