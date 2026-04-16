export interface EcbPoint {
  date: string;
  value: number;
}

// ECB Statistical Data Warehouse — AAA euro area sovereign 10Y spot rate
// Used as proxy for German Bund 10Y yield
const ECB_URL =
  "https://data-api.ecb.europa.eu/service/data/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y" +
  "?format=csvdata&detail=dataonly";

export async function fetchGermanBund10Y(): Promise<EcbPoint[]> {
  try {
    const startPeriod = new Date(Date.now() - 500 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const res = await fetch(`${ECB_URL}&startPeriod=${startPeriod}`, {
      headers: { Accept: "text/csv" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);

    // Header line: KEY,...,TIME_PERIOD,OBS_VALUE
    // We only care about last two columns
    const result: EcbPoint[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const date = cols[cols.length - 2]?.trim();
      const val = parseFloat(cols[cols.length - 1]);
      if (date && !isNaN(val)) result.push({ date, value: val });
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}
