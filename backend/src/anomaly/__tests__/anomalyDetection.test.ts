/**
 * Anomaliedetectie — gesimuleerde meetreeksen
 * Run: npx tsx src/anomaly/__tests__/anomalyDetection.test.ts
 */
import { ewmaMomentsUpdate } from '../ewma';
import { baselineStatsFromRow, evaluateMeasurement } from '../anomalyDetector';
import { DEFAULT_ANOMALY_CONFIG } from '../constants';
import type { ProcessedFeatures } from '../types';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const celId = 'test-cell-1';
const ctx = 'COMPRESSOR_ON' as const;

function buildBaselineFromSeries(deltaTs: number[]) {
  let mean: number | null = null;
  let meanSq: number | null = null;
  const alpha = DEFAULT_ANOMALY_CONFIG.ewmaAlpha;
  for (const v of deltaTs) {
    const m = ewmaMomentsUpdate(mean, meanSq, v, alpha);
    mean = m.mean;
    meanSq = m.meanSq;
  }
  return baselineStatsFromRow(mean, meanSq, deltaTs.length)!;
}

function feat(deltaT: number, pullDown?: number): ProcessedFeatures {
  return {
    deltaT,
    pullDownMinutes: pullDown ?? null,
    evaporatorFloor: null,
    context: ctx,
    skipEvaluation: false,
    skipBaselineUpdate: false,
  };
}

console.log('Anomaliedetectie tests...\n');

// 1) Normale cel — ΔT rond 8 °C, nieuwe meting dichtbij baseline
{
  const history = Array.from({ length: 40 }, () => 7.8 + (Math.random() - 0.5) * 0.4);
  const baseline = buildBaselineFromSeries(history);
  const findings = evaluateMeasurement(
    celId,
    feat(8.0),
    baseline,
    22,
    7.9,
    false,
    DEFAULT_ANOMALY_CONFIG,
    25
  );
  assert(findings.length === 0, 'normale cel: geen bevindingen');
  console.log('  ✓ normale cel: geen afwijking bij ΔT ≈ baseline');
}

// 2) Langzaam stijgende ΔT (vervuiling/ijsopbouw)
{
  const history = Array.from({ length: 50 }, (_, i) => 7 + i * 0.02);
  const baseline = buildBaselineFromSeries(history.slice(0, 35));
  const current = 11.5;
  const findings = evaluateMeasurement(
    celId,
    feat(current),
    baseline,
    null,
    7.5,
    false,
    DEFAULT_ANOMALY_CONFIG,
    20
  );
  const deltaFinding = findings.find((f) => f.feature === 'deltaT');
  assert(!!deltaFinding, 'stijgende ΔT: bevinding verwacht');
  assert(
    deltaFinding!.status === 'ATTENTION' || deltaFinding!.status === 'ALARM',
    'stijgende ΔT: ATTENTION of ALARM'
  );
  assert((deltaFinding!.zScore ?? 0) > 2, 'stijgende ΔT: hoge z-score');
  console.log('  ✓ ijsopbouw-simulatie: ΔT boven baseline gedetecteerd');
}

// 3) Te kleine ΔT (koudemiddeltekort)
{
  const history = Array.from({ length: 50 }, () => 8.5 + (Math.random() - 0.5) * 0.3);
  const baseline = buildBaselineFromSeries(history);
  const findings = evaluateMeasurement(
    celId,
    feat(2.8),
    baseline,
    null,
    8.4,
    false,
    DEFAULT_ANOMALY_CONFIG,
    25
  );
  const deltaFinding = findings.find((f) => f.feature === 'deltaT');
  assert(!!deltaFinding, 'lage ΔT: bevinding verwacht');
  assert((deltaFinding!.zScore ?? 0) < -2, 'lage ΔT: negatieve z-score');
  console.log('  ✓ koudemiddel-simulatie: ΔT onder baseline gedetecteerd');
}

// 4) Leerperiode — vaste drempel hoog
{
  const findings = evaluateMeasurement(
    celId,
    feat(16),
    null,
    null,
    null,
    true,
    DEFAULT_ANOMALY_CONFIG,
    3
  );
  assert(findings.some((f) => f.feature === 'deltaT'), 'leerperiode: hoge ΔT triggert fallback');
  console.log('  ✓ leerperiode: vaste drempel actief');
}

console.log('\nAlle anomaliedetectie-tests geslaagd.');
