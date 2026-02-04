import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { coldCellsApi, readingsApi, alertsApi } from '../services/api';
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
} from '@heroicons/react/24/outline';
import { AddLoggerModal } from '../components/AddLoggerModal';

type TimeRange = '24h' | '7d' | '30d';

const ColdCellDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTechnician = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';
  const [coldCell, setColdCell] = useState<any>(null);
  const [readingsResult, setReadingsResult] = useState<{ stats?: any; data?: any[] }>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [showAddLogger, setShowAddLogger] = useState(false);

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
    }
  }, [id, timeRange]);

  // Automatisch vernieuwen elke 20 seconden
  useEffect(() => {
    if (!id) return;
    const intervalId = setInterval(() => {
      fetchColdCell();
      fetchReadings();
      fetchAlerts();
    }, 20000);
    return () => clearInterval(intervalId);
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

  // latestReading wordt elke 20s bijgewerkt via fetchColdCell() (zelfde refresh als grafiek)
  const latestReading = coldCell?.latestReading;
  const readingsData = readingsResult?.data || [];
  const minTh = coldCell?.temperatureMinThreshold ?? 0;
  const maxTh = coldCell?.temperatureMaxThreshold ?? 10;

  const chartData = readingsData
    .map((r: any) => {
      const temp = r.temperature ?? r.temp;
      const time = r.timestamp ?? r.recordedAt ?? r.time;
      const t = typeof time === 'string' ? time : new Date(time).toISOString();
      const isExceedance =
        temp != null && (temp > maxTh || temp < minTh);
      return {
        time: t,
        timeLabel: format(parseISO(t), timeRange === '24h' ? 'HH:mm' : timeRange === '7d' ? 'EEE HH:mm' : 'dd/MM HH:mm'),
        temperature: temp,
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
      </div>

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
          {latestReading?.doorStatus != null && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center text-gray-600 mb-1">
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Deur</span>
              </div>
              <div className="flex items-center gap-2">
                {latestReading.doorStatus ? (
                  <>
                    <span className="text-amber-600 font-semibold">Open</span>
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                  </>
                ) : (
                  <>
                    <span className="text-green-600 font-semibold">Gesloten</span>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </>
                )}
              </div>
            </div>
          )}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <BoltIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Stroom</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-semibold">Actief</span>
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Ondergrens:</span>{' '}
            {coldCell.temperatureMinThreshold} °C
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Bovengrens:</span>{' '}
            {coldCell.temperatureMaxThreshold} °C
          </div>
        </div>
        {latestReading?.recordedAt && (
          <p className="text-xs text-gray-400 mt-2">
            Laatste meting: {format(parseISO(latestReading.recordedAt), 'dd/MM/yyyy HH:mm')}
          </p>
        )}
      </div>

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

      {/* Actieve alarmen */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actieve alarmen</h2>
          <div className="space-y-2">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-2"
              >
                <div>
                  <div className="font-semibold text-red-900">
                    {alert.type?.replace('_', ' ') ?? 'Alarm'}
                  </div>
                  {alert.value != null && (
                    <div className="text-sm text-red-700">
                      Waarde: {alert.value} °C
                      {alert.threshold != null && ` (drempel: ${alert.threshold} °C)`}
                    </div>
                  )}
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
    </div>
  );
};

export default ColdCellDetail;
