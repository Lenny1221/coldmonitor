import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { alertsApi } from '../services/api';
import { ResolveAlertModal } from '../components/ResolveAlertModal';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CubeIcon,
  MapPinIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import AlarmSettingsModal from '../components/AlarmSettingsModal';

const ActiefAlarmen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveAlert, setResolveAlert] = useState<any | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data =
        user?.role === 'CUSTOMER'
          ? await alertsApi.getAll()
          : await alertsApi.getTechnicianAlerts();
      const all = Array.isArray(data) ? data : [];
      setAlerts(all.filter((a: any) => a.status === 'ACTIVE' || a.status === 'ESCALATING'));
    } catch {
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
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'POWER_LOSS':
      case 'WIFI_LOSS':
      case 'SENSOR_ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'DOOR_OPEN':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertBorder = (type: string) => {
    switch (type) {
      case 'HIGH_TEMP':
      case 'LOW_TEMP':
        return 'border-l-orange-500';
      case 'POWER_LOSS':
      case 'WIFI_LOSS':
      case 'SENSOR_ERROR':
        return 'border-l-red-500';
      case 'DOOR_OPEN':
        return 'border-l-amber-500';
      default:
        return 'border-l-gray-400';
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'POWER_LOSS': return 'Stroomuitval';
      case 'WIFI_LOSS': return 'Geen wifi signaal';
      case 'DOOR_OPEN': return 'Deur open';
      case 'HIGH_TEMP': return 'Temperatuur te hoog';
      case 'LOW_TEMP': return 'Temperatuur te laag';
      case 'SENSOR_ERROR': return 'Sensorfout';
      default: return type?.replace('_', ' ') ?? 'Alarm';
    }
  };

  return (
    <div className="min-h-full bg-[#ddeeff] dark:bg-frost-950">
      {/* Boog header */}
      <div
        className="bg-white dark:bg-frost-800 pt-4 px-8 sm:px-10"
        style={{
          marginLeft: '-5%',
          marginRight: '-5%',
          paddingBottom: '3.5rem',
          borderRadius: '0 0 50% 50% / 0 0 3.5rem 3.5rem',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-[#0066cc] dark:text-[#00c8ff] font-medium text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Terug
          </button>
          {user?.role === 'CUSTOMER' && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-frost-700"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="text-center pb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-frost-100">Actieve alarmen</h1>
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {alerts.length === 0
                ? 'Geen actieve alarmen'
                : `${alerts.length} alarm${alerts.length !== 1 ? 'en' : ''} actief`}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-6 px-4 sm:px-6 pb-8">
        {loading ? (
          <div className="text-center py-16 text-gray-500 dark:text-slate-400">
            Laden...
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
            </div>
            <p className="text-gray-700 dark:text-frost-100 font-semibold text-lg">Alles in orde</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Alle systemen functioneren normaal.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`bg-white dark:bg-frost-800 rounded-xl shadow-sm border-l-4 ${getAlertBorder(alert.type)} p-4 flex flex-col gap-3 ${
                  isNative && alert.coldCellId ? 'cursor-pointer active:opacity-80' : ''
                }`}
                onClick={
                  isNative && alert.coldCellId
                    ? (e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        navigate(`/coldcell/${alert.coldCellId}`);
                      }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-frost-100">
                      {getAlertTitle(alert.type)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {alert.coldCell?.location?.locationName && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-3.5 w-3.5" />
                          {alert.coldCell.location.locationName}
                        </span>
                      )}
                      {alert.coldCell?.name && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <CubeIcon className="h-3.5 w-3.5" />
                            {alert.coldCell.name}
                          </span>
                        </>
                      )}
                    </div>
                    {alert.value != null && alert.type !== 'POWER_LOSS' && alert.type !== 'WIFI_LOSS' && (
                      <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                        {alert.value} °C{alert.threshold != null ? ` (drempel: ${alert.threshold} °C)` : ''}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {alert.layer && (
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          alert.layer === 'LAYER_3'
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            : alert.layer === 'LAYER_2'
                              ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        }`}>
                          {alert.layer === 'LAYER_1' ? 'Laag 1' : alert.layer === 'LAYER_2' ? 'Laag 2' : 'Laag 3'}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {format(parseISO(alert.triggeredAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`flex gap-2 ${isNative ? 'flex-col' : 'flex-row'}`}>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await alertsApi.acknowledge(alert.id);
                      fetchAlerts();
                    }}
                    className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium active:opacity-80"
                  >
                    Bevestigen
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const requireReason = alert.coldCell?.requireResolutionReason !== false;
                      if (requireReason) {
                        setResolveAlert(alert);
                      } else {
                        alertsApi.resolve(alert.id).then(() => fetchAlerts());
                      }
                    }}
                    className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium active:opacity-80"
                  >
                    Oplossen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {settingsOpen && <AlarmSettingsModal onClose={() => setSettingsOpen(false)} />}
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

export default ActiefAlarmen;
