export interface PersistenceResult {
  score_avg_10d: number;
  acceleration: number;
}

export function computePersistence(scoreHistory: number[]): PersistenceResult {
  const n = scoreHistory.length;
  if (n === 0) return { score_avg_10d: 0, acceleration: 0 };

  const last10 = scoreHistory.slice(-10);
  const score_avg_10d =
    last10.reduce((a, b) => a + b, 0) / last10.length;

  // Acceleration: current score vs avg of 5–10 days ago
  const current = scoreHistory[n - 1];
  const olderWindow = scoreHistory.slice(-10, -5);
  const olderAvg =
    olderWindow.length > 0
      ? olderWindow.reduce((a, b) => a + b, 0) / olderWindow.length
      : current;

  return { score_avg_10d, acceleration: current - olderAvg };
}
