import type { MeasurementContextType } from '@prisma/client';
import type { CellAnomalyConfig, ReadingInput } from './types';

export interface CycleState {
  compressorInferredOn: boolean;
  compressorOnSince: Date | null;
  defrostActive: boolean;
  defrostStartedAt: Date | null;
  postDefrostUntil: Date | null;
  doorOpenSince: Date | null;
  lastEvaporatorTemp: number | null;
  lastEvaporatorAt: Date | null;
}

export interface ContextResult {
  context: MeasurementContextType;
  skipEvaluation: boolean;
  skipBaselineUpdate: boolean;
  nextState: Partial<CycleState>;
}

/**
 * Bepaalt meetcontext en cyclustatus.
 * Compressor: afgeleid uit dalende verdampertemp (geen hardware-ingang in FASE 1).
 * TODO: vervang inferentie door digitale compressor-ingang zodra firmware die doorgeeft.
 */
export function classifyContext(
  input: ReadingInput,
  state: CycleState,
  config: CellAnomalyConfig
): ContextResult {
  const now = input.recordedAt;
  const next: Partial<CycleState> = {};

  if (input.doorOpen) {
    return {
      context: 'DOOR_OPEN',
      skipEvaluation: true,
      skipBaselineUpdate: true,
      nextState: {
        doorOpenSince: state.doorOpenSince ?? now,
        ...next,
      },
    };
  }
  next.doorOpenSince = null;

  const evap = input.evaporatorTemp;
  let defrostActive = state.defrostActive;
  let defrostStartedAt = state.defrostStartedAt;
  let postDefrostUntil = state.postDefrostUntil;

  if (evap != null && state.lastEvaporatorTemp != null && state.lastEvaporatorAt) {
    const dtMin = (now.getTime() - state.lastEvaporatorAt.getTime()) / 60000;
    if (dtMin > 0 && dtMin < 30) {
      const rise = evap - state.lastEvaporatorTemp;
      if (rise >= config.defrostEvapRiseC && !defrostActive) {
        defrostActive = true;
        defrostStartedAt = now;
      }
    }
  }

  if (defrostActive && defrostStartedAt) {
    const defrostMin = (now.getTime() - defrostStartedAt.getTime()) / 60000;
    if (defrostMin >= config.defrostMinPauseMinutes) {
      defrostActive = false;
      postDefrostUntil = new Date(now.getTime() + config.postDefrostMinutes * 60000);
      defrostStartedAt = null;
    }
  }

  next.defrostActive = defrostActive;
  next.defrostStartedAt = defrostStartedAt;
  next.postDefrostUntil = postDefrostUntil;
  next.lastEvaporatorTemp = evap ?? state.lastEvaporatorTemp;
  next.lastEvaporatorAt = evap != null ? now : state.lastEvaporatorAt;

  if (defrostActive) {
    return {
      context: 'POST_DEFROST',
      skipEvaluation: true,
      skipBaselineUpdate: true,
      nextState: next,
    };
  }

  if (postDefrostUntil && now < postDefrostUntil) {
    return {
      context: 'POST_DEFROST',
      skipEvaluation: false,
      skipBaselineUpdate: false,
      nextState: next,
    };
  }
  if (postDefrostUntil && now >= postDefrostUntil) {
    next.postDefrostUntil = null;
  }

  let compressorOn = state.compressorInferredOn;
  let compressorOnSince = state.compressorOnSince;

  if (evap != null && state.lastEvaporatorTemp != null && state.lastEvaporatorAt) {
    const dtMin = (now.getTime() - state.lastEvaporatorAt.getTime()) / 60000;
    if (dtMin > 0 && dtMin < 30) {
      const rate = (state.lastEvaporatorTemp - evap) / dtMin;
      if (rate >= config.compressorEvapDropRateCPerMin) {
        compressorOn = true;
        if (!compressorOnSince) compressorOnSince = now;
      } else if (rate < config.compressorEvapDropRateCPerMin * 0.3) {
        compressorOn = false;
        compressorOnSince = null;
      }
    }
  }

  next.compressorInferredOn = compressorOn;
  next.compressorOnSince = compressorOnSince;

  const context: MeasurementContextType = compressorOn ? 'COMPRESSOR_ON' : 'COMPRESSOR_OFF';

  let skipEvaluation = false;
  if (compressorOn && compressorOnSince) {
    const onMin = (now.getTime() - compressorOnSince.getTime()) / 60000;
    if (onMin < config.compressorMinOnMinutes) {
      skipEvaluation = true;
    }
  }

  return {
    context,
    skipEvaluation,
    skipBaselineUpdate: false,
    nextState: next,
  };
}
