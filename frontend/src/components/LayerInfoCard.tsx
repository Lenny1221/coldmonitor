import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

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

const LayerInfoCard: React.FC<{ showSettingsLink?: boolean }> = ({ showSettingsLink = false }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-frost-800 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.12)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-frost-850 transition-colors"
      >
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5 text-[#00c8ff]" />
          <span className="font-medium text-gray-900 dark:text-frost-100">
            Wat zijn Laag 1, 2 en 3?
          </span>
        </div>
        {expanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <p className="text-sm text-gray-600 dark:text-slate-300 pt-3">
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
          {showSettingsLink && (
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#00c8ff] hover:text-[#00a8dd]"
            >
              Escalatie-flow instellen per tijdslot →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default LayerInfoCard;
