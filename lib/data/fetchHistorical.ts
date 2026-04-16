import { calcMA } from "../model/utils";

export interface HistoricalSeries {
  closes: number[];
  dates: string[];
  latest: number;
  prev: number;
  changePercent: number;
  ma200: number;
  ma50: number;
}

export async function fetchYahooHistorical(
  symbol: string,
  revalidate = 900
): Promise<HistoricalSeries | null> {
  try {
    const encoded = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=2y`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    const rawTs: number[] = result.timestamp ?? [];

    const closes: number[] = [];
    const dates: string[] = [];

    for (let i = 0; i < rawCloses.length; i++) {
      const c = rawCloses[i];
      if (c != null && isFinite(c)) {
        closes.push(c);
        dates.push(new Date(rawTs[i] * 1000).toISOString().slice(0, 10));
      }
    }

    if (closes.length < 2) return null;

    const latest = closes[closes.length - 1];
    const prev = closes[closes.length - 2];

    return {
      closes,
      dates,
      latest,
      prev,
      changePercent: prev !== 0 ? ((latest - prev) / prev) * 100 : 0,
      ma200: calcMA(closes, 200),
      ma50: calcMA(closes, 50),
    };
  } catch {
    return null;
  }
}
