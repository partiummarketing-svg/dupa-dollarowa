export type BtcRegime = "systemowy" | "spekulacyjny";
export type SystemState = "normalny" | "pęknięcia" | "zmiana_percepcji" | "ekstremalny";

export interface Layer0Result {
  regime: BtcRegime;
  corrBtcNdx: number;
  corrBtcGold: number;
  btcWeight: number;
}

export interface Layer1Result {
  P1: number; P2: number; P3: number; P4: number; P5: number;
  total: number;
}

export interface Layer2Result {
  RS_Gold: number;
  RS_BTC: number;
  RS_Oil: number;
  RS_Physical: number;
  total: number;
}

export interface CorrDetail {
  short: number;
  long: number;
}

export interface Layer3Result {
  A1: number;
  A2: number;
  A3: number;
  A7: number;
  total: number;
  details: {
    oilUsd: CorrDetail;
    goldUsd: CorrDetail;
    bondUsd: CorrDetail;
    usDeSpread: { value: number; ma50: number };
  };
}

export interface Layer4Result {
  A4: number;
  A5: number;
  A6: number;
  total: number;
}

export interface AssetSnapshot {
  price: number;
  ma200: number;
  ma50: number;
  changePercent: number;
  pctFromMA200: number;
}

export interface EmCurrency {
  price: number;
  ma50: number;
  aboveMa: boolean;
  changePercent: number;
}

export interface ModelOutput {
  timestamp: string;
  score: number;
  state: SystemState;
  score_avg_10d: number;
  acceleration: number;

  btcRegime: Layer0Result;

  layers: {
    trend: Layer1Result;
    rs: Layer2Result;
    corr: Layer3Result;
    momentum: Layer4Result;
  };

  assets: {
    SPX: AssetSnapshot;
    BTC: AssetSnapshot;
    DXY: AssetSnapshot;
    TNX: AssetSnapshot;
    GLD: AssetSnapshot;
    OIL: AssetSnapshot;
    VIX: AssetSnapshot;
    PHYS: AssetSnapshot;
    TLT: AssetSnapshot;
  };

  emBasket: {
    cny: EmCurrency;
    brl: EmCurrency;
    try_: EmCurrency;
    strengthCount: number;
    p5Active: boolean;
    trend: string;
  };

  usDeSpread: {
    usYield: number;
    deYield: number | null;
    spread: number | null;
    ma50: number | null;
    aboveMa: boolean | null;
  };

  scoreHistory: number[];

  cbGoldDemand: {
    quarters: Array<{ quarter: string; tonnes: number }>;
    latestQuarter: string;
    latestTonnes: number;
    trailingYear: number;
    level: "NORMAL" | "ELEVATED" | "HIGH";
    source: string;
    lastFetched: string;
  };

  checklist: string[];
}
