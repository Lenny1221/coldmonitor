import type { CellAnomalyConfig } from './types';

/** Standaardconfig — later per cel of via env overschrijfbaar. */
export const DEFAULT_ANOMALY_CONFIG: CellAnomalyConfig = {
  zScoreThreshold: 3,
  zScoreAlarm: 4,
  learningMinDays: 21,
  learningMinReadings: 400,
  ewmaAlpha: 0.08,
  longTermAlpha: 0.02,
  fallbackDeltaTHigh: 14,
  fallbackDeltaTLow: 4,
  compressorMinOnMinutes: 12,
  defrostMinPauseMinutes: 35,
  postDefrostMinutes: 30,
  defrostEvapRiseC: 4,
  compressorEvapDropRateCPerMin: 0.12,
};
