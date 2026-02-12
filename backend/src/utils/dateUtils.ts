/**
 * Geeft de datumstring (YYYY-MM-DD) voor vandaag in de opgegeven timezone.
 * Gebruikt voor dag-tellers die om middernacht resetten.
 */
export function getTodayDateString(timezone: string = 'Europe/Brussels'): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

/**
 * Controleert of de counts nog geldig zijn voor vandaag.
 * Als doorCountsDate null is of vóór vandaag, zijn de tellers verouderd.
 */
export function areCountsValidForToday(
  doorCountsDate: Date | null | undefined,
  timezone: string = 'Europe/Brussels'
): boolean {
  if (!doorCountsDate) return false;
  const storedDate = doorCountsDate.toLocaleDateString('en-CA', { timeZone: timezone });
  const today = getTodayDateString(timezone);
  return storedDate === today;
}

/**
 * Geeft de "vandaag"-tellers. Retourneert 0 als de datum verouderd is (nieuwe dag).
 */
export function getEffectiveDoorCountsToday(
  doorOpenCountTotal: number,
  doorCloseCountTotal: number,
  doorCountsDate: Date | null | undefined,
  timezone: string = 'Europe/Brussels'
): { doorOpenCountTotal: number; doorCloseCountTotal: number } {
  if (!areCountsValidForToday(doorCountsDate, timezone)) {
    return { doorOpenCountTotal: 0, doorCloseCountTotal: 0 };
  }
  return { doorOpenCountTotal, doorCloseCountTotal };
}
