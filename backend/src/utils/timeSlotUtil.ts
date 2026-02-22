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

/**
 * Bepaal de initiële escalatielaag op basis van tijdslot
 * - OPEN_HOURS: Layer 1
 * - AFTER_HOURS: Layer 2 (skip layer 1)
 * - NIGHT: Layer 3 (skip layer 1 en 2)
 */
export function getInitialLayerForTimeSlot(timeSlot: TimeSlot): 'LAYER_1' | 'LAYER_2' | 'LAYER_3' {
  switch (timeSlot) {
    case 'OPEN_HOURS':
      return 'LAYER_1';
    case 'AFTER_HOURS':
      return 'LAYER_2';
    case 'NIGHT':
      return 'LAYER_3';
    default:
      return 'LAYER_1';
  }
}
