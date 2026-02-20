import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getResolutionReasons, type AlertType } from '../constants/resolutionReasons';

interface ResolveAlertModalProps {
  alertType: AlertType;
  alertTitle: string;
  onResolve: (reason: string) => Promise<void>;
  onClose: () => void;
}

export const ResolveAlertModal: React.FC<ResolveAlertModalProps> = ({
  alertType,
  alertTitle,
  onResolve,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = getResolutionReasons(alertType);
  const isOther = selectedReason === 'Anders';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reason = isOther ? customReason.trim() : selectedReason;
    if (!reason) return;
    setSubmitting(true);
    try {
      await onResolve(reason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Alarm oplossen</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Sluiten"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Geef een reden waarom je dit alarm oplost: <strong>{alertTitle}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reden</label>
              <div className="space-y-2">
                {reasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {isOther && (
              <div>
                <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Geef aan wat er is gebeurd
                </label>
                <input
                  id="custom-reason"
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Beschrijf de reden..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required={isOther}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedReason || (isOther && !customReason.trim())}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Bezig...' : 'Oplossen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
