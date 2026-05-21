import type { MeasurementContextType } from '@prisma/client';
import { prisma } from '../config/database';
import { ewmaMomentsUpdate, ewmaUpdate } from './ewma';
import type { CellAnomalyConfig, ProcessedFeatures } from './types';

export async function upsertContextBaseline(
  coldCellId: string,
  context: MeasurementContextType,
  features: ProcessedFeatures,
  config: CellAnomalyConfig
): Promise<void> {
  if (features.skipBaselineUpdate || features.deltaT == null) return;

  const existing = await prisma.coldCellContextBaseline.findUnique({
    where: { coldCellId_context: { coldCellId, context } },
  });

  const alpha = config.ewmaAlpha;
  const { mean, meanSq } = ewmaMomentsUpdate(
    existing?.ewmaDeltaT ?? null,
    existing?.ewmaDeltaTSq ?? null,
    features.deltaT,
    alpha
  );

  const longTerm = ewmaUpdate(
    existing?.longTermDeltaT ?? null,
    features.deltaT,
    config.longTermAlpha
  );

  let pullDown = existing?.ewmaPullDownMin ?? null;
  if (features.pullDownMinutes != null) {
    pullDown = ewmaUpdate(pullDown, features.pullDownMinutes, alpha);
  }

  let evapFloor = existing?.ewmaEvapFloor ?? null;
  if (features.evaporatorFloor != null) {
    evapFloor = ewmaUpdate(evapFloor, features.evaporatorFloor, alpha);
  }

  await prisma.coldCellContextBaseline.upsert({
    where: { coldCellId_context: { coldCellId, context } },
    create: {
      coldCellId,
      context,
      ewmaDeltaT: mean,
      ewmaDeltaTSq: meanSq,
      ewmaPullDownMin: pullDown,
      ewmaEvapFloor: evapFloor,
      longTermDeltaT: longTerm,
      sampleCount: 1,
    },
    update: {
      ewmaDeltaT: mean,
      ewmaDeltaTSq: meanSq,
      ewmaPullDownMin: pullDown,
      ewmaEvapFloor: evapFloor,
      longTermDeltaT: longTerm,
      sampleCount: { increment: 1 },
    },
  });
}

export async function getContextBaseline(
  coldCellId: string,
  context: MeasurementContextType
) {
  return prisma.coldCellContextBaseline.findUnique({
    where: { coldCellId_context: { coldCellId, context } },
  });
}
