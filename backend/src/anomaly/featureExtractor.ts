import type { MeasurementContextType } from '@prisma/client';
import type { ProcessedFeatures, ReadingInput } from './types';

const RECOVERY_MARGIN_C = 0.3;

/**
 * Feature-berekening per meting.
 */
export function extractFeatures(
  input: ReadingInput,
  context: MeasurementContextType,
  pullDownStartedAt: Date | null,
  recordedAt: Date
): { features: ProcessedFeatures; pullDownStartedAt: Date | null } {
  const evap = input.evaporatorTemp;
  const deltaT = evap != null ? input.roomTemp - evap : null;

  let nextPullDown = pullDownStartedAt;
  let pullDownMinutes: number | null = null;

  const warmBand = input.tempMaxThreshold;
  const isWarm = input.roomTemp > warmBand;

  if (isWarm && !nextPullDown) {
    nextPullDown = recordedAt;
  }
  if (!isWarm && nextPullDown) {
    const ms = recordedAt.getTime() - nextPullDown.getTime();
    pullDownMinutes = Math.max(1, Math.round(ms / 60000));
    nextPullDown = null;
  }

  const evaporatorFloor =
    context === 'POST_DEFROST' && evap != null ? evap : null;

  return {
    features: {
      deltaT,
      pullDownMinutes,
      evaporatorFloor,
      context,
      skipEvaluation: false,
      skipBaselineUpdate: false,
    },
    pullDownStartedAt: nextPullDown,
  };
}

export function isRecovered(roomTemp: number, setpoint: number): boolean {
  return roomTemp <= setpoint + RECOVERY_MARGIN_C;
}
