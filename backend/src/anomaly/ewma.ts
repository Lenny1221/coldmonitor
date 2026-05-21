/**
 * Exponentieel gewogen voortschrijdend gemiddelde (EWMA).
 * Oude metingen vervagen geleidelijk — baseline volgt seizoen/gebruik.
 */

export function ewmaUpdate(prev: number | null, value: number, alpha: number): number {
  if (prev == null || Number.isNaN(prev)) return value;
  return alpha * value + (1 - alpha) * prev;
}

/** Bijwerken van E[X] en E[X²] voor online std-deviatie. */
export function ewmaMomentsUpdate(
  mean: number | null,
  meanSq: number | null,
  value: number,
  alpha: number
): { mean: number; meanSq: number } {
  const m = ewmaUpdate(mean, value, alpha);
  const ms = ewmaUpdate(meanSq, value * value, alpha);
  return { mean: m, meanSq: ms };
}

export function stdFromMoments(mean: number, meanSq: number): number {
  const variance = Math.max(0, meanSq - mean * mean);
  return Math.sqrt(variance);
}

export function zScore(value: number, mean: number, std: number): number {
  if (std < 1e-6) return 0;
  return (value - mean) / std;
}
