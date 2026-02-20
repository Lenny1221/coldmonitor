import React, { useState, useEffect } from 'react';
import { XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { coldCellsApi, getErrorMessage } from '../services/api';

const TEMP_MIN = -40;
const TEMP_MAX = 20;
const DOOR_DELAY_MIN = 1;
const DOOR_DELAY_MAX = 3600;

interface ColdCellSettingsModalProps {
  coldCellId: string;
  coldCellName: string;
  minTemp: number;
  maxTemp: number;
  doorAlarmDelaySeconds: number;
  requireResolutionReason?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ColdCellSettingsModal: React.FC<ColdCellSettingsModalProps> = ({
  coldCellId,
  coldCellName,
  minTemp,
  maxTemp,
  doorAlarmDelaySeconds,
  requireResolutionReason = true,
  onClose,
  onSuccess,
}) => {
  const [minTempVal, setMinTempVal] = useState(String(minTemp));
  const [maxTempVal, setMaxTempVal] = useState(String(maxTemp));
  const [doorDelayVal, setDoorDelayVal] = useState(String(doorAlarmDelaySeconds));
  const [doorDelayUnit, setDoorDelayUnit] = useState<'seconds' | 'minutes'>(
    doorAlarmDelaySeconds >= 60 ? 'minutes' : 'seconds'
  );
  const [requireReason, setRequireReason] = useState(requireResolutionReason);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMinTempVal(String(minTemp));
    setMaxTempVal(String(maxTemp));
    setDoorDelayVal(String(doorAlarmDelaySeconds));
    setDoorDelayUnit(doorAlarmDelaySeconds >= 60 ? 'minutes' : 'seconds');
    setRequireReason(requireResolutionReason);
  }, [minTemp, maxTemp, doorAlarmDelaySeconds, requireResolutionReason]);

  const parseDoorDelaySeconds = (): number => {
    const num = parseFloat(doorDelayVal);
    if (isNaN(num) || num <= 0) return -1;
    return doorDelayUnit === 'minutes' ? Math.round(num * 60) : Math.round(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const min = parseFloat(minTempVal);
    const max = parseFloat(maxTempVal);
    const doorSeconds = parseDoorDelaySeconds();

    if (isNaN(min) || isNaN(max)) {
      setError('Voer geldige getallen in voor temperatuur.');
      return;
    }
    if (min < TEMP_MIN || min > TEMP_MAX) {
      setError(`Min temperatuur moet tussen ${TEMP_MIN}°C en ${TEMP_MAX}°C liggen.`);
      return;
    }
    if (max < TEMP_MIN || max > TEMP_MAX) {
      setError(`Max temperatuur moet tussen ${TEMP_MIN}°C en ${TEMP_MAX}°C liggen.`);
      return;
    }
    if (min >= max) {
      setError('Min temperatuur moet lager zijn dan max temperatuur.');
      return;
    }
    if (doorSeconds < DOOR_DELAY_MIN || doorSeconds > DOOR_DELAY_MAX) {
      setError(`Deur open vertraging moet tussen ${DOOR_DELAY_MIN} en ${DOOR_DELAY_MAX} seconden liggen.`);
      return;
    }

    setSubmitting(true);
    try {
      await coldCellsApi.updateSettings(coldCellId, {
        min_temp: min,
        max_temp: max,
        door_alarm_delay_seconds: doorSeconds,
        require_resolution_reason: requireReason,
      });
      setSuccessMessage('Instellingen opgeslagen');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Kon instellingen niet opslaan. Probeer opnieuw.'));
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
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
              Alarminstellingen
            </h2>
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
            <p className="text-sm text-gray-600">{coldCellName}</p>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <div>
              <label htmlFor="min-temp" className="block text-sm font-medium text-gray-700 mb-1">
                Min temperatuur (°C)
              </label>
              <input
                id="min-temp"
                type="number"
                step="0.1"
                min={TEMP_MIN}
                max={TEMP_MAX}
                value={minTempVal}
                onChange={(e) => setMinTempVal(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="-18"
              />
              <p className="text-xs text-gray-500 mt-0.5">Range: {TEMP_MIN}°C tot {TEMP_MAX}°C</p>
            </div>

            <div>
              <label htmlFor="max-temp" className="block text-sm font-medium text-gray-700 mb-1">
                Max temperatuur (°C)
              </label>
              <input
                id="max-temp"
                type="number"
                step="0.1"
                min={TEMP_MIN}
                max={TEMP_MAX}
                value={maxTempVal}
                onChange={(e) => setMaxTempVal(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="-15"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="require-reason" className="block text-sm font-medium text-gray-700">
                Reden verplicht bij oplossen alarm
              </label>
              <input
                id="require-reason"
                type="checkbox"
                checked={requireReason}
                onChange={(e) => setRequireReason(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Bij uit: alarm direct oplossen zonder reden te kiezen
            </p>

            <div>
              <label htmlFor="door-delay" className="block text-sm font-medium text-gray-700 mb-1">
                Deur open alarm vertraging
              </label>
              <div className="flex gap-2">
                <input
                  id="door-delay"
                  type="number"
                  step={doorDelayUnit === 'minutes' ? 0.5 : 1}
                  min={doorDelayUnit === 'minutes' ? 0.5 : 1}
                  max={doorDelayUnit === 'minutes' ? 60 : 3600}
                  value={doorDelayVal}
                  onChange={(e) => setDoorDelayVal(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={doorDelayUnit}
                  onChange={(e) => setDoorDelayUnit(e.target.value as 'seconds' | 'minutes')}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="seconds">seconden</option>
                  <option value="minutes">minuten</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Alarm na hoe lang de deur open mag staan
              </p>
            </div>

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
                disabled={submitting}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
