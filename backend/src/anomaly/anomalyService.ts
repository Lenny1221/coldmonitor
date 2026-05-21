import type { AnomalyBaselineMode } from '@prisma/client';
import { prisma } from '../config/database';
import {
  baselineStatsFromRow,
  evaluateMeasurement,
  isLearningComplete,
  summaryStatus,
} from './anomalyDetector';
import { upsertContextBaseline, getContextBaseline } from './baselineStore';
import { classifyContext, type CycleState } from './contextClassifier';
import { DEFAULT_ANOMALY_CONFIG } from './constants';
import { extractFeatures } from './featureExtractor';
import type {
  AnomalyFindingsResponse,
  AnomalyFindingDto,
  ReadingInput,
  CellAnomalyConfig,
} from './types';

export class AnomalyService {
  constructor(private readonly config: CellAnomalyConfig = DEFAULT_ANOMALY_CONFIG) {}

  /**
   * Verwerk één binnenkomende meting: context, features, baseline EWMA, detectie.
   * Wordt aangeroepen vanuit readings-controller na opslaan in DB.
   */
  async processReading(input: ReadingInput): Promise<void> {
    const coldCell = await prisma.coldCell.findUnique({
      where: { id: input.coldCellId },
      select: {
        temperatureMinThreshold: true,
        temperatureMaxThreshold: true,
      },
    });
    if (!coldCell) return;

    const setpoint =
      (coldCell.temperatureMinThreshold + coldCell.temperatureMaxThreshold) / 2;

    let state = await prisma.coldCellAnomalyState.findUnique({
      where: { coldCellId: input.coldCellId },
    });

    if (!state) {
      state = await prisma.coldCellAnomalyState.create({
        data: { coldCellId: input.coldCellId },
      });
    }

    const cycleState: CycleState = {
      compressorInferredOn: state.compressorInferredOn,
      compressorOnSince: state.compressorOnSince,
      defrostActive: state.defrostActive,
      defrostStartedAt: state.defrostStartedAt,
      postDefrostUntil: state.postDefrostUntil,
      doorOpenSince: state.doorOpenSince,
      lastEvaporatorTemp: state.lastEvaporatorTemp,
      lastEvaporatorAt: state.lastEvaporatorAt,
    };

    const ctxResult = classifyContext(
      { ...input, setpointTemp: setpoint, tempMaxThreshold: coldCell.temperatureMaxThreshold },
      cycleState,
      this.config
    );

    const { features, pullDownStartedAt } = extractFeatures(
      input,
      ctxResult.context,
      state.pullDownStartedAt,
      input.recordedAt
    );

    features.skipEvaluation = ctxResult.skipEvaluation;
    features.skipBaselineUpdate = ctxResult.skipBaselineUpdate;

    if (!features.skipBaselineUpdate && input.evaporatorTemp != null) {
      await upsertContextBaseline(input.coldCellId, ctxResult.context, features, this.config);
    }

    const readingCount = state.readingCount + 1;
    const firstReadingAt = state.firstReadingAt ?? input.recordedAt;
    const now = input.recordedAt;
    const learningDone = isLearningComplete(
      state.baselineMode,
      firstReadingAt,
      readingCount,
      this.config,
      now
    );
    const learningActive = !learningDone;
    const baselineMode: AnomalyBaselineMode = learningDone ? 'ACTIVE' : 'LEARNING';

    let activeFindings: AnomalyFindingDto[] = [];

    if (!features.skipEvaluation && input.evaporatorTemp != null) {
      const row = await getContextBaseline(input.coldCellId, ctxResult.context);
      const stats = baselineStatsFromRow(
        row?.ewmaDeltaT ?? null,
        row?.ewmaDeltaTSq ?? null,
        row?.sampleCount ?? 0
      );

      const daysSinceFirst = (now.getTime() - firstReadingAt.getTime()) / 86400000;

      activeFindings = evaluateMeasurement(
        input.coldCellId,
        features,
        stats,
        row?.ewmaPullDownMin ?? null,
        row?.longTermDeltaT ?? null,
        learningActive,
        this.config,
        daysSinceFirst
      );
    }

    await prisma.coldCellAnomalyState.update({
      where: { coldCellId: input.coldCellId },
      data: {
        baselineMode,
        firstReadingAt,
        readingCount,
        lastProcessedAt: now,
        pullDownStartedAt,
        lastRoomTemp: input.roomTemp,
        activeFindings: activeFindings as object,
        ...ctxResult.nextState,
      },
    });
  }

  /**
   * Bevindingen voor technieker-dashboard — UI toont alleen deze DTO's.
   */
  async getFindings(
    coldCellId: string,
    _range?: '24h' | '7d' | '30d'
  ): Promise<AnomalyFindingsResponse> {
    const state = await prisma.coldCellAnomalyState.findUnique({
      where: { coldCellId },
    });

    const mode = state?.baselineMode ?? 'LEARNING';
    const firstAt = state?.firstReadingAt ?? null;
    const now = new Date();
    const learningActive = !isLearningComplete(
      mode,
      firstAt,
      state?.readingCount ?? 0,
      this.config,
      now
    );

    const raw = state?.activeFindings;
    const findings: AnomalyFindingDto[] = Array.isArray(raw)
      ? (raw as unknown as AnomalyFindingDto[])
      : [];

    const daysElapsed = firstAt
      ? Math.floor((now.getTime() - firstAt.getTime()) / 86400000)
      : 0;

    return {
      celId: coldCellId,
      baselineMode: mode,
      learningActive,
      learningProgress: {
        daysElapsed,
        readings: state?.readingCount ?? 0,
        targetDays: this.config.learningMinDays,
      },
      summaryStatus: learningActive && findings.length === 0 ? 'NORMAL' : summaryStatus(findings),
      findings,
    };
  }
}

export const anomalyService = new AnomalyService();
