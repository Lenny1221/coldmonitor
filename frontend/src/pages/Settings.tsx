import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { customersApi } from '../services/api';
import { getErrorMessage } from '../services/api';
import { CubeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const LAYER_INFO = [
  {
    layer: 1,
    label: 'Laag 1',
    color: 'amber',
    desc: 'E-mail + push naar klant, app-alert naar technicus',
    channels: ['E-mail', 'Push / app'],
  },
  {
    layer: 2,
    label: 'Laag 2',
    color: 'orange',
    desc: 'SMS + herhaalde push/e-mail elke 5 min, backup contact, technicus SMS',
    channels: ['SMS', 'E-mail herhaling', 'Backup contact', 'Technicus SMS'],
  },
  {
    layer: 3,
    label: 'Laag 3',
    color: 'red',
    desc: 'AI-telefoonbot, backup contact gebeld, technicus gedispatcht',
    channels: ['AI-telefoon', 'Backup contact', 'Technicus dispatch'],
  },
];

interface BackupContact {
  name: string;
  phone: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [openingTime, setOpeningTime] = useState('07:00');
  const [closingTime, setClosingTime] = useState('17:00');
  const [nightStart, setNightStart] = useState('23:00');
  const [backupContacts, setBackupContacts] = useState<BackupContact[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await customersApi.getMe();
        setOpeningTime(data.openingTime ?? '07:00');
        setClosingTime(data.closingTime ?? '17:00');
        setNightStart(data.nightStart ?? '23:00');
        if (Array.isArray(data.backupContacts) && data.backupContacts.length > 0) {
          setBackupContacts(
            data.backupContacts.map((c: { name?: string; phone?: string }) => ({
              name: c.name ?? '',
              phone: c.phone ?? '',
            }))
          );
        } else if (data.backupPhone) {
          setBackupContacts([{ name: '', phone: data.backupPhone }]);
        } else {
          setBackupContacts([]);
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Kon instellingen niet laden'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddBackup = () => {
    const phone = newPhone.trim();
    if (!phone) return;
    setBackupContacts((prev) => [...prev, { name: newName.trim(), phone }]);
    setNewName('');
    setNewPhone('');
  };

  const handleRemoveBackup = (index: number) => {
    setBackupContacts((prev) => prev.filter((_, i) => i !== index));
  };

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
        backupContacts: backupContacts.filter((c) => c.phone.trim()),
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
        <CubeIcon className="h-8 w-8 text-[#00c8ff] dark:text-[#00c8ff]" />
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

          {/* Layer-uitleg */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-3">
              Escalatielagen
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
              Bij een alarm escaleren de notificaties via drie lagen. Hoe hoger de laag, hoe urgenter.
            </p>
            <div className="grid gap-3">
              {LAYER_INFO.map(({ layer, label, color, desc, channels }) => (
                <div
                  key={layer}
                  className={`p-3 rounded-lg border ${
                    color === 'amber'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'
                      : color === 'orange'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-frost-100">{label}</div>
                  <div className="text-sm text-gray-600 dark:text-slate-300 mt-0.5">{desc}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {channels.map((c) => (
                      <span
                        key={c}
                        className="text-xs px-2 py-0.5 rounded bg-white/60 dark:bg-black/20"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ul className="text-sm text-gray-600 dark:text-slate-300 list-disc list-inside mt-4 space-y-1">
              <li><strong>Open:</strong> opening → sluiting (Layer 1 eerst, daarna escalatie)</li>
              <li><strong>Na sluiting:</strong> sluiting → nacht (direct Layer 2)</li>
              <li><strong>Nacht:</strong> nacht → opening (direct Layer 3, AI-telefoon)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-4">
              Tijdsloten voor escalatie
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
              Bepaal wanneer uw bedrijf open is:
            </p>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Backup contacten
            </label>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
              Worden gebeld bij Laag 2/3 als u niet reageert
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Naam"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
              />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+32 123 45 67 89"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100"
              />
              <button
                type="button"
                onClick={handleAddBackup}
                disabled={!newPhone.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Toevoegen
              </button>
            </div>
            {backupContacts.length > 0 && (
              <ul className="space-y-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.12)] divide-y divide-gray-100 dark:divide-frost-850">
                {backupContacts.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-900 dark:text-frost-100"
                  >
                    <span>
                      {c.name ? `${c.name} – ` : ''}{c.phone}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBackup(i)}
                      className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/25"
                      aria-label="Verwijderen"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
