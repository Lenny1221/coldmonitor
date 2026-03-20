import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { coldCellsApi, coldCellStateApi, readingsApi, alertsApi, devicesApi } from '../services/api';
import { useDoorStateSSE } from '../hooks/useDoorStateSSE';
import {
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
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
  Battery100Icon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  LinkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { ColdCellSettingsModal } from '../components/ColdCellSettingsModal';
import { ResolveAlertModal } from '../components/ResolveAlertModal';
import RegelaarCommandoPaneel from '../components/RegelaarCommandoPaneel';

type TimeRange = '24h' | '7d' | '30d';

const ColdCellDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isTechnician = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';
  const [coldCell, setColdCell] = useState<any>(null);
  const { doorState: liveDoorState, isLive: doorStateLive, error: doorStateError, reconnect: doorStateReconnect } = useDoorStateSSE(id ?? undefined);
  const [readingsResult, setReadingsResult] = useState<{ stats?: any; data?: any[] }>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [resolveAlert, setResolveAlert] = useState<any | null>(null);
  const [rs485Status, setRs485Status] = useState<{
    rs485Temperature: number | null;
    defrostType: number | null;
    defrostInterval: number | null;
    defrostDuration: number | null;
    deviceOnline: boolean;
    lastUpdate: string | null;
    controllerConfig?: {
      controllerType: string | null;
      controllerSlaveAddr: number | null;
      controllerBaudRate: number | null;
      deviceId: string;
    };
  } | null>(null);
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
      fetchRS485Status();
    }
  }, [id, timeRange]);

  const fetchRS485Status = async () => {
    if (!id) return;
    try {
      const result = await devicesApi.getRS485Status(id);
      setRs485Status(result);
    } catch (error) {
      console.error('Failed to fetch RS485 status:', error);
    }
  };

  // Automatisch vernieuwen: cold cell elke 5s (live weergave), rest elke 20s
  // timeRange in deps zodat fetchReadings altijd de gekozen periode gebruikt (geen verspringen bij nieuwe data)
  useEffect(() => {
    if (!id) return;
    const fastInterval = setInterval(() => {
      fetchColdCell(); // Deurstatus + DeviceState (vandaag counts via SSE/state)
    }, 5000);
    const slowInterval = setInterval(() => {
      fetchReadings();
      fetchAlerts();
      fetchRS485Status();
    }, 20000);
    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, [id, timeRange]);

  // Bij terugkeer naar tab direct verversen (browsers vertragen timers in achtergrond tot ~10 min)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && id) {
        fetchColdCell();
        fetchReadings();
        fetchAlerts();
        fetchRS485Status();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [id, timeRange]);

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

  // Deur: liveDoorState (SSE + 500ms polling) overschrijft alles – binnen ~500ms na schakelen
  const latestReading = coldCell?.latestReading;
  const displayDoorState = liveDoorState?.doorState ?? coldCell?.doorState?.doorState ?? (latestReading?.doorStatus === true ? 'OPEN' : latestReading?.doorStatus === false ? 'CLOSED' : null);
  const displayDoorChangedAt = liveDoorState?.doorLastChangedAt ?? coldCell?.doorState?.doorLastChangedAt ?? latestReading?.recordedAt;
  const doorOpenCountTotal = liveDoorState?.doorOpenCountTotal ?? coldCell?.doorState?.doorOpenCountTotal ?? 0;
  const doorCloseCountTotal = liveDoorState?.doorCloseCountTotal ?? coldCell?.doorState?.doorCloseCountTotal ?? 0;
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

  const onlineCount = devices.filter((d: any) => d.status === 'ONLINE').length;
  const offlineCount = devices.filter((d: any) => d.status !== 'ONLINE').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        {/* Naam-rij: terug | naam + status-dots | instellingen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 shrink-0 hover:bg-gray-100 dark:hover:bg-frost-850 rounded-md text-gray-700 dark:text-frost-100"
            aria-label="Terug"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-frost-100 truncate flex-1">
            {coldCell.name}
          </h1>
          {/* Logger-status */}
          {devices.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {onlineCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {onlineCount > 1 ? `${onlineCount}×` : ''} Online
                </span>
              )}
              {offlineCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-frost-850 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                  {offlineCount > 1 ? `${offlineCount}×` : ''} Offline
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 shrink-0 hover:bg-gray-100 dark:hover:bg-frost-850 rounded-md text-gray-600 dark:text-slate-300"
            aria-label="Alarminstellingen"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Subinfo */}
        <div className="pl-9">
          <p className="text-sm text-gray-600 dark:text-slate-200 capitalize">{coldCell.type}</p>
          {coldCell.location && (
            <div className="flex items-start text-sm text-gray-500 dark:text-slate-300 mt-0.5">
              <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
              <span>
                {coldCell.location.locationName}
                {coldCell.location.address && ` · ${coldCell.location.address}`}
              </span>
            </div>
          )}
          {isTechnician && customer && (
            <button
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="inline-flex items-center mt-1 text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              Terug naar klant
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <ColdCellSettingsModal
          coldCellId={id!}
          coldCellName={coldCell.name}
          minTemp={coldCell.temperatureMinThreshold ?? -25}
          maxTemp={coldCell.temperatureMaxThreshold ?? -15}
          doorAlarmDelaySeconds={coldCell.doorAlarmDelaySeconds ?? 300}
          requireResolutionReason={coldCell.requireResolutionReason !== false}
          onClose={() => setShowSettings(false)}
          onSuccess={() => {
            fetchColdCell();
          }}
        />
      )}

      {resolveAlert && (
        <ResolveAlertModal
          alertType={resolveAlert.type || 'HIGH_TEMP'}
          alertTitle={
            resolveAlert.type === 'POWER_LOSS'
              ? 'Stroomuitval'
              : resolveAlert.type === 'WIFI_LOSS'
                ? 'Geen wifi signaal meer'
                : resolveAlert.type?.replace('_', ' ') ?? 'Alarm'
          }
          onResolve={async (reason) => {
            await alertsApi.resolve(resolveAlert.id, reason);
            setResolveAlert(null);
            fetchAlerts();
          }}
          onClose={() => setResolveAlert(null)}
        />
      )}

      {/* Technicus: klantinformatie */}
      {isTechnician && customer && (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border-l-4 border-blue-500 dark:border-blue-500/80">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100 mb-4 flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
            Klant
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wide">Bedrijf</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-frost-100">{customer.companyName}</div>
            </div>
            {customer.contactName && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wide">Contactpersoon</div>
                <div className="text-gray-900 dark:text-frost-100">{customer.contactName}</div>
              </div>
            )}
            {customer.email && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wide">E-mail</div>
                <div className="text-gray-900 dark:text-frost-100">{customer.email}</div>
              </div>
            )}
            {customer.phone && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefoon</div>
                <div className="text-gray-900 dark:text-frost-100">{customer.phone}</div>
              </div>
            )}
            {customer.address && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wide">Adres</div>
                <div className="text-gray-900 dark:text-frost-100">{customer.address}</div>
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

      {/* Huidige status: alleen sensoren die data hebben, stroom altijd Actief */}
      <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100 mb-4">Huidige status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestReading?.temperature != null && (
            <div className="border border-gray-200 dark:border-[rgba(100,200,255,0.12)] rounded-lg p-4">
              <div className="flex items-center text-gray-600 dark:text-slate-300 mb-1">
                <FireIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Temperatuur</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-frost-100">
                {Number(latestReading.temperature).toFixed(1)} °C
              </div>
            </div>
          )}
          {latestReading?.humidity != null && (
            <div className="border border-gray-200 dark:border-[rgba(100,200,255,0.12)] rounded-lg p-4">
              <div className="flex items-center text-gray-600 dark:text-slate-300 mb-1">
                <CloudIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Luchtvochtigheid</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-frost-100">
                {Number(latestReading.humidity).toFixed(0)} %
              </div>
            </div>
          )}
          {/* Deur altijd tonen wanneer er devices zijn (live-deur); anders alleen als er data is */}
          {(coldCell?.devices?.length > 0 || displayDoorState != null || latestReading?.doorStatus != null) && (
            <div className="border border-gray-200 dark:border-[rgba(100,200,255,0.12)] rounded-lg p-4">
              <div className="flex items-center justify-between text-gray-600 dark:text-slate-300 mb-1">
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
                  ) : displayDoorState != null ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded" title="Polling (elke 0,5s)">Vertraagd</span>
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
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Laatste wijziging: {format(parseISO(displayDoorChangedAt), 'dd/MM HH:mm')}
                </p>
              )}
              {(liveDoorState || coldCell?.doorState || doorOpenCountTotal > 0 || doorCloseCountTotal > 0) && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Vandaag: {doorOpenCountTotal}× open / {doorCloseCountTotal}× dicht
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
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setPushDoorLoading(false);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                  >
                    Open duwen
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
          <div className="border border-gray-200 dark:border-[rgba(100,200,255,0.12)] rounded-lg p-4">
            <div className="flex items-center text-gray-600 dark:text-slate-300 mb-1">
              <BoltIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Stroom</span>
            </div>
            {(() => {
              const powerStatus = latestReading?.powerStatus;
              const hasPowerData = powerStatus !== undefined && powerStatus !== null;
              const devices = coldCell?.devices || [];
              const lastSeen = devices
                .filter((d: any) => d.lastSeenAt)
                .map((d: any) => new Date(d.lastSeenAt).getTime())
                .sort((a: number, b: number) => b - a)[0];
              return (
                <>
                  <div className="flex items-center gap-2">
                    {hasPowerData ? (
                      powerStatus ? (
                        <>
                          <span className="text-green-600 dark:text-green-400 font-semibold">Actief</span>
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        </>
                      ) : (
                        <>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Niet actief</span>
                          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                        </>
                      )
                    ) : (
                      <span className="text-gray-500 dark:text-slate-400 font-medium">Geen data</span>
                    )}
                  </div>
                  {lastSeen && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Laatst gezien: {format(new Date(lastSeen), 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
          <div className="border border-gray-200 dark:border-[rgba(100,200,255,0.12)] rounded-lg p-4">
            <div className="flex items-center text-gray-600 dark:text-slate-300 mb-1">
              <Battery100Icon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Batterij</span>
            </div>
            {(() => {
              const batLevel = latestReading?.batteryLevel;
              const charging = latestReading?.batteryCharging;
              const hasBatteryData = batLevel !== undefined && batLevel !== null;
              return (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-frost-100">
                    {hasBatteryData ? `${batLevel} %` : '—'}
                  </div>
                  {hasBatteryData && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {charging ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Aan het opladen</span>
                      ) : (
                        <span className="text-gray-500 dark:text-slate-400">Niet aan het opladen</span>
                      )}
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
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-2">
            Laatste meting: {format(parseISO(latestReading.recordedAt), 'dd/MM/yyyy HH:mm')}
          </p>
        )}
      </div>

      {/* Actieve alarmen - bovenaan */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border-l-4 border-red-500 dark:border-red-500/80 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" />
            Actieve alarmen
          </h2>
          <div className="space-y-2">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex items-center justify-between flex-wrap gap-2"
              >
                <div>
                  <div className="font-semibold text-red-900 dark:text-red-200">
                    {alert.type === 'POWER_LOSS'
                      ? 'Stroomuitval'
                      : alert.type === 'WIFI_LOSS'
                        ? 'Geen wifi signaal meer'
                        : alert.type?.replace('_', ' ') ?? 'Alarm'}
                  </div>
                  {alert.type === 'POWER_LOSS' ? (
                    <div className="text-sm text-red-700 dark:text-red-300">USB uitgetrokken – stroom uitgevallen</div>
                  ) : alert.type === 'WIFI_LOSS' ? (
                    <div className="text-sm text-red-700 dark:text-red-300">Geen wifi signaal meer – device offline</div>
                  ) : alert.value != null ? (
                    <div className="text-sm text-red-700 dark:text-red-300">
                      Waarde: {alert.value} °C
                      {alert.threshold != null && ` (drempel: ${alert.threshold} °C)`}
                    </div>
                  )                   : null}
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const requireReason = coldCell?.requireResolutionReason !== false;
                    if (requireReason) {
                      setResolveAlert(alert);
                    } else {
                      alertsApi.resolve(alert.id).then(() => fetchAlerts());
                    }
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
      <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100">Temperatuur per cel</h2>
          <div className="flex rounded-lg border border-gray-300 dark:border-[rgba(100,200,255,0.15)] p-1 bg-gray-50 dark:bg-frost-850">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-frost-900'
                }`}
              >
                {range === '24h' ? 'Laatste 24 u' : range === '7d' ? '7 dagen' : '30 dagen'}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="relative -mx-6 px-2">
            <span className="absolute top-1 left-4 text-xs font-semibold text-gray-400 dark:text-slate-500 z-10 select-none">°C</span>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 24, right: 8, left: -8, bottom: 16 }}>
                <defs>
                  <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  angle={timeRange === '30d' ? -35 : 0}
                  textAnchor={timeRange === '30d' ? 'end' : 'middle'}
                  height={36}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#9ca3af' }}
                  tickFormatter={(v) => `${v}°`}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const val = payload[0]?.value as number | undefined;
                    return (
                      <div className="bg-white dark:bg-frost-800 rounded-xl shadow-lg px-3 py-2 border border-gray-100 dark:border-frost-700">
                        <p className="text-[11px] text-gray-400 dark:text-slate-400 mb-0.5">{label}</p>
                        <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                          {val != null ? `${val.toFixed(1)} °C` : '—'}
                        </p>
                      </div>
                    );
                  }}
                />
                {minTh != null && (
                  <ReferenceLine y={minTh} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1.2} />
                )}
                {maxTh != null && (
                  <ReferenceLine y={maxTh} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.2} />
                )}
                <Area
                  type="natural"
                  dataKey="temperature"
                  fill="url(#tempFill)"
                  stroke="none"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                />
                <Line
                  type="natural"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={(props: { payload?: { isExceedance?: boolean }; cx?: number; cy?: number }) => {
                    const { payload, cx, cy } = props;
                    return payload?.isExceedance ? (
                      <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
                    ) : (
                      <circle cx={cx} cy={cy} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
                    );
                  }}
                  name="Temperatuur"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 dark:text-slate-400">
            Geen temperatuurdata voor deze periode.
          </div>
        )}
      </div>

      {/* Luchtvochtigheidsgrafiek */}
      {chartData.some((d: any) => d.humidity != null) && (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100">Luchtvochtigheid per cel</h2>
            <div className="flex rounded-lg border border-gray-300 dark:border-[rgba(100,200,255,0.15)] p-1 bg-gray-50 dark:bg-frost-850">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    timeRange === range
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-frost-900'
                  }`}
                >
                  {range === '24h' ? 'Laatste 24 u' : range === '7d' ? '7 dagen' : '30 dagen'}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="relative -mx-6 px-2">
              <span className="absolute top-1 left-4 text-xs font-semibold text-gray-400 dark:text-slate-500 z-10 select-none">%</span>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData} margin={{ top: 24, right: 8, left: -8, bottom: 16 }}>
                  <defs>
                    <linearGradient id="humidFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    angle={timeRange === '30d' ? -35 : 0}
                    textAnchor={timeRange === '30d' ? 'end' : 'middle'}
                    height={36}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#9ca3af' }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const val = payload[0]?.value as number | undefined;
                      return (
                        <div className="bg-white dark:bg-frost-800 rounded-xl shadow-lg px-3 py-2 border border-gray-100 dark:border-frost-700">
                          <p className="text-[11px] text-gray-400 dark:text-slate-400 mb-0.5">{label}</p>
                          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {val != null ? `${val.toFixed(1)} %` : '—'}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="natural"
                    dataKey="humidity"
                    fill="url(#humidFill)"
                    stroke="none"
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />
                  <Line
                    type="natural"
                    dataKey="humidity"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={(props: { cx?: number; cy?: number }) => (
                      <circle cx={props.cx} cy={props.cy} r={5} fill="#10b981" stroke="#fff" strokeWidth={1.5} />
                    )}
                    name="Luchtvochtigheid"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 dark:text-slate-400">
              Geen luchtvochtigheidsdata voor deze periode.
            </div>
          )}
        </div>
      )}

      {/* RS485 Regelaar commando-paneel */}
      <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100 mb-4">RS485 Regelaar besturing</h2>
        <RegelaarCommandoPaneel
          coldCellId={id!}
          coldCellName={coldCell.name}
          devices={devices}
          rs485Status={rs485Status}
          onRefreshRS485={fetchRS485Status}
        />
      </div>
    </div>
  );
};

export default ColdCellDetail;
