/**
 * Onderhoudsfrequentie-berekening conform F-gassenverordening EU 517/2014,
 * VLAREM (Vlaanderen), EPBD
 */

export type InstallationType = 'KOELINSTALLATIE' | 'AIRCO' | 'WARMTEPOMP' | 'VRIESINSTALLATIE';

export interface MaintenanceFrequencyInput {
  refrigerantKg: number;
  co2EquivalentTon?: number;
  nominalCoolingKw?: number;
  installationType: InstallationType;
  hasLeakDetection: boolean;
}

export interface MaintenanceRule {
  label: string;
  frequencyMonths: number; // Maanden tussen onderhoud
  isMandatory: boolean;
  source: string;
}

/** GWP-waarden (Global Warming Potential) voor CO₂-eq berekening - ton CO₂-eq per kg */
const GWP: Record<string, number> = {
  R22: 1810, R123: 77, R124: 609, R125: 3170, R134a: 1430, R143a: 4470, R152a: 124, R227ea: 3220, R236fa: 9810, R245fa: 1030,
  R32: 675, R410A: 2088, R407C: 1774, R407A: 2107, R404A: 3922, R507: 3985,
  R422D: 2729, R422A: 3143, R428A: 3607, R434A: 3245, R437A: 2285, R438A: 2263, R417A: 2346, R423A: 2283,
  R449A: 1397, R452A: 2140, R453A: 1480, R513A: 631, R516A: 733,
  R1234YF: 4, 'R1234ZE(E)': 7, 'R1234ZE(Z)': 7, 'R1233ZD(E)': 1,
  R290: 3, R600A: 3, R744: 1, R717: 0, // R744=CO2, R717=ammoniak
};

/** Bereken CO₂-equivalent in ton uit kg en refrigerant type */
export function calculateCo2Equivalent(refrigerantKg: number, refrigerantType: string): number {
  const gwp = GWP[refrigerantType.toUpperCase()] ?? 2000; // Default voor onbekend
  return (refrigerantKg * gwp) / 1_000_000; // ton CO₂-eq
}

/**
 * Bepaal verplichte onderhoudsfrequentie op basis van wettelijk kader
 */
export function getMaintenanceFrequency(input: MaintenanceFrequencyInput): MaintenanceRule[] {
  const rules: MaintenanceRule[] = [];
  const { refrigerantKg, co2EquivalentTon = 0, nominalCoolingKw = 0, installationType, hasLeakDetection } = input;

  // < 3 kg: aanbevolen, niet verplicht
  if (refrigerantKg < 3) {
    rules.push({
      label: 'Aanbevolen onderhoud (niet wettelijk verplicht)',
      frequencyMonths: 12,
      isMandatory: false,
      source: 'F-gassen',
    });
    return rules;
  }

  // ≥ 3 kg: jaarlijks verplicht + lektest
  if (refrigerantKg >= 3) {
    let leakFreqMonths = 12;
    let reason = '';
    if (co2EquivalentTon >= 5 && co2EquivalentTon < 50) {
      leakFreqMonths = 12;
      reason = ' (omdat CO₂-equivalent ≥ 5 ton)';
    } else if (co2EquivalentTon >= 50 && co2EquivalentTon < 500) {
      leakFreqMonths = 6;
      reason = ' (omdat CO₂-equivalent ≥ 50 ton)';
    } else if (co2EquivalentTon >= 500) {
      leakFreqMonths = 3;
      reason = ' (omdat CO₂-equivalent ≥ 500 ton)';
    }

    if (hasLeakDetection) {
      leakFreqMonths = Math.ceil(leakFreqMonths / 2);
      if (reason) reason += '; met lekdetectie: ' + (leakFreqMonths === 6 ? 'halfjaarlijks' : leakFreqMonths === 3 ? 'kwartaal' : leakFreqMonths === 2 ? 'tweemaandelijks' : 'maandelijks');
    }

    const freqLabel = leakFreqMonths === 12 ? 'jaarlijkse' : leakFreqMonths === 6 ? 'halfjaarlijkse' : leakFreqMonths === 3 ? 'driemaandelijkse' : leakFreqMonths === 2 ? 'tweemaandelijkse' : 'maandelijkse';
    rules.push({
      label: co2EquivalentTon >= 5
        ? `Verplichte ${freqLabel} lekdichtheidscontrole${reason}`
        : 'Verplicht jaarlijks onderhoud + lektest',
      frequencyMonths: leakFreqMonths,
      isMandatory: true,
      source: 'EU 517/2014 (F-gassen)',
    });
  }

  // Airco > 12 kW (Vlaanderen VLAREM)
  if (installationType === 'AIRCO' && nominalCoolingKw > 12) {
    rules.push({
      label: 'Verplichte VLAREM-keuring: eerste binnen 12 maanden, daarna periodiek',
      frequencyMonths: 12,
      isMandatory: true,
      source: 'VLAREM',
    });
  }

  // Airco > 70 kW (EPBD)
  if (installationType === 'AIRCO' && nominalCoolingKw > 70) {
    rules.push({
      label: 'Verplichte EPBD-energiekeuring elke 5 jaar',
      frequencyMonths: 60,
      isMandatory: true,
      source: 'EPBD',
    });
  }

  return rules;
}

/** Bepaal de strengste (kortste) frequentie uit de regels */
export function getStrictestFrequency(rules: MaintenanceRule[]): number {
  if (rules.length === 0) return 12;
  return Math.min(...rules.map((r) => r.frequencyMonths));
}

/** Bereken datum volgend onderhoud op basis van laatste onderhoud + frequentie */
export function calculateNextMaintenanceDate(
  lastMaintenanceDate: Date | null,
  firstUseDate: Date | null,
  frequencyMonths: number
): Date {
  const base = lastMaintenanceDate ?? firstUseDate ?? new Date();
  const next = new Date(base);
  next.setMonth(next.getMonth() + frequencyMonths);
  return next;
}

/** Badge-status: IN_ORDE | BINNENKORT | VERVALLEN */
export type MaintenanceBadge = 'IN_ORDE' | 'BINNENKORT' | 'VERVALLEN';

export function getMaintenanceBadge(nextMaintenanceDate: Date | null): MaintenanceBadge {
  if (!nextMaintenanceDate) return 'VERVALLEN';
  const now = new Date();
  const diffDays = Math.ceil((nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'VERVALLEN';
  if (diffDays <= 60) return 'BINNENKORT';
  return 'IN_ORDE';
}
