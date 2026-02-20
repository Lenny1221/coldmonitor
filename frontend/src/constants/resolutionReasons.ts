/**
 * Redenen per alarmtype om te kiezen bij "Oplossen"
 */
export type AlertType = 'HIGH_TEMP' | 'LOW_TEMP' | 'POWER_LOSS' | 'SENSOR_ERROR' | 'DOOR_OPEN';

export const RESOLUTION_REASONS: Record<AlertType, string[]> = {
  HIGH_TEMP: [
    'Deur stond te lang open',
    'Spanning lag eruit',
    'Ontdooiing uitgevoerd',
    'Producten toegevoegd',
    'Instellingen aangepast',
    'Anders',
  ],
  LOW_TEMP: [
    'Deur stond te lang open',
    'Spanning lag eruit',
    'Thermostaat aangepast',
    'Producten verwijderd',
    'Instellingen aangepast',
    'Anders',
  ],
  POWER_LOSS: [
    'Stroom hersteld',
    'Korte onderbreking',
    'Schakelaar omgezet',
    'Onderhoud uitgevoerd',
    'Anders',
  ],
  SENSOR_ERROR: [
    'Sensor vervangen',
    'Verbinding hersteld',
    'Onderhoud uitgevoerd',
    'Tijdelijk uitgevallen',
    'Anders',
  ],
  DOOR_OPEN: [
    'Deur gesloten',
    'Levering ontvangen',
    'Onderhoud uitgevoerd',
    'Vergissing',
    'Anders',
  ],
};

export function getResolutionReasons(alertType: AlertType): string[] {
  return RESOLUTION_REASONS[alertType] ?? RESOLUTION_REASONS.HIGH_TEMP;
}
