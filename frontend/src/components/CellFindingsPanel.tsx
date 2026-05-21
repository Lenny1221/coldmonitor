import React, { useEffect, useState, useCallback } from 'react';
import { anomalyFindingsApi } from '../services/api';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

type TimeRange = '24h' | '7d' | '30d';

type FindingSeverity = 'NORMAL' | 'ATTENTION' | 'ALARM';

interface AnomalyFinding {
  celId: string;
  feature: string;
  huidigeWaarde: number;
  baselineGemiddelde: number | null;
  zScore: number | null;
  context: string;
  status: FindingSeverity;
  reden: string;
  aanbevolenActie: string;
  onderbouwing: string;
}

interface FindingsResponse {
  celId: string;
  baselineMode: string;
  learningActive: boolean;
  learningProgress?: { daysElapsed: number; readings: number; targetDays: number };
  summaryStatus: FindingSeverity;
  findings: AnomalyFinding[];
}

const severityStyles: Record<
  FindingSeverity,
  { badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  NORMAL: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: CheckCircleIcon,
  },
  ATTENTION: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    icon: ExclamationTriangleIcon,
  },
  ALARM: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    icon: ShieldExclamationIcon,
  },
};

const severityLabel: Record<FindingSeverity, string> = {
  NORMAL: 'Normaal',
  ATTENTION: 'Let op',
  ALARM: 'Alarm',
};

interface Props {
  coldCellId: string;
  timeRange: TimeRange;
  refreshKey?: number;
}

export const CellFindingsPanel: React.FC<Props> = ({ coldCellId, timeRange, refreshKey = 0 }) => {
  const [data, setData] = useState<FindingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFindings = useCallback(async () => {
    if (!coldCellId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await anomalyFindingsApi.getByColdCell(coldCellId, { range: timeRange });
      setData(result);
    } catch (e) {
      console.error('Findings fetch failed', e);
      setError('Bevindingen konden niet geladen worden.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [coldCellId, timeRange]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings, refreshKey]);

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-frost-800 rounded-lg shadow p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
        <p className="text-sm text-gray-500 dark:text-slate-400">Bevindingen laden…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-frost-800 rounded-lg shadow p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const learningActive = data?.learningActive ?? false;
  const findings = data?.findings ?? [];
  const progress = data?.learningProgress;

  return (
    <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100 mb-1">Bevindingen</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        Zelflerend profiel per cel — geen vaste temperatuurgrenzen als kern.
      </p>

      {learningActive && (
        <div className="flex gap-3 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-4 mb-4">
          <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-200">
              Baseline wordt opgebouwd — alleen basisalarmen actief
            </p>
            {progress && (
              <p className="text-sm text-blue-800/80 dark:text-blue-300/80 mt-1">
                {progress.daysElapsed} van ~{progress.targetDays} dagen · {progress.readings} metingen
              </p>
            )}
          </div>
        </div>
      )}

      {findings.length === 0 ? (
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 py-2">
          <CheckCircleIcon className="h-5 w-5" />
          <span className="text-sm">
            {learningActive
              ? 'Geen basisafwijkingen in de laatste meting.'
              : 'Geen afwijkingen — alles binnen normaalprofiel.'}
          </span>
        </div>
      ) : (
        <ul className="space-y-4">
          {findings.map((f, idx) => {
            const style = severityStyles[f.status] ?? severityStyles.ATTENTION;
            const Icon = style.icon;
            return (
              <li
                key={`${f.feature}-${idx}`}
                className="border border-gray-100 dark:border-frost-700 rounded-lg p-4"
              >
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.badge}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {severityLabel[f.status]}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-frost-100">{f.reden}</p>
                <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">
                  <span className="font-medium">Actie: </span>
                  {f.aanbevolenActie}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 font-mono">{f.onderbouwing}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CellFindingsPanel;
