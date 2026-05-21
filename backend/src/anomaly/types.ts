import type { MeasurementContextType, AnomalyBaselineMode } from '@prisma/client';

/** Context van één meting — bepaalt welke baseline wordt gebruikt. */
export type MeasurementContext = MeasurementContextType;

export type FindingSeverity = 'NORMAL' | 'ATTENTION' | 'ALARM';

export type AnomalyFeature = 'deltaT' | 'pullDownMinutes' | 'evaporatorFloor' | 'trendDrift';

/**
 * Gestandaardiseerde bevinding — voedt UI (FASE 1) en later escalatie / classificatie / LLM.
 * FASE 2: map feature → FaultHypothesis via IAnomalyClassifier.
 * FASE 3: map FindingDto → TechnicianAdvice via IAdviceGenerator.
 */
export interface AnomalyFindingDto {
  celId: string;
  feature: AnomalyFeature;
  huidigeWaarde: number;
  baselineGemiddelde: number | null;
  zScore: number | null;
  context: MeasurementContext;
  status: FindingSeverity;
  reden: string;
  aanbevolenActie: string;
  onderbouwing: string;
}

export interface ReadingInput {
  coldCellId: string;
  deviceId: string;
  roomTemp: number;
  evaporatorTemp: number | null;
  doorOpen: boolean;
  recordedAt: Date;
  setpointTemp: number;
  tempMaxThreshold: number;
}

export interface CellAnomalyConfig {
  zScoreThreshold: number;
  zScoreAlarm: number;
  learningMinDays: number;
  learningMinReadings: number;
  ewmaAlpha: number;
  longTermAlpha: number;
  fallbackDeltaTHigh: number;
  fallbackDeltaTLow: number;
  compressorMinOnMinutes: number;
  defrostMinPauseMinutes: number;
  postDefrostMinutes: number;
  defrostEvapRiseC: number;
  compressorEvapDropRateCPerMin: number;
}

export interface ProcessedFeatures {
  deltaT: number | null;
  pullDownMinutes: number | null;
  evaporatorFloor: number | null;
  context: MeasurementContext;
  skipEvaluation: boolean;
  skipBaselineUpdate: boolean;
}

export interface BaselineStats {
  mean: number;
  std: number;
  sampleCount: number;
}

export interface AnomalyFindingsResponse {
  celId: string;
  baselineMode: AnomalyBaselineMode;
  learningActive: boolean;
  learningProgress?: { daysElapsed: number; readings: number; targetDays: number };
  summaryStatus: FindingSeverity;
  findings: AnomalyFindingDto[];
}

/** FASE 2 aanknopingspunt — nog niet geïmplementeerd. */
export interface FaultHypothesis {
  code: string;
  probability: number;
  label: string;
}

export interface IAnomalyClassifier {
  classify(findings: AnomalyFindingDto[]): FaultHypothesis[];
}

/** FASE 3 aanknopingspunt — nog niet geïmplementeerd. */
export interface TechnicianAdvice {
  summary: string;
  steps: string[];
}

export interface IAdviceGenerator {
  generate(findings: AnomalyFindingDto[], hypotheses?: FaultHypothesis[]): TechnicianAdvice;
}
