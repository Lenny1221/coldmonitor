import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { customersApi } from '../services/api';
import { getErrorMessage } from '../services/api';

interface AlarmSettingsModalProps {
  onClose: () => void;
}

const AlarmSettingsModal: React.FC<AlarmSettingsModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [openingTime, setOpeningTime] = useState('07:00');
  const [closingTime, setClosingTime] = useState('17:00');
  const [nightStart, setNightStart] = useState('23:00');
  const [backupPhone, setBackupPhone] = useState('');
  const [escalationConfig, setEscalationConfig] = useState<{
    OPEN_HOURS?: { layer1?: boolean; layer2?: boolean; layer3?: boolean };
    AFTER_HOURS?: { layer1?: boolean; layer2?: boolean; layer3?: boolean };
    NIGHT?: { layer1?: boolean; layer2?: boolean; layer3?: boolean };
  }>({
    OPEN_HOURS: { layer1: true, layer2: true, layer3: true },
    AFTER_HOURS: { layer1: false, layer2: true, layer3: true },
    NIGHT: { layer1: false, layer2: false, layer3: true },
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await customersApi.getMe();
        setOpeningTime(data.openingTime ?? '07:00');
        setClosingTime(data.closingTime ?? '17:00');
        setNightStart(data.nightStart ?? '23:00');
        setBackupPhone(data.backupPhone ?? '');
        setEscalationConfig(data.escalationConfig ?? {
          OPEN_HOURS: { layer1: true, layer2: true, layer3: true },
          AFTER_HOURS: { layer1: false, layer2: true, layer3: true },
          NIGHT: { layer1: false, layer2: false, layer3: true },
        });
      } catch (err) {
        setError(getErrorMessage(err, 'Kon instellingen niet laden'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await customersApi.updateSettings({
        openingTime,
        closingTime,
        nightStart,
        backupPhone: backupPhone.trim() || undefined,
        escalationConfig,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Kon instellingen niet opslaan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-frost-800 rounded-xl shadow-xl dark:shadow-[0_0_32px_rgba(0,0,0,0.4)] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-[rgba(100,200,255,0.12)]">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-[rgba(100,200,255,0.12)] bg-white dark:bg-frost-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-frost-100">
            Instellingen alarmering
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-frost-850"
            aria-label="Sluiten"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500 dark:text-slate-300">Laden...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/25 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 text-sm">
                  Instellingen opgeslagen.
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-4">
                  Tijdsloten voor escalatie
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                  Bepaal wanneer uw bedrijf open is:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Openingstijd</label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sluitingstijd</label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start nacht</label>
                    <input
                      type="time"
                      value={nightStart}
                      onChange={(e) => setNightStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-3">
                  Escalatie-flow per tijdslot
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                  Kies welke lagen actief zijn per tijdslot.
                </p>
                <div className="space-y-4">
                  {(['OPEN_HOURS', 'AFTER_HOURS', 'NIGHT'] as const).map((slot) => {
                    const labels = {
                      OPEN_HOURS: 'Open (opening → sluiting)',
                      AFTER_HOURS: 'Na sluiting (sluiting → nacht)',
                      NIGHT: 'Nacht (nacht → opening)',
                    };
                    const cfg = escalationConfig[slot] ?? {};
                    return (
                      <div
                        key={slot}
                        className="p-4 rounded-lg bg-gray-50 dark:bg-frost-850 border border-gray-200 dark:border-[rgba(100,200,255,0.12)]"
                      >
                        <div className="font-medium text-gray-900 dark:text-frost-100 mb-3">{labels[slot]}</div>
                        <div className="flex flex-wrap gap-4">
                          {([1, 2, 3] as const).map((n) => {
                            const key = `layer${n}` as 'layer1' | 'layer2' | 'layer3';
                            const checked = cfg[key] !== false;
                            return (
                              <label key={n} className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setEscalationConfig((prev) => ({
                                      ...prev,
                                      [slot]: { ...prev[slot], [key]: e.target.checked },
                                    }));
                                  }}
                                  className="rounded border-gray-300 dark:border-slate-500"
                                />
                                <span className="text-gray-700 dark:text-slate-300">Laag {n}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Backup telefoonnummer
                </label>
                <input
                  type="tel"
                  value={backupPhone}
                  onChange={(e) => setBackupPhone(e.target.value)}
                  placeholder="+32 123 45 67 89"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Wordt gebeld bij Layer 2/3 als u niet reageert
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-frost-850 hover:bg-gray-200 dark:hover:bg-frost-900"
                >
                  Sluiten
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlarmSettingsModal;
