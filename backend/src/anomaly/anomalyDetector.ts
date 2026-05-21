import type { MeasurementContextType, AnomalyBaselineMode } from '@prisma/client';
import { stdFromMoments, zScore } from './ewma';
import type {
  AnomalyFindingDto,
  BaselineStats,
  CellAnomalyConfig,
  FindingSeverity,
  ProcessedFeatures,
} from './types';

export function isLearningComplete(
  mode: AnomalyBaselineMode,
  firstReadingAt: Date | null,
  readingCount: number,
  config: CellAnomalyConfig,
  now: Date
): boolean {
  if (mode === 'ACTIVE') return true;
  if (!firstReadingAt) return false;
  const days = (now.getTime() - firstReadingAt.getTime()) / (86400000);
  return days >= config.learningMinDays && readingCount >= config.learningMinReadings;
}

export function baselineStatsFromRow(
  ewmaDeltaT: number | null,
  ewmaDeltaTSq: number | null,
  sampleCount: number
): BaselineStats | null {
  if (ewmaDeltaT == null || ewmaDeltaTSq == null || sampleCount < 5) return null;
  const std = stdFromMoments(ewmaDeltaT, ewmaDeltaTSq);
  return { mean: ewmaDeltaT, std, sampleCount };
}

function severityFromZ(z: number, config: CellAnomalyConfig): FindingSeverity {
  const a = Math.abs(z);
  if (a >= config.zScoreAlarm) return 'ALARM';
  if (a >= config.zScoreThreshold) return 'ATTENTION';
  return 'NORMAL';
}

function formatPctDiff(current: number, reference: number): number {
  if (Math.abs(reference) < 0.1) return 0;
  return Math.round(((current - reference) / reference) * 100);
}

/**
 * Evalueert één meting t.o.v. baseline of vaste drempels (leerperiode).
 */
export function evaluateMeasurement(
  celId: string,
  features: ProcessedFeatures,
  baseline: BaselineStats | null,
  pullDownBaseline: number | null,
  longTermMean: number | null,
  learningActive: boolean,
  config: CellAnomalyConfig,
  daysSinceFirstReading: number
): AnomalyFindingDto[] {
  const out: AnomalyFindingDto[] = [];
  const ctx = features.context;

  if (features.deltaT != null) {
    const f = evaluateDeltaT(
      celId,
      features.deltaT,
      ctx,
      baseline,
      learningActive,
      config
    );
    if (f.status !== 'NORMAL') out.push(f);
  }

  if (features.pullDownMinutes != null) {
    const f = evaluatePullDown(
      celId,
      features.pullDownMinutes,
      ctx,
      pullDownBaseline,
      learningActive,
      config
    );
    if (f.status !== 'NORMAL') out.push(f);
  }

  const trend = maybeTrendDrift(
    celId,
    baseline,
    longTermMean,
    daysSinceFirstReading,
    ctx,
    config
  );
  if (trend) out.push(trend);

  return out;
}

function evaluateDeltaT(
  celId: string,
  deltaT: number,
  context: MeasurementContextType,
  baseline: BaselineStats | null,
  learningActive: boolean,
  config: CellAnomalyConfig
): AnomalyFindingDto {
  let status: FindingSeverity = 'NORMAL';
  let z: number | null = null;
  let mean: number | null = baseline?.mean ?? null;
  let reden = 'ΔT binnen normaalprofiel.';
  let actie = 'Geen actie nodig.';
  let onderbouwing = `ΔT = ${deltaT.toFixed(1)} °C`;

  if (learningActive || !baseline) {
    if (deltaT > config.fallbackDeltaTHigh) {
      status = 'ATTENTION';
      reden = `ΔT (${deltaT.toFixed(1)} °C) boven vaste drempel (${config.fallbackDeltaTHigh} °C) — baseline nog in opbouw.`;
      actie = 'Controleer verdamper op ijsopbouw; baseline wordt nog opgebouwd (~2–3 weken).';
    } else if (deltaT < config.fallbackDeltaTLow) {
      status = 'ATTENTION';
      reden = `ΔT (${deltaT.toFixed(1)} °C) onder vaste drempel (${config.fallbackDeltaTLow} °C) — baseline nog in opbouw.`;
      actie = 'Controleer koelmiddelvulling en lekdetectie; baseline wordt nog opgebouwd.';
    }
    onderbouwing += ' | modus: leerperiode (vaste drempels)';
  } else {
    z = zScore(deltaT, baseline.mean, baseline.std);
    status = severityFromZ(z, config);
    const pct = formatPctDiff(deltaT, baseline.mean);
    if (status !== 'NORMAL') {
      const dir = z! > 0 ? 'boven' : 'onder';
      reden = `ΔT ligt ~${Math.abs(pct)}% ${dir} normaal (${contextLabel(context)}).`;
      actie =
        z! > 0
          ? 'Plan inspectie verdamper: mogelijke ijsopbouw of verminderde warmteafgifte.'
          : 'Controleer koelmiddelcircuit en superheat; mogelijk tekort aan koudemiddel.';
    }
    onderbouwing += ` | μ=${baseline.mean.toFixed(1)} σ=${baseline.std.toFixed(2)} z=${z?.toFixed(2)}`;
  }

  return {
    celId,
    feature: 'deltaT',
    huidigeWaarde: deltaT,
    baselineGemiddelde: mean,
    zScore: z,
    context,
    status,
    reden,
    aanbevolenActie: actie,
    onderbouwing,
  };
}

