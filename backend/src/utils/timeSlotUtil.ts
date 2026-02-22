/**
 * Bepaal het tijdslot op basis van klantinstellingen.
 * Alle tijden worden vergeleken in Europe/Brussels timezone.
 */

import { TimeSlot } from '@prisma/client';

export interface CustomerTimeSettings {
  openingTime: string; // "07:00"
  closingTime: string; // "17:00"
  nightStart: string;  // "23:00"
}

/**
 * Parse "HH:mm" string naar minuten sinds middernacht
 */
function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.trim().split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Haal huidige tijd in Europe/Brussels op als minuten sinds middernacht
 */
function getCurrentMinutesBrussels(): number {
  const now = new Date();
  const brussels = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
  return brussels.getHours() * 60 + brussels.getMinutes();
}

/**
 * Bepaal het huidige tijdslot voor een klant
 */
export function getTimeSlot(settings: CustomerTimeSettings): TimeSlot {
  const open = parseTimeToMinutes(settings.openingTime);
  const close = parseTimeToMinutes(settings.closingTime);
  const night = parseTimeToMinutes(settings.nightStart);

  const now = getCurrentMinutesBrussels();

  // OPEN_HOURS: opening_time <= now < closing_time
  if (now >= open && now < close) {
    return 'OPEN_HOURS';
  }

  // AFTER_HOURS: closing_time <= now < night_start
  if (now >= close && now < night) {
    return 'AFTER_HOURS';
  }

  // NIGHT: night_start <= now OF now < opening_time (volgende dag)
  return 'NIGHT';
}

export interface LayerConfig {
  layer1?: boolean;
  layer2?: boolean;
  layer3?: boolean;
}

export interface EscalationConfig {
  OPEN_HOURS?: LayerConfig;
  AFTER_HOURS?: LayerConfig;
  NIGHT?: LayerConfig;
}

const DEFAULT_LAYER_CONFIG: Record<TimeSlot, LayerConfig> = {
  OPEN_HOURS: { layer1: true, layer2: true, layer3: true },
  AFTER_HOURS: { layer1: false, layer2: true, layer3: true },
  NIGHT: { layer1: false, layer2: false, layer3: true },
};

/**
 * Bepaal de initiële escalatielaag op basis van tijdslot en klantconfig
 * Eerste ingeschakelde laag wordt gebruikt
 */
export function getInitialLayerForTimeSlot(
  timeSlot: TimeSlot,
  config?: EscalationConfig | null
): 'LAYER_1' | 'LAYER_2' | 'LAYER_3' {
  const slotConfig = config?.[timeSlot] ?? DEFAULT_LAYER_CONFIG[timeSlot];
  if (slotConfig?.layer1 !== false) return 'LAYER_1';
  if (slotConfig?.layer2 !== false) return 'LAYER_2';
  return 'LAYER_3';
}

/**
 * Check of een laag actief is voor dit tijdslot (voor escalatie naar volgende laag)
 */
export function isLayerEnabled(
  timeSlot: TimeSlot,
  layer: 'LAYER_1' | 'LAYER_2' | 'LAYER_3',
  config?: EscalationConfig | null
): boolean {
  const slotConfig = config?.[timeSlot] ?? DEFAULT_LAYER_CONFIG[timeSlot];
  const key = layer === 'LAYER_1' ? 'layer1' : layer === 'LAYER_2' ? 'layer2' : 'layer3';
  return slotConfig?.[key] !== false;
}
