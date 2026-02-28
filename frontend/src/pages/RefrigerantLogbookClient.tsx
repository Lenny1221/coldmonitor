/**
 * Koudemiddelen Logboek – Klant read-only (exploitant, EU 517/2014)
 */
import React, { useState, useEffect } from 'react';
import { installationsApi, refrigerantLogbookApi } from '../services/api';
import { getErrorMessage } from '../services/api';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const LOG_CATEGORY_LABELS: Record<string, string> = {
  LEKCONTROLE: 'Lekcontrole',
  BIJVULLING: 'Bijvulling koudemiddel',
  TERUGWINNING: 'Terugwinning koudemiddel',
  ONDERHOUD_SERVICE: 'Onderhoud & Service',
  HERSTELLING_LEK: 'Herstelling / Lekdichting',
  BUITENDIENSTSTELLING: 'Buitendienststelling',
  EERSTE_INBEDRIJFSTELLING: 'Eerste inbedrijfstelling',
};

const RefrigerantLogbookClient: React.FC = () => {
  const [installations, setInstallations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logData, setLogData] = useState<{ installation: any; entries: any[] } | null>(null);

  useEffect(() => {
    fetchInstallations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      refrigerantLogbookApi.getLogEntries(selectedId).then((data) => {
        setLogData({ installation: data.installation, entries: data.entries || [] });
      }).catch(() => setLogData(null));
    } else {
      setLogData(null);
    }
  }, [selectedId]);

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const data = await installationsApi.getAll();
      setInstallations(data || []);
      if (data?.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (e) {
      setError(getErrorMessage(e, 'Installaties laden mislukt'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-frost-100">Koudemiddelen Logboek</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-frost-400">
          Als exploitant bent u wettelijk verplicht dit logboek 5 jaar te bewaren (EU 517/2014, art. 7). IntelliFrost bewaart uw logboek automatisch.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
        <strong>Read-only:</strong> U kunt het logboek enkel bekijken. Wijzigingen worden uitgevoerd door uw technicus.
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Laden...</div>
      ) : installations.length === 0 ? (
        <div className="bg-white dark:bg-frost-800 rounded-lg p-12 text-center text-gray-500">
          Geen installaties gevonden.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-frost-800 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-frost-600">
                <h2 className="font-semibold text-gray-900 dark:text-frost-100">Uw installaties</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-frost-600">
                {installations.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setSelectedId(i.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-frost-700/50 ${
                      selectedId === i.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-frost-100">{i.name}</div>
                    <div className="text-xs text-gray-500">{i.refrigerantType} • {i.refrigerantKg} kg</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            {logData ? (
              <div className="bg-white dark:bg-frost-800 shadow rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-frost-600">
                  <h2 className="font-semibold text-gray-900 dark:text-frost-100">{logData.installation.name}</h2>
                  <p className="text-sm text-gray-500">
                    {logData.installation.refrigerantType} • {logData.installation.refrigerantKg} kg • {(logData.installation.co2EquivalentTon ?? 0).toFixed(2)} ton CO₂-eq
                  </p>
                </div>
                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {logData.entries.map((entry: any) => (
                    <div key={entry.id} className="p-3 rounded-lg bg-gray-50 dark:bg-frost-850">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {LOG_CATEGORY_LABELS[entry.category] ?? entry.category}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-frost-400">
                          {format(new Date(entry.performedAt), 'd MMM yyyy HH:mm', { locale: nl })}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        {entry.technicianName}
                        {entry.technicianCertNr && ` (cert. ${entry.technicianCertNr})`}
                      </div>
                      {entry.notes && <p className="text-sm text-gray-600 dark:text-frost-400 mt-1">{entry.notes}</p>}
                      {entry.data && Object.keys(entry.data).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          {Object.entries(entry.data).map(([k, v]) => (
                            <div key={k}><strong>{k}:</strong> {String(v)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {logData.entries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Nog geen logboekregistraties.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-frost-800 rounded-lg p-12 text-center text-gray-500">
                Selecteer een installatie.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RefrigerantLogbookClient;
