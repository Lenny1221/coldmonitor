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
  R410A: 2088,
  R32: 675,
  R290: 3,
  R134a: 1430,
  R404A: 3922,
  R407C: 1774,
  R507: 3985,
  CO2: 1,
  R717: 0, // Ammoniak
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
    if (co2EquivalentTon >= 5 && co2EquivalentTon < 50) leakFreqMonths = 12;
    else if (co2EquivalentTon >= 50 && co2EquivalentTon < 500) leakFreqMonths = 6;
    else if (co2EquivalentTon >= 500) leakFreqMonths = 3;

    if (hasLeakDetection) leakFreqMonths = Math.ceil(leakFreqMonths / 2);

    rules.push({
      label: co2EquivalentTon >= 5
        ? `Verplichte ${leakFreqMonths === 12 ? 'jaarlijkse' : leakFreqMonths === 6 ? 'halfjaarlijkse' : 'driemaandelijkse'} lekdichtheidscontrole`
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
