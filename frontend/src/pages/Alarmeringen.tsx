import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { alertsApi } from '../services/api';
import { ResolveAlertModal } from '../components/ResolveAlertModal';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CubeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import AlarmSettingsModal from '../components/AlarmSettingsModal';

type AlertFilter = 'all' | 'active' | 'resolved';

const Alarmeringen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('active');
  const [resolveAlert, setResolveAlert] = useState<any | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data =
        user?.role === 'CUSTOMER'
          ? await alertsApi.getAll()
          : await alertsApi.getTechnicianAlerts();

      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user?.role]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'HIGH_TEMP':
      case 'LOW_TEMP':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 dark:text-orange-400" />;
      case 'POWER_LOSS':
      case 'SENSOR_ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'DOOR_OPEN':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'HIGH_TEMP':
      case 'LOW_TEMP':
        return 'bg-orange-50 dark:bg-orange-900/25 border-orange-200 dark:border-orange-800/50';
      case 'POWER_LOSS':
      case 'SENSOR_ERROR':
        return 'bg-red-50 dark:bg-red-900/25 border-red-200 dark:border-red-800/50';
      case 'DOOR_OPEN':
        return 'bg-amber-50 dark:bg-amber-900/25 border-amber-200 dark:border-amber-800/50';
      default:
        return 'bg-gray-50 dark:bg-frost-850 border-gray-200 dark:border-[rgba(100,200,255,0.12)]';
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'POWER_LOSS':
        return 'Stroomuitval';
      case 'DOOR_OPEN':
        return 'Deur open';
      case 'HIGH_TEMP':
        return 'Temperatuur te hoog';
      case 'LOW_TEMP':
        return 'Temperatuur te laag';
      case 'SENSOR_ERROR':
        return 'Sensorfout';
      default:
        return type?.replace('_', ' ') ?? 'Alarm';
    }
  };

  const activeCount = alerts.filter((a: any) => a.status === 'ACTIVE' || a.status === 'ESCALATING').length;
  const resolvedCount = alerts.filter((a: any) => a.status === 'RESOLVED').length;
  const filteredAlerts =
    alertFilter === 'all'
      ? alerts
      : alertFilter === 'active'
        ? alerts.filter((a: any) => a.status === 'ACTIVE' || a.status === 'ESCALATING')
        : alerts.filter((a: any) => a.status === 'RESOLVED');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-frost-100">
            Alarmeringen
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            {user?.role === 'CUSTOMER'
              ? 'Overzicht van alarmen voor jouw koelcellen'
              : 'Overzicht van alarmen bij gekoppelde klanten'}
          </p>
        </div>
        {user?.role === 'CUSTOMER' && (
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.2)] bg-white dark:bg-frost-800 hover:bg-gray-50 dark:hover:bg-frost-850 text-gray-700 dark:text-slate-300 transition-colors"
            title="Instellingen alarmering"
          >
            <Cog6ToothIcon className="h-5 w-5 text-[#00c8ff]" />
            <span className="hidden sm:inline">Instellingen</span>
          </button>
        )}
      </div>

      {/* Samenvatting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-4 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <div className="text-sm font-medium text-gray-500 dark:text-slate-300">Actieve alarmen</div>
          <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{activeCount}</div>
        </div>
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-4 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <div className="text-sm font-medium text-gray-500 dark:text-slate-300">Opgelost</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-frost-100">
            {resolvedCount}
          </div>
        </div>
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-4 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <div className="text-sm font-medium text-gray-500 dark:text-slate-300">Totaal</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-frost-100">
            {alerts.length}
          </div>
        </div>
      </div>

      {/* Filter + Lijst */}
      <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100">Alarmoverzicht</h2>
          <div className="flex rounded-lg border border-gray-300 dark:border-[rgba(100,200,255,0.15)] p-1 bg-gray-50 dark:bg-frost-850">
            {(['active', 'resolved', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setAlertFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  alertFilter === filter
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-frost-900'
                }`}
              >
                {filter === 'active' ? 'Actief' : filter === 'resolved' ? 'Opgelost' : 'Alle'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-300">
            Alarmeringen laden...
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`rounded-lg border-2 ${getAlertColor(alert.type)} p-4 flex items-start justify-between flex-wrap gap-3`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-frost-100">
                      {getAlertTitle(alert.type)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {alert.coldCell?.location?.customer?.companyName && (
                        <span>{alert.coldCell.location.customer.companyName}</span>
                      )}
                      {alert.coldCell?.location?.locationName && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {alert.coldCell.location.locationName}
                          </span>
                        </>
                      )}
                      {alert.coldCell?.name && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            <CubeIcon className="h-3.5 w-3.5" />
                            {alert.coldCell.name}
                          </span>
                        </>
                      )}
                    </div>
                    {alert.type === 'POWER_LOSS' ? (
                      <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                        Device offline – stroom niet actief
                      </div>
                    ) : alert.value != null ? (
                      <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                        Waarde: {alert.value} °C
                        {alert.threshold != null && ` (drempel: ${alert.threshold} °C)`}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {alert.layer && (alert.status === 'ACTIVE' || alert.status === 'ESCALATING') && (
                        <span
                          title={
                            alert.layer === 'LAYER_1'
                              ? 'Laag 1: E-mail + push'
                              : alert.layer === 'LAYER_2'
                                ? 'Laag 2: SMS + backup contact'
                                : 'Laag 3: AI-telefoon + technicus'
                          }
                          className={`text-xs px-2.5 py-1 rounded font-semibold ${
                            alert.layer === 'LAYER_3'
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                              : alert.layer === 'LAYER_2'
                                ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {alert.layer === 'LAYER_1' ? 'Laag 1' : alert.layer === 'LAYER_2' ? 'Laag 2' : 'Laag 3'}
                        </span>
                      )}
                      {(alert.layer2At || alert.layer3At) && (
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {alert.layer2At && (
                            <>→ Laag 2 {format(parseISO(alert.layer2At), 'dd/MM HH:mm')}</>
                          )}
                          {alert.layer2At && alert.layer3At && ' · '}
                          {alert.layer3At && (
                            <>→ Laag 3 {format(parseISO(alert.layer3At), 'dd/MM HH:mm')}</>
                          )}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {alert.status === 'RESOLVED' && alert.resolvedAt
                          ? `Opgelost: ${format(parseISO(alert.resolvedAt), 'dd/MM/yyyy HH:mm')}`
                          : `Getriggerd: ${format(parseISO(alert.triggeredAt), 'dd/MM/yyyy HH:mm')}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {alert.coldCellId && (
                    <button
                      onClick={() => navigate(`/coldcell/${alert.coldCellId}`)}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/25 rounded-md transition-colors"
                    >
                      Bekijk cel
                    </button>
                  )}
                  {(alert.status === 'ACTIVE' || alert.status === 'ESCALATING') && (
                    <>
                      <button
                        onClick={async () => {
                          await alertsApi.acknowledge(alert.id);
                          fetchAlerts();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        Bevestigen
                      </button>
                      <button
                        onClick={() => {
                          const requireReason = alert.coldCell?.requireResolutionReason !== false;
                          if (requireReason) {
                            setResolveAlert(alert);
                          } else {
                            alertsApi.resolve(alert.id).then(() => fetchAlerts());
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                      >
                        Oplossen
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 dark:text-green-400 mb-4" />
            <p className="text-gray-500 dark:text-slate-300">
              {alertFilter === 'active'
                ? 'Geen actieve alarmen'
                : alertFilter === 'resolved'
                  ? 'Geen opgeloste alarmen'
                  : 'Geen alarmen gevonden'}
            </p>
            <p className="text-sm text-gray-400 dark:text-slate-400 mt-1">
              {alertFilter === 'active'
                ? 'Alle systemen functioneren normaal.'
                : 'Er zijn nog geen alarmen geregistreerd.'}
            </p>
          </div>
        )}
      </div>

      {settingsOpen && (
        <AlarmSettingsModal onClose={() => setSettingsOpen(false)} />
      )}

      {resolveAlert && (
        <ResolveAlertModal
          alertType={resolveAlert.type || 'HIGH_TEMP'}
          alertTitle={getAlertTitle(resolveAlert.type)}
          onResolve={async (reason) => {
            await alertsApi.resolve(resolveAlert.id, reason);
            setResolveAlert(null);
            fetchAlerts();
          }}
          onClose={() => setResolveAlert(null)}
        />
      )}
    </div>
  );
};

export default Alarmeringen;
