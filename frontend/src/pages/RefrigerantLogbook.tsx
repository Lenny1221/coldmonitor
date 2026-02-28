/**
 * Koudemiddelen Logboek – Technicus dashboard (EU 517/2014, NBN EN 378)
 */
import React, { useState, useEffect } from 'react';
import { refrigerantLogbookApi } from '../services/api';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const LOG_CATEGORIES = [
  { id: 'LEKCONTROLE', label: 'Lekcontrole' },
  { id: 'BIJVULLING', label: 'Bijvulling koudemiddel' },
  { id: 'TERUGWINNING', label: 'Terugwinning koudemiddel' },
  { id: 'ONDERHOUD_SERVICE', label: 'Onderhoud & Service' },
  { id: 'HERSTELLING_LEK', label: 'Herstelling / Lekdichting' },
  { id: 'BUITENDIENSTSTELLING', label: 'Buitendienststelling' },
  { id: 'EERSTE_INBEDRIJFSTELLING', label: 'Eerste inbedrijfstelling' },
];

const STATUS_BADGES: Record<string, { bg: string; label: string; icon: any }> = {
  IN_ORDE: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'In orde', icon: CheckCircleIcon },
  BINNENKORT: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Binnenkort', icon: ExclamationTriangleIcon },
  VERVALLEN: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Vervallen', icon: XCircleIcon },
  BIJVULVERBOD: { bg: 'bg-gray-800 text-white dark:bg-gray-700 dark:text-gray-200', label: 'Bijvulverbod', icon: XCircleIcon },
};

