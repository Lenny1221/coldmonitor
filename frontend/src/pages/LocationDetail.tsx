import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { locationsApi } from '../services/api';
import { MapPinIcon, CubeIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const LocationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const locationData = await locationsApi.getById(id);
      setLocation(locationData);
    } catch (err: any) {
      console.error('Failed to fetch location:', err);
      setError(err.response?.data?.error || 'Locatie laden mislukt');
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  const coldCells = location?.coldCells ?? [];

  const getStatusBadge = (cell: any) => {
    if (cell._count?.alerts > 0) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
          Kritiek
        </span>
      );
    }
    const latestReading = cell.devices?.[0]?.sensorReadings?.[0];
    if (latestReading) {
      const temp = latestReading.temperature;
      if (temp > cell.temperatureMaxThreshold || temp < cell.temperatureMinThreshold) {
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">
            Waarschuwing
          </span>
        );
      }
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
        Normaal
      </span>
    );
  };

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-gray-500 dark:text-slate-300">Geen locatie-ID opgegeven.</p>
        <button
          onClick={() => navigate('/locations')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Terug naar locaties
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500 dark:text-slate-300">Locatie laden...</div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error || 'Locatie niet gevonden'}</p>
        </div>
        <button
          onClick={() => navigate('/locations')}
          className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Terug naar locaties
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <button
          onClick={() => navigate('/locations')}
          className="inline-flex items-center text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:text-frost-100 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Terug naar locaties
        </button>
        <div className="flex items-start gap-3">
          <MapPinIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-frost-100">
              {location.locationName}
            </h1>
            {location.address && (
              <p className="mt-1 text-gray-600 dark:text-slate-300">{location.address}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-4">
          Koelcellen ({coldCells.length})
        </h2>

        {coldCells.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coldCells.map((cell) => {
              const latestReading = cell.devices?.[0]?.sensorReadings?.[0];
              return (
                <div
                  key={cell.id}
                  className={`bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-[rgba(100,200,255,0.08)] p-6 hover:shadow-lg dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.3)] transition-shadow ${
                    Capacitor.isNativePlatform() ? 'cursor-pointer active:opacity-90' : ''
                  }`}
                  onClick={() => Capacitor.isNativePlatform() && navigate(`/coldcell/${cell.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-frost-100">{cell.name}</h3>
                    </div>
                    {getStatusBadge(cell)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                    {latestReading ? (
                      <span>
                        Huidige temp: <strong className="text-gray-900 dark:text-frost-100">{latestReading.temperature.toFixed(1)}°C</strong>
                      </span>
                    ) : (
                      <span>Geen data</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/coldcell/${cell.id}`);
                    }}
                    className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Details bekijken
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-12 text-center border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
            <p className="text-gray-500 dark:text-slate-300">Geen koelcellen op deze locatie</p>
            <p className="text-sm text-gray-400 dark:text-slate-400 mt-2">
              Voeg een koelcel toe via het Koelcellen-menu
            </p>
            <button
              onClick={() => navigate('/coldcells')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <CubeIcon className="h-5 w-5 mr-2" />
              Ga naar koelcellen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDetail;
