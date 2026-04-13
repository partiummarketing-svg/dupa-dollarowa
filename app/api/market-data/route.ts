import { NextRequest, NextResponse } from "next/server";

function calcMA(prices: number[], period: number): number {
  if (prices.length < period) return prices.reduce((a, b) => a + b, 0) / prices.length;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

async function fetchYahoo(symbol: string): Promise<{ price: number; ma200: number; change: number } | null> {
  try {
    const encoded = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1y`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart.result[0];
    const closes: number[] = result.indicators.quote[0].close.filter(Boolean);
    const price = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    const ma200 = calcMA(closes, 200);
    const change = ((price - prev) / prev) * 100;
    return { price, ma200, change };
  } catch {
    return null;
  }
}

async function fetchBTC(): Promise<{ price: number; ma200: number; change: number } | null> {
  try {
    const url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200&interval=daily";
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const prices: number[] = data.prices.map((p: [number, number]) => p[1]);
    const price = prices[prices.length - 1];
    const prev = prices[prices.length - 2];
    const ma200 = calcMA(prices, 200);
    const change = ((price - prev) / prev) * 100;
    return { price, ma200, change };
  } catch {
    return null;
  }
}

const YAHOO_SYMBOLS: Record<string, string> = {
  "SPY":  "SPY",    // S&P 500 ETF
  "DX-Y": "DX-Y.NYB", // US Dollar Index
  "TNX":  "^TNX",   // 10Y Treasury Yield
  "GLD":  "GLD",    // Gold ETF
  "USO":  "USO",    // Oil ETF
  "VIX":  "^VIX",   // Volatility Index
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 });

  if (symbol === "BTC") {
    const data = await fetchBTC();
    if (!data) return NextResponse.json({ error: "Failed" }, { status: 500 });
    return NextResponse.json(data);
  }

  const yahooSymbol = YAHOO_SYMBOLS[symbol];
  if (!yahooSymbol) return NextResponse.json({ error: "Unknown symbol" }, { status: 400 });

  const data = await fetchYahoo(yahooSymbol);
  if (!data) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(data);
}