function evaluatePullDown(
  celId: string,
  minutes: number,
  context: MeasurementContextType,
  baselineMinutes: number | null,
  learningActive: boolean,
  config: CellAnomalyConfig
): AnomalyFindingDto {
  let status: FindingSeverity = 'NORMAL';
  let z: number | null = null;
  const fallbackMax = 45;

  if (learningActive || baselineMinutes == null) {
    if (minutes > fallbackMax) {
      status = 'ATTENTION';
    }
  } else {
    const std = Math.max(5, baselineMinutes * 0.25);
    z = zScore(minutes, baselineMinutes, std);
    status = severityFromZ(z, config);
  }

  const reden =
    status === 'NORMAL'
      ? 'Pull-down binnen normaal.'
      : `Pull-down duur ${minutes} min${baselineMinutes != null ? ` (normaal ~${Math.round(baselineMinutes)} min)` : ''}.`;

  return {
    celId,
    feature: 'pullDownMinutes',
    huidigeWaarde: minutes,
    baselineGemiddelde: baselineMinutes,
    zScore: z,
    context,
    status,
    reden,
    aanbevolenActie:
      status !== 'NORMAL'
        ? 'Controleer condensatie, deurafdichting en compressorbelasting; cel herstelt traag.'
        : 'Geen actie nodig.',
    onderbouwing: `pull-down = ${minutes} min`,
  };
}

function maybeTrendDrift(
  celId: string,
  baseline: BaselineStats | null,
  longTermMean: number | null,
  daysSinceFirstReading: number,
  context: MeasurementContextType,
  config: CellAnomalyConfig
): AnomalyFindingDto | null {
  if (!baseline || longTermMean == null || daysSinceFirstReading < 14) return null;

  const pct = formatPctDiff(baseline.mean, longTermMean);
  if (Math.abs(pct) < 15) return null;

  const driftZ = Math.abs((baseline.mean - longTermMean) / Math.max(baseline.std, 0.5));
  if (driftZ < 2) return null;

  const status: FindingSeverity = Math.abs(pct) >= 25 ? 'ALARM' : 'ATTENTION';
  const daysApprox = Math.min(30, Math.round(daysSinceFirstReading));

  return {
    celId,
    feature: 'trendDrift',
    huidigeWaarde: baseline.mean,
    baselineGemiddelde: longTermMean,
    zScore: driftZ,
    context,
    status,
    reden: `ΔT-baseline is ~${Math.abs(pct)}% ${pct > 0 ? 'hoger' : 'lager'} dan maandprofiel sinds ~${daysApprox} dagen.`,
    aanbevolenActie:
      pct > 0
        ? 'Trend wijst op geleidelijke verslechtering warmteafgifte — plan preventief onderhoud verdamper.'
        : 'Trend wijst op afnemende ΔT — controleer koelmiddel en lekken.',
    onderbouwing: `kortetermijn μ=${baseline.mean.toFixed(1)} | langetermijn μ=${longTermMean.toFixed(1)}`,
  };
}

function contextLabel(ctx: MeasurementContextType): string {
  const map: Record<MeasurementContextType, string> = {
    COMPRESSOR_ON: 'compressor aan',
    COMPRESSOR_OFF: 'compressor uit',
    POST_DEFROST: 'na ontdooiing',
    DOOR_OPEN: 'deur open',
  };
  return map[ctx] ?? ctx;
}

/** Hoogste ernst uit lijst bevindingen. */
export function summaryStatus(findings: AnomalyFindingDto[]): FindingSeverity {
  if (findings.some((f) => f.status === 'ALARM')) return 'ALARM';
  if (findings.some((f) => f.status === 'ATTENTION')) return 'ATTENTION';
  return 'NORMAL';
}
