import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { customersApi } from '../services/api';
import { getErrorMessage } from '../services/api';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [openingTime, setOpeningTime] = useState('07:00');
  const [closingTime, setClosingTime] = useState('17:00');
  const [nightStart, setNightStart] = useState('23:00');
  const [backupPhone, setBackupPhone] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await customersApi.getMe();
        setOpeningTime(data.openingTime ?? '07:00');
        setClosingTime(data.closingTime ?? '17:00');
        setNightStart(data.nightStart ?? '23:00');
        setBackupPhone(data.backupPhone ?? '');
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
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Kon instellingen niet opslaan'));
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'CUSTOMER') {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-slate-300">Deze pagina is alleen voor klanten.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600 dark:text-slate-300">Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Cog6ToothIcon className="h-8 w-8 text-[#00c8ff] dark:text-[#00c8ff]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-frost-100">Instellingen</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Openingstijden en escalatie-instellingen
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-4">
              Tijdsloten voor escalatie
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
              Bepaal wanneer uw bedrijf open is. Escalatie werkt anders per tijdslot:
            </p>
            <ul className="text-sm text-gray-600 dark:text-slate-300 list-disc list-inside mb-4 space-y-1">
              <li><strong>Open:</strong> opening → sluiting (Layer 1 eerst, daarna escalatie)</li>
              <li><strong>Na sluiting:</strong> sluiting → nacht (direct Layer 2)</li>
              <li><strong>Nacht:</strong> nacht → opening (direct Layer 3, AI-telefoon)</li>
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Openingstijd
                </label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Sluitingstijd
                </label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Start nacht
                </label>
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

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
