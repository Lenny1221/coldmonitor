import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { coldCellsApi, readingsApi, alertsApi, devicesApi } from '../services/api';
import { useDoorStateSSE } from '../hooks/useDoorStateSSE';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeftIcon,
  MapPinIcon,
  FireIcon,
  CloudIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CpuChipIcon,
  LinkIcon,
  PlusCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { AddLoggerModal } from '../components/AddLoggerModal';
import { ColdCellSettingsModal } from '../components/ColdCellSettingsModal';

type TimeRange = '24h' | '7d' | '30d';

const ColdCellDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTechnician = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';
  const [coldCell, setColdCell] = useState<any>(null);
  const { doorState: liveDoorState, isLive: doorStateLive, error: doorStateError, reconnect: doorStateReconnect } = useDoorStateSSE(id ?? undefined);
  const [readingsResult, setReadingsResult] = useState<{ stats?: any; data?: any[] }>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [showAddLogger, setShowAddLogger] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [doorEvents, setDoorEvents] = useState<{ eventsPerDay: Array<{ date: string; opens: number; closes: number; total: number }>; totalEvents: number } | null>(null);
  const [rs485Status, setRs485Status] = useState<{ rs485Temperature: number | null; deviceOnline: boolean; lastUpdate: string | null } | null>(null);
  const [defrostLoading, setDefrostLoading] = useState(false);
  const [pushDoorLoading, setPushDoorLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchColdCell();
      fetchAlerts();
    } else {
      setLoading(false);
      setColdCell(null);
      setErrorStatus(null);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReadings();
      fetchDoorEvents();
      fetchRS485Status();
    }
  }, [id, timeRange]);

  const fetchDoorEvents = async () => {
    if (!id) return;
    try {
      const result = await readingsApi.getDoorEvents(id, 1); // Last 1 day
      setDoorEvents(result);
    } catch (error) {
      console.error('Failed to fetch door events:', error);
    }
  };

  const fetchRS485Status = async () => {
    if (!id) return;
    try {
      const result = await devicesApi.getRS485Status(id);
      setRs485Status(result);
    } catch (error) {
      console.error('Failed to fetch RS485 status:', error);
    }
  };

  const handleStartDefrost = async () => {
    if (!id || !coldCell?.devices || coldCell.devices.length === 0) {
      alert('Geen online device gevonden voor deze cold cell');
      return;
    }

    const device = coldCell.devices[0]; // Use first device
    setDefrostLoading(true);
    try {
      await devicesApi.sendCommand(device.id, 'DEFROST_START');
      alert('Ontdooiing gestart! De ESP32 zal het commando binnenkort uitvoeren.');
      // Refresh RS485 status after a delay
      setTimeout(() => {
        fetchRS485Status();
      }, 2000);
    } catch (error: any) {
      alert('Fout bij starten ontdooiing: ' + (error.response?.data?.error || error.message));
    } finally {
      setDefrostLoading(false);
    }
  };

  // Automatisch vernieuwen: cold cell + deur-events elke 5s (live weergave), rest elke 20s
  useEffect(() => {
    if (!id) return;
    const fastInterval = setInterval(() => {
      fetchColdCell(); // Deurstatus + DeviceState
      fetchDoorEvents(); // Teller "Vandaag X× open / Y× dicht"
    }, 5000);
    const slowInterval = setInterval(() => {
      fetchReadings();
      fetchAlerts();
      fetchDoorEvents();
      fetchRS485Status();
    }, 20000);
    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, [id]);

  // Bij terugkeer naar tab direct verversen (browsers vertragen timers in achtergrond tot ~10 min)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && id) {
        fetchColdCell();
        fetchReadings();
        fetchAlerts();
        fetchDoorEvents();
        fetchRS485Status();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [id]);

  const fetchColdCell = async () => {
    setErrorStatus(null);
    try {
      const data = await coldCellsApi.getById(id!);
      setColdCell(data);
    } catch (error: any) {
      console.error('Failed to fetch cold cell:', error);
      const status = error?.response?.status;
      setErrorStatus(status ?? null);
      setColdCell(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async () => {
    try {
      const result = await readingsApi.getByColdCell(id!, { range: timeRange });
      setReadingsResult(result || {});
    } catch (error) {
      console.error('Failed to fetch readings:', error);
      setReadingsResult({});
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await alertsApi.getAll({ status: 'ACTIVE' });
      const cellAlerts = (data?.alerts || data || []).filter(
        (a: any) => a.coldCellId === id || a.coldCell?.id === id
      );
      setAlerts(Array.isArray(cellAlerts) ? cellAlerts : []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  // latestReading wordt elke 5s bijgewerkt; liveDoorState = realtime via SSE
  const latestReading = coldCell?.latestReading;
  const displayDoorState = liveDoorState?.doorState ?? coldCell?.doorState?.doorState ?? (latestReading?.doorStatus === true ? 'OPEN' : latestReading?.doorStatus === false ? 'CLOSED' : null);
  const displayDoorChangedAt = liveDoorState?.doorLastChangedAt ?? coldCell?.doorState?.doorLastChangedAt ?? latestReading?.recordedAt;
  const doorStatsToday = liveDoorState?.doorStatsToday ?? coldCell?.doorStatsToday ?? { opens: 0, closes: 0, totalOpenSeconds: 0 };
  const todayOpens = doorStatsToday.opens ?? 0;
  const todayCloses = doorStatsToday.closes ?? 0;
  const readingsData = readingsResult?.data || [];
  const minTh = coldCell?.temperatureMinThreshold ?? 0;
  const maxTh = coldCell?.temperatureMaxThreshold ?? 10;

  const chartData = readingsData
    .map((r: any) => {
      const temp = r.temperature ?? r.temp;
      const humidity = r.humidity;
      const time = r.timestamp ?? r.recordedAt ?? r.time;
      const t = typeof time === 'string' ? time : new Date(time).toISOString();
      const isExceedance =
        temp != null && (temp > maxTh || temp < minTh);
      return {
        time: t,
        timeLabel: format(parseISO(t), timeRange === '24h' ? 'HH:mm' : timeRange === '7d' ? 'EEE HH:mm' : 'dd/MM HH:mm'),
        temperature: temp,
        humidity: humidity,
        minThreshold: minTh,
        maxThreshold: maxTh,
        isExceedance: !!isExceedance,
        temperatureExceedance: isExceedance ? temp : null,
      };
    })
    .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  if (!coldCell) {
    const isForbidden = errorStatus === 403;
    const isUnauthorized = errorStatus === 401;
    const isNotFound = errorStatus === 404;
    let message = 'Cold cell niet gevonden. Controleer de link of ga terug.';
    if (isForbidden) {
      message = 'Geen toegang tot deze cold cell. Alleen de gekoppelde klant of technicus kan deze cel bekijken.';
    } else if (isUnauthorized) {
      message = 'Sessie verlopen. Log opnieuw in om door te gaan.';
    } else if (isNotFound) {
      message = 'Cold cell niet gevonden. De cel bestaat niet (meer) of de link is onjuist.';
    } else if (errorStatus != null) {
      message = 'Kon cold cell niet laden. Probeer later opnieuw of ga naar het overzicht.';
    }
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-medium">{message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Terug
            </button>
            <button
              type="button"
              onClick={() => navigate('/coldcells')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Naar overzicht cold cells
            </button>
            {isUnauthorized && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
              >
                Naar inloggen
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const customer = coldCell?.location?.customer;
  const devices = coldCell?.devices ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="Terug"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          {isTechnician && customer && (
            <button
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
              aria-label="Terug naar klant"
            >
              <LinkIcon className="h-5 w-5 mr-2" />
              Terug naar klant
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{coldCell.name}</h1>
          <p className="text-sm text-gray-600 capitalize">{coldCell.type}</p>
          {coldCell.location && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPinIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {coldCell.location.locationName}
              {coldCell.location.address && ` · ${coldCell.location.address}`}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-600 hover:text-gray-900"
          aria-label="Alarminstellingen"
          title="Alarminstellingen"
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </div>

      {showSettings && (
        <ColdCellSettingsModal
          coldCellId={id!}
          coldCellName={coldCell.name}
          minTemp={coldCell.temperatureMinThreshold ?? -25}
          maxTemp={coldCell.temperatureMaxThreshold ?? -15}
          doorAlarmDelaySeconds={coldCell.doorAlarmDelaySeconds ?? 300}
          onClose={() => setShowSettings(false)}
          onSuccess={() => {
            fetchColdCell();
          }}
        />
      )}

      {/* Technicus: klantinformatie */}
      {isTechnician && customer && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2 text-blue-600" />
            Klant
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bedrijf</div>
              <div className="text-lg font-semibold text-gray-900">{customer.companyName}</div>
            </div>
            {customer.contactName && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</div>
                <div className="text-gray-900">{customer.contactName}</div>
              </div>
            )}
            {customer.email && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">E-mail</div>
                <div className="text-gray-900">{customer.email}</div>
              </div>
            )}
            {customer.phone && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefoon</div>
                <div className="text-gray-900">{customer.phone}</div>
              </div>
            )}
            {customer.address && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adres</div>
                <div className="text-gray-900">{customer.address}</div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Volledige klantgegevens
            </button>
          </div>
        </div>
      )}

      {/* Loggers in deze cel */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CpuChipIcon className="h-6 w-6 mr-2 text-gray-600" />
            Loggers in deze cel
          </h2>
          <button
            onClick={() => setShowAddLogger(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Logger toevoegen
          </button>
        </div>
        {devices.length > 0 ? (
          <div className="overflow-x-auto table-scroll">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serienummer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Laatst gezien</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Firmware</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {devices.map((device: any) => (
                  <tr key={device.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{device.serialNumber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          device.status === 'ONLINE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {device.status === 'ONLINE' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {device.lastSeenAt
                        ? format(parseISO(device.lastSeenAt), 'dd/MM/yyyy HH:mm')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{device.firmwareVersion ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Nog geen loggers gekoppeld.</p>
            <p className="text-xs text-gray-500 mt-1">Klik op &quot;Logger toevoegen&quot; om je eerste logger te koppelen.</p>
          </div>
        )}
      </div>

      {showAddLogger && (
        <AddLoggerModal
          coldCellId={id!}
          coldCellName={coldCell.name}
          onClose={() => setShowAddLogger(false)}
          onSuccess={() => {
            fetchColdCell();
          }}
        />
      )}

      {/* Huidige status: alleen sensoren die data hebben, stroom altijd Actief */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Huidige status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestReading?.temperature != null && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center text-gray-600 mb-1">
                <FireIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Temperatuur</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {Number(latestReading.temperature).toFixed(1)} °C
              </div>
            </div>
          )}
          {latestReading?.humidity != null && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center text-gray-600 mb-1">
                <CloudIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Luchtvochtigheid</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {Number(latestReading.humidity).toFixed(0)} %
              </div>
            </div>
          )}
          {/* Deur altijd tonen wanneer er devices zijn (live-deur); anders alleen als er data is */}
          {(coldCell?.devices?.length > 0 || displayDoorState != null || latestReading?.doorStatus != null) && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-gray-600 mb-1">
                <div className="flex items-center">
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Deur</span>
                </div>
                <div className="flex items-center gap-2">
                  {doorStateLive ? (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Live</span>
                  ) : doorStateError ? (
                    <button
                      type="button"
                      onClick={doorStateReconnect}
                      className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded hover:bg-amber-100"
                      title="Verbind opnieuw voor live updates"
                    >
                      Opnieuw verbinden
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Verbinden…</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {displayDoorState === 'OPEN' ? (
                  <>
                    <span className="text-amber-600 font-semibold">Open</span>
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                  </>
                ) : displayDoorState === 'CLOSED' ? (
                  <>
                    <span className="text-green-600 font-semibold">Gesloten</span>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </>
                ) : (
                  <span className="text-gray-500 font-medium">Geen data</span>
                )}
              </div>
              {displayDoorChangedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Laatste wijziging: {format(parseISO(displayDoorChangedAt), 'dd/MM HH:mm')}
                </p>
              )}
              {(liveDoorState || coldCell?.doorState || todayOpens > 0 || todayCloses > 0) && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Vandaag: {todayOpens}× open / {todayCloses}× dicht
                </p>
              )}
              {isTechnician && coldCell?.devices?.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    disabled={pushDoorLoading}
                    onClick={async () => {
                      if (!id) return;
                      setPushDoorLoading(true);
                      try {
                        await coldCellStateApi.pushDoor(id, 'OPEN');
                        fetchColdCell();
                        fetchDoorEvents();
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setPushDoorLoading(false);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                  >
                    Push Open
                  </button>
                  <button
                    type="button"
                    disabled={pushDoorLoading}
                    onClick={async () => {
                      if (!id) return;
                      setPushDoorLoading(true);
                      try {
                        await coldCellStateApi.pushDoor(id, 'CLOSED');
                        fetchColdCell();
                        fetchDoorEvents();
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setPushDoorLoading(false);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                  >
                    Push Dicht
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <BoltIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Stroom</span>
            </div>
            {(() => {
              const devices = coldCell?.devices || [];
              const anyOnline = devices.some((d: any) => d.status === 'ONLINE');
              const lastSeen = devices
                .filter((d: any) => d.lastSeenAt)
                .map((d: any) => new Date(d.lastSeenAt).getTime())
                .sort((a: number, b: number) => b - a)[0];
              return (
                <>
                  <div className="flex items-center gap-2">
                    {anyOnline ? (
                      <>
                        <span className="text-green-600 font-semibold">Actief</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </>
                    ) : (
                      <>
                        <span className="text-amber-600 font-semibold">Niet actief</span>
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                      </>
                    )}
                  </div>
                  {lastSeen && (
                    <p className="text-xs text-gray-500 mt-1">
                      Laatst gezien: {format(new Date(lastSeen), 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Ondergrens:</span>{' '}
            {coldCell.temperatureMinThreshold} °C
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Bovengrens:</span>{' '}
            {coldCell.temperatureMaxThreshold} °C
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Deur open alarm:</span>{' '}
            {(coldCell.doorAlarmDelaySeconds ?? 300) >= 60
              ? `${Math.round((coldCell.doorAlarmDelaySeconds ?? 300) / 60)} min`
              : `${coldCell.doorAlarmDelaySeconds ?? 300} s`}
          </div>
        </div>
        {latestReading?.recordedAt && (
          <p className="text-xs text-gray-400 mt-2">
            Laatste meting: {format(parseISO(latestReading.recordedAt), 'dd/MM/yyyy HH:mm')}
          </p>
        )}
      </div>

      {/* Actieve alarmen - bovenaan */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-red-600" />
            Actieve alarmen
          </h2>
          <div className="space-y-2">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-2"
              >
                <div>
                  <div className="font-semibold text-red-900">
                    {alert.type === 'POWER_LOSS'
                      ? 'Stroomuitval'
                      : alert.type?.replace('_', ' ') ?? 'Alarm'}
                  </div>
                  {alert.type === 'POWER_LOSS' ? (
                    <div className="text-sm text-red-700">Device offline – stroom niet actief</div>
                  ) : alert.value != null ? (
                    <div className="text-sm text-red-700">
                      Waarde: {alert.value} °C
                      {alert.threshold != null && ` (drempel: ${alert.threshold} °C)`}
                    </div>
                  ) : null}
                  <div className="text-xs text-red-600 mt-1">
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await alertsApi.resolve(alert.id);
                    fetchAlerts();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Oplossen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temperatuurgrafiek */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Temperatuur per cel</h2>
          <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '24h' ? 'Laatste 24 u' : range === '7d' ? '7 dagen' : '30 dagen'}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fontSize: 11 }}
                  angle={timeRange === '30d' ? -45 : 0}
                  textAnchor={timeRange === '30d' ? 'end' : 'middle'}
                  height={50}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'Temperatuur (°C)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value?.toFixed(1) ?? value} °C`, 'Temperatuur']}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <ReferenceLine
                  y={minTh}
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  name={`Ondergrens ${minTh} °C`}
                />
                <ReferenceLine
                  y={maxTh}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  name={`Bovengrens ${maxTh} °C`}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={({ payload, cx, cy }) =>
                    payload.isExceedance ? (
                      <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#b91c1c" strokeWidth={1} />
                    ) : (
                      <circle cx={cx} cy={cy} r={2} fill="#3b82f6" />
                    )
                  }
                  name="Gemeten temperatuur"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-2">
              Rode punten = overschrijding van onder- of bovengrens.
            </p>
          </>
        ) : (
          <div className="py-12 text-center text-gray-500">
            Geen temperatuurdata voor deze periode.
          </div>
        )}
      </div>

      {/* Luchtvochtigheidsgrafiek */}
      {chartData.some((d: any) => d.humidity != null) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Luchtvochtigheid per cel</h2>
            <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    timeRange === range
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range === '24h' ? 'Laatste 24 u' : range === '7d' ? '7 dagen' : '30 dagen'}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fontSize: 11 }}
                    angle={timeRange === '30d' ? -45 : 0}
                    textAnchor={timeRange === '30d' ? 'end' : 'middle'}
                    height={50}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: 'Luchtvochtigheid (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' },
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value?.toFixed(1) ?? value} %`, 'Luchtvochtigheid']}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#10b981' }}
                    name="Gemeten luchtvochtigheid"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="py-12 text-center text-gray-500">
              Geen luchtvochtigheidsdata voor deze periode.
            </div>
          )}
        </div>
      )}

      {/* Deur events per dag */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Deur events vandaag</h2>
        {doorEvents ? (
          <>
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">{doorEvents.totalEvents}</div>
              <div className="text-sm text-gray-600">Totaal aantal deur events vandaag</div>
            </div>
            {doorEvents.eventsPerDay.length > 0 ? (
              <div className="space-y-2">
                {doorEvents.eventsPerDay.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {format(parseISO(day.date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {day.opens} keer geopend · {day.closes} keer gesloten
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{day.total}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                Geen deur events vandaag.
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">Laden...</div>
        )}
      </div>

      {/* RS485 Control Tabel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">RS485 Besturing</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Functie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">RS485 Temperatuur</div>
                  <div className="text-sm text-gray-500">Carel PZD2S0P001</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {rs485Status ? (
                    <>
                      <div className="text-sm font-semibold text-gray-900">
                        {rs485Status.rs485Temperature != null
                          ? `${rs485Status.rs485Temperature.toFixed(1)} °C`
                          : 'Geen data'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rs485Status.deviceOnline ? (
                          <span className="text-green-600">Device online</span>
                        ) : (
                          <span className="text-red-600">Device offline</span>
                        )}
                        {rs485Status.lastUpdate && (
                          <> · {format(parseISO(rs485Status.lastUpdate), 'dd/MM HH:mm')}</>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">Laden...</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={handleStartDefrost}
                    disabled={defrostLoading || !rs485Status?.deviceOnline}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      defrostLoading || !rs485Status?.deviceOnline
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {defrostLoading ? 'Bezig...' : 'Start Ontdooiing'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ColdCellDetail;