const RefrigerantLogbook: React.FC = () => {
  const { user } = useAuth();
  const [installations, setInstallations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInstallation, setSelectedInstallation] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    category: 'LEKCONTROLE',
    performedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    technicianName: (user?.profile as any)?.name || '',
    technicianCertNr: '',
    notes: '',
    data: {} as Record<string, any>,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInstallations();
  }, []);

  useEffect(() => {
    if (selectedInstallation) {
      fetchEntries(selectedInstallation.id);
    } else {
      setEntries([]);
    }
  }, [selectedInstallation?.id]);

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const data = await refrigerantLogbookApi.getInstallations();
      setInstallations(data || []);
    } catch (e) {
      setError(getErrorMessage(e, 'Installaties laden mislukt'));
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (id: string) => {
    try {
      const { entries: e } = await refrigerantLogbookApi.getLogEntries(id);
      setEntries(e || []);
    } catch (e) {
      setError(getErrorMessage(e, 'Logboek laden mislukt'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallation) return;
    setSubmitting(true);
    setError('');
    try {
      await refrigerantLogbookApi.addLogEntry(selectedInstallation.id, {
        category: form.category,
        performedAt: form.performedAt,
        technicianName: form.technicianName,
        technicianCertNr: form.technicianCertNr || undefined,
        notes: form.notes || undefined,
        data: getCategoryData(form.category, form.data),
      });
      setShowAddForm(false);
      setForm({
        category: 'LEKCONTROLE',
        performedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        technicianName: (user?.profile as any)?.name || '',
        technicianCertNr: '',
        notes: '',
        data: {},
      });
      await fetchEntries(selectedInstallation.id);
      await fetchInstallations();
    } catch (err) {
      setError(getErrorMessage(err, 'Registratie toevoegen mislukt'));
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryData = (category: string, data: Record<string, any>): Record<string, any> => {
    switch (category) {
      case 'LEKCONTROLE':
        return { result: data.result || 'GEEN_LEK', method: data.method || '', nextCheck: data.nextCheck };
      case 'BIJVULLING':
        return { reason: data.reason || '', amountKg: data.amountKg || 0, origin: data.origin || 'NIEUW', supplier: data.supplier || '' };
      case 'TERUGWINNING':
        return { amountKg: data.amountKg || 0, reason: data.reason || '', destination: data.destination || '' };
      case 'ONDERHOUD_SERVICE':
        return { workType: data.workType || '', findings: data.findings || '', actions: data.actions || '' };
      case 'HERSTELLING_LEK':
        return { location: data.location || '', repairMethod: data.repairMethod || '', pressureTest: data.pressureTest || false, lossKg: data.lossKg || 0 };
      case 'BUITENDIENSTSTELLING':
        return { reason: data.reason || '', recoveredKg: data.recoveredKg || 0, final: data.final || false };
      case 'EERSTE_INBEDRIJFSTELLING':
        return { initialKg: data.initialKg || 0, pressureTest: data.pressureTest || false };
      default:
        return data;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-frost-100">Koudemiddelen Logboek</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-frost-400">
          Wettelijk conform EU 517/2014, NBN EN 378, EU 2024/573
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-frost-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-frost-600">
              <h2 className="font-semibold text-gray-900 dark:text-frost-100">Installaties</h2>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-500">Laden...</div>
            ) : installations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Geen installaties. Voeg installaties toe via Onderhoud & Tickets.</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-frost-600 max-h-[500px] overflow-y-auto">
                {installations.map((i) => {
                  const badge = STATUS_BADGES[i.logbookStatus] || STATUS_BADGES.IN_ORDE;
                  const Icon = badge.icon;
                  return (
                    <button
                      key={i.id}
                      onClick={() => setSelectedInstallation(i)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-frost-700/50 transition-colors ${
                        selectedInstallation?.id === i.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-frost-100 truncate">{i.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{i.customer?.companyName}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badge.bg}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {i.refrigerantType} • {(i.co2EquivalentTon ?? 0).toFixed(2)} ton CO₂-eq
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedInstallation ? (
            <div className="bg-white dark:bg-frost-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-frost-600 flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-frost-100">{selectedInstallation.name}</h2>
                  <p className="text-sm text-gray-500">{selectedInstallation.customer?.companyName}</p>
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Registratie toevoegen
                </button>
              </div>
              {selectedInstallation.topUpBan?.banned && (
                <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-800 dark:text-red-200 text-sm">
                  ⚠️ {selectedInstallation.topUpBan.message}
                </div>
              )}
              <div className="p-4">
                <div className="text-sm text-gray-600 dark:text-frost-400 mb-4">
                  Volgende lekcontrole: {selectedInstallation.nextLeakCheckDate
                    ? format(new Date(selectedInstallation.nextLeakCheckDate), 'd MMM yyyy', { locale: nl })
                    : '—'}
                </div>
                <div className="space-y-2">
                  {entries.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-frost-850 rounded"
                    >
                      <div className="shrink-0">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {LOG_CATEGORIES.find((c) => c.id === entry.category)?.label ?? entry.category}
                        </span>
                        <div className="text-sm font-medium text-gray-900 dark:text-frost-100">
                          {format(new Date(entry.performedAt), 'd MMM yyyy HH:mm', { locale: nl })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-sm text-gray-600 dark:text-frost-400">
                        {entry.technicianName}
                        {entry.technicianCertNr && ` (${entry.technicianCertNr})`}
                        {entry.notes && <p className="mt-1">{entry.notes}</p>}
                        {entry.data && Object.keys(entry.data).length > 0 && (
                          <pre className="mt-2 text-xs text-gray-500 overflow-x-auto max-h-24 overflow-y-auto">
                            {JSON.stringify(entry.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Nog geen logboekregistraties.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-frost-800 shadow rounded-lg p-12 text-center text-gray-500">
              Selecteer een installatie om het logboek te bekijken.
            </div>
          )}
        </div>
      </div>

      {showAddForm && selectedInstallation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-frost-800 rounded-lg p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-medium mb-4">Nieuwe logboekregistratie</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Categorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                >
                  {LOG_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Datum en tijd</label>
                <input
                  type="datetime-local"
                  value={form.performedAt}
                  onChange={(e) => setForm({ ...form, performedAt: e.target.value })}
                  required
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Naam technicus</label>
                <input
                  value={form.technicianName}
                  onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
                  required
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Certificaatnummer (BRL200/STEK)</label>
                <input
                  value={form.technicianCertNr}
                  onChange={(e) => setForm({ ...form, technicianCertNr: e.target.value })}
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                />
              </div>
              {form.category === 'LEKCONTROLE' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Resultaat</label>
                  <select
                    value={form.data.result || 'GEEN_LEK'}
                    onChange={(e) => setForm({ ...form, data: { ...form.data, result: e.target.value } })}
                    className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                  >
                    <option value="GEEN_LEK">Geen lek gevonden</option>
                    <option value="LEK_GEVONDEN">Lek gevonden</option>
                  </select>
                </div>
              )}
              {form.category === 'BIJVULLING' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hoeveelheid bijgevuld (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.data.amountKg || ''}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, amountKg: parseFloat(e.target.value) || 0 } })}
                      className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Herkomst</label>
                    <select
                      value={form.data.origin || 'NIEUW'}
                      onChange={(e) => setForm({ ...form, data: { ...form.data, origin: e.target.value } })}
                      className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                    >
                      <option value="NIEUW">Nieuw</option>
                      <option value="GERECYCLEERD">Gerecycleerd</option>
                      <option value="GEREGENEREERD">Geregenereerd</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Opmerkingen</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded border-gray-300 dark:border-frost-600 dark:bg-frost-700"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Bezig...' : 'Toevoegen'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded-lg">
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefrigerantLogbook;
