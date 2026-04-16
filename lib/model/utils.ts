export function calcMA(arr: number[], period: number): number {
  if (arr.length === 0) return 0;
  const slice = arr.slice(-Math.min(period, arr.length));
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function pearsonCorr(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const xs = x.slice(-n);
  const ys = y.slice(-n);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx2 += a * a;
    dy2 += b * b;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

// Rolling Pearson correlation on % returns over last `window` points
export function rollingCorr(a: number[], b: number[], window: number): number {
  const ra = pctReturns(a);
  const rb = pctReturns(b);
  const w = Math.min(window, ra.length, rb.length);
  if (w < 3) return 0;
  return pearsonCorr(ra.slice(-w), rb.slice(-w));
}

export function pctReturns(arr: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < arr.length; i++) {
    out.push(arr[i - 1] !== 0 ? (arr[i] - arr[i - 1]) / arr[i - 1] : 0);
  }
  return out;
}

export function rsRatio(a: number[], b: number[]): number[] {
  const n = Math.min(a.length, b.length);
  return Array.from({ length: n }, (_, i) =>
    b[b.length - n + i] !== 0 ? a[a.length - n + i] / b[b.length - n + i] : 0
  );
}
