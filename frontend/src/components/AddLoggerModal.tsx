import React, { useState, useCallback } from 'react';
import { XMarkIcon, SignalIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { devicesApi, getErrorMessage } from '../services/api';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

type Step = 'serial' | 'wifi' | 'waiting' | 'success' | 'error';

interface AddLoggerModalProps {
  coldCellId: string;
  coldCellName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddLoggerModal: React.FC<AddLoggerModalProps> = ({
  coldCellId,
  coldCellName,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('serial');
  const [serialNumber, setSerialNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pollForConnection = useCallback(async () => {
    const POLL_INTERVAL = 3000;
    const MAX_ATTEMPTS = 100; // 5 min
    let attempts = 0;
    const check = async () => {
      try {
        const devices = await devicesApi.getByColdCell(coldCellId);
        const device = (devices as any[]).find((d: any) => d.serialNumber === serialNumber);
        if (device?.status === 'ONLINE' || device?.lastSeenAt) {
          setStep('success');
          return true;
        }
      } catch {
        // ignore poll errors
      }
      attempts++;
      return attempts < MAX_ATTEMPTS;
    };
    const run = async () => {
      const cont = await check();
      if (cont) setTimeout(run, POLL_INTERVAL);
    };
    run();
  }, [coldCellId, serialNumber]);

  const handleAdd = async () => {
    const s = serialNumber.trim();
    if (!s) {
      setError('Voer een serienummer in.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await devicesApi.create({ serialNumber: s, coldCellId });
      setApiKey((res as any).apiKey || '');
      setStep('wifi');
      setSubmitting(false);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Kon logger niet toevoegen. Probeer opnieuw.'));
      setSubmitting(false);
    }
  };

  const handleStartWaiting = () => {
    setStep('waiting');
    pollForConnection();
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Logger toevoegen</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 px-6 py-6">
            {step === 'serial' && (
              <>
                <p className="text-sm text-gray-600">
                  Voeg een logger toe aan <strong>{coldCellName}</strong>. Voer het serienummer in dat op je logger staat.
                </p>
                <div>
                  <label htmlFor="serial" className="block text-sm font-medium text-gray-700 mb-1">
                    Serienummer
                  </label>
                  <input
                    id="serial"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="bijv. ESP32-XXXXXX"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
                )}
              </>
            )}

            {step === 'wifi' && (
              <>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                    <SignalIcon className="h-5 w-5 mr-2" />
                    WiFi-configuratie
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Sluit de stroom aan op de logger.</li>
                    <li>Wacht tot de logger een WiFi-netwerk aanmaakt (bijv. <strong>ColdMonitor-Setup</strong>).</li>
                    <li>Verbind je telefoon/laptop met dat netwerk.</li>
                    <li>Open de configuratiepagina en voer in:
                      <ul className="mt-2 ml-4 space-y-1">
                        <li><strong>API URL:</strong> <code className="text-xs bg-blue-100 px-1 rounded">{API_BASE_URL}</code></li>
                        <li><strong>API key:</strong> <code className="text-xs bg-blue-100 px-1 rounded break-all">{apiKey}</code></li>
                      </ul>
                    </li>
                    <li>Voer ook je WiFi-credentials in zodat de logger met het internet verbindt.</li>
                  </ol>
                </div>
                <p className="text-sm text-gray-600">
                  Klik hieronder als je de configuratie hebt voltooid. We wachten op de eerste verbinding.
                </p>
              </>
            )}

            {step === 'waiting' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-center font-medium text-gray-900">Wachten op verbinding met logger</p>
                <p className="mt-2 text-center text-sm text-gray-500">
                  Zorg dat de logger stroom heeft en WiFi correct is geconfigureerd.
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Wacht tot je een groene melding ziet. Sluit dit venster niet.
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-center font-semibold text-gray-900">Logger verbonden!</p>
                <p className="mt-2 text-center text-sm text-gray-600">
                  De logger stuurt nu data. Je kunt dit venster sluiten.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            {step === 'serial' && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={submitting}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Bezig...' : 'Logger toevoegen'}
                </button>
              </>
            )}
            {step === 'wifi' && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Later configureren
                </button>
                <button
                  type="button"
                  onClick={handleStartWaiting}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <SignalIcon className="h-5 w-5 mr-2" />
                  Wacht op verbinding
                </button>
              </>
            )}
            {step === 'success' && (
              <button
                type="button"
                onClick={handleDone}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sluiten
              </button>
            )}
            {step === 'waiting' && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Stoppen met wachten
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
