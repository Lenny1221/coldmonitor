/**
 * Koudemiddelen Logboek – wettelijk conform EU 517/2014, NBN EN 378, EU 2024/573
 * GWP-referentietabel, CO₂-eq berekening, lekcontrolfrequentie, bijvulverbod-check
 */

export const GWP_TABLE: Record<string, { gwp: number; type: string; note?: string }> = {
  R32: { gwp: 675, type: 'HFK' },
  R410A: { gwp: 2088, type: 'HFK-mengsel' },
  R134a: { gwp: 1430, type: 'HFK' },
  R404A: { gwp: 3922, type: 'HFK-mengsel', note: 'Bijvulverbod GWP ≥ 2500' },
  R507: { gwp: 3985, type: 'HFK-mengsel', note: 'Bijvulverbod GWP ≥ 2500' },
  R407C: { gwp: 1774, type: 'HFK-mengsel' },
  R407F: { gwp: 1825, type: 'HFK-mengsel' },
  R448A: { gwp: 1387, type: 'HFK-mengsel' },
  R449A: { gwp: 1282, type: 'HFK-mengsel' },
  R452A: { gwp: 2140, type: 'HFK-mengsel' },
  R1234yf: { gwp: 4, type: 'HFO' },
  R1234ze: { gwp: 7, type: 'HFO' },
  R290: { gwp: 3, type: 'Natuurlijk' },
  R600a: { gwp: 3, type: 'Natuurlijk' },
  R744: { gwp: 1, type: 'Natuurlijk' },
  R717: { gwp: 0, type: 'Natuurlijk' },
  R513A: { gwp: 631, type: 'HFO-mengsel' },
  R22: { gwp: 1810, type: 'HFK' },
  R123: { gwp: 77, type: 'HFK' },
  R125: { gwp: 3170, type: 'HFK' },
};

/** GWP-waarde ophalen (case-insensitive) */
export function getGwp(refrigerantType: string): number {
  const key = refrigerantType.toUpperCase().replace(/\s/g, '');
  for (const [k, v] of Object.entries(GWP_TABLE)) {
    if (k.toUpperCase() === key) return v.gwp;
  }
  return 2000; // Default voor onbekend
}

/** CO₂-equivalent in ton: kg × GWP / 1.000.000 */
export function calculateCo2EquivalentTon(refrigerantKg: number, refrigerantType: string): number {
  const gwp = getGwp(refrigerantType);
  return (refrigerantKg * gwp) / 1_000_000;
}

/** Lekcontrolfrequentie in maanden (5–50: 12, 50–500: 6, >500: 3; met lekdetectie: halveren) */
export function getLeakCheckFrequencyMonths(co2EquivalentTon: number, hasLeakDetection: boolean): number {
  let months = 12;
  if (co2EquivalentTon >= 50 && co2EquivalentTon < 500) months = 6;
  else if (co2EquivalentTon >= 500) months = 3;
  if (hasLeakDetection) months = Math.ceil(months / 2);
  return months;
}

/** Logboekplicht: NBN EN 378: ≥3 kg; EU 517/2014: ≥5 ton CO₂-eq (of 10 ton hermetisch) */
export function getLogbookRequirement(
  refrigerantKg: number,
  co2EquivalentTon: number,
  isHermeticallySealed: boolean
): { required: boolean; reason: string } {
  if (refrigerantKg >= 3) {
    return { required: true, reason: 'Verplicht (≥ 3 kg, NBN EN 378)' };
  }
  if (co2EquivalentTon >= 5 && !isHermeticallySealed) {
    return { required: true, reason: 'Verplicht (≥ 5 ton CO₂-eq, EU 517/2014)' };
  }
  if (co2EquivalentTon >= 10 && isHermeticallySealed) {
    return { required: true, reason: 'Verplicht (≥ 10 ton CO₂-eq hermetisch, EU 517/2014)' };
  }
  return { required: false, reason: 'Aanbevolen (< 3 kg)' };
}

/** Bijvulverbod: GWP ≥ 2500, installatie ≥ 40 ton CO₂-eq, vanaf 01/01/2020 */
export function checkTopUpBan(
  refrigerantType: string,
  co2EquivalentTon: number
): { banned: boolean; message?: string } {
  const gwp = getGwp(refrigerantType);
  if (gwp >= 2500 && co2EquivalentTon >= 40) {
    return {
      banned: true,
      message:
        'Bijvulverbod actief: dit koudemiddel (GWP ≥ 2500) mag niet meer bijgevuld worden met nieuw/maagdelijk product op installaties ≥ 40 ton CO₂-eq (EU 517/2014, art. 13). Enkel gerecycleerd of geregenereerd product toegestaan t.e.m. 2030.',
    };
  }
  return { banned: false };
}

/** Kenplaatplicht: ≥ 5 ton CO₂-eq */
export function isNameplateRequired(co2EquivalentTon: number): boolean {
  return co2EquivalentTon >= 5;
}

/** Lekverlies % dit jaar berekenen */
export function calculateLeakLossPercent(
  totalLossKgThisYear: number,
  totalRefrigerantKg: number
): number {
  if (totalRefrigerantKg <= 0) return 0;
  return (totalLossKgThisYear / totalRefrigerantKg) * 100;
}

/** Status badge voor dashboard */
export type LogbookStatus = 'IN_ORDE' | 'BINNENKORT' | 'VERVALLEN' | 'BIJVULVERBOD';

export function getLogbookStatus(
  nextLeakCheckDate: Date | null,
  co2EquivalentTon: number,
  refrigerantType: string
): LogbookStatus {
  const topUpBan = checkTopUpBan(refrigerantType, co2EquivalentTon);
  if (topUpBan.banned) return 'BIJVULVERBOD';

  if (!nextLeakCheckDate) return 'VERVALLEN';
  const now = new Date();
  const diffDays = Math.ceil((nextLeakCheckDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'VERVALLEN';
  if (diffDays <= 30) return 'BINNENKORT';
  return 'IN_ORDE';
}
