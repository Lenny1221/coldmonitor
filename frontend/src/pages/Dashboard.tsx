import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, invitationsApi, customersApi, alertsApi } from '../services/api';
import { ResolveAlertModal } from '../components/ResolveAlertModal';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CubeIcon,
  MapPinIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

interface ColdCell {
  id: string;
  name: string;
  type: string;
  status: 'OK' | 'WARNING' | 'ALARM';
  currentTemperature: number | null;
  lastReadingAt: string | null;
  location?: {
    id: string;
    locationName: string;
    address?: string | null;
  };
}

type DashboardView = 'koelcellen' | 'alarmen' | 'technicus';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setPendingInvitationsCount] = useState(0);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>('koelcellen');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [alarms, setAlarms] = useState<any[]>([]);
  const [resolveAlert, setResolveAlert] = useState<any | null>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    fetchDashboard();
    if (user?.role === 'CUSTOMER') {
      fetchPendingInvitations();
      fetchAlarms();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'CUSTOMER') return;
    const intervalId = setInterval(() => {
      fetchDashboard(true);
      fetchPendingInvitations();
      fetchAlarms();
    }, 20000);
    return () => clearInterval(intervalId);
  }, [user?.role]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user?.role === 'CUSTOMER') {
        fetchDashboard(true);
        fetchPendingInvitations();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.role]);

  const fetchAlarms = async () => {
    try {
      const data = await alertsApi.getAll();
      const all = Array.isArray(data) ? data : [];
      setAlarms(all.filter((a: any) => a.status === 'ACTIVE' || a.status === 'ESCALATING'));
    } catch {
      setAlarms([]);
    }
  };

  const getAlarmIcon = (type: string) => {
    switch (type) {
      case 'POWER_LOSS':
      case 'WIFI_LOSS':
      case 'SENSOR_ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    }
  };

  const getAlarmBorder = (type: string) => {
    switch (type) {
      case 'POWER_LOSS':
      case 'WIFI_LOSS':
      case 'SENSOR_ERROR':
        return 'border-l-red-500';
      case 'DOOR_OPEN':
        return 'border-l-amber-500';
      default:
        return 'border-l-orange-500';
    }
  };

  const getAlarmTitle = (type: string) => {
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

  const fetchPendingInvitations = async () => {
    try {
      const invitations = await invitationsApi.getAll();
      const pending = invitations.filter((inv: any) => inv.status === 'PENDING');
      setPendingInvitationsCount(pending.length);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  const handleUnlinkTechnician = async () => {
    if (!confirm('Weet je zeker dat je de koppeling met je technicus wilt verbreken?')) return;
    try {
      await customersApi.unlinkTechnician();
      await fetchDashboard();
      setShowUnlinkModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ontkoppelen mislukt');
    }
  };

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      let response;
      if (user?.role === 'CUSTOMER') {
        response = await dashboardApi.getCustomerDashboard();
      } else if (user?.role === 'TECHNICIAN') {
        response = await dashboardApi.getTechnicianDashboard();
        navigate('/technician');
        return;
      } else {
        setError('Geen toegang');
        return;
      }
      setData(response);
    } catch (err: any) {
      if (!silent) {
        const msg = err.response?.data?.error ?? err.response?.data?.message;
        setError(typeof msg === 'string' ? msg : 'Dashboard laden mislukt');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'OK':
        return 'bg-green-500';
      case 'WARNING':
        return 'bg-orange-500';
      case 'ALARM':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Bepaal de effectieve status op basis van actieve alarms,
  // zodat het lampje klopt ook als cell.status nog niet bijgewerkt is.
  const getCellEffectiveStatus = (cell: ColdCell): string => {
    const cellAlarms = alarms.filter((a: any) => a.coldCellId === cell.id);
    if (cellAlarms.length === 0) return cell.status;
    const criticalTypes = ['POWER_LOSS', 'WIFI_LOSS', 'SENSOR_ERROR'];
    const hasCritical = cellAlarms.some((a: any) => criticalTypes.includes(a.type));
    return hasCritical ? 'ALARM' : 'WARNING';
  };

  const coldCells = data?.summary?.coldCells || [];
  const activeAlarms = data?.summary?.activeAlarms ?? 0;
  const technician = data?.customer?.linkedTechnician;

  const locations = Array.from(
    new Set(coldCells.map((c: ColdCell) => c.location?.locationName).filter(Boolean))
  ) as string[];

  const filteredCells =
    locationFilter === 'all'
      ? coldCells
      : coldCells.filter((c: ColdCell) => c.location?.locationName === locationFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-lg text-gray-900 dark:text-frost-100">Dashboard laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-full bg-[#ddeeff] dark:bg-frost-950 overflow-x-hidden">
      {/* Boog – wit, breed, volledig ronde onderkant */}
      <div
        className="bg-white dark:bg-frost-800 pt-4 px-8 sm:px-10"
        style={{
          marginLeft: '-5%',
          marginRight: '-5%',
          paddingBottom: '3.5rem',
          borderRadius: '0 0 50% 50% / 0 0 3.5rem 3.5rem',
        }}
      >
        <div className="flex justify-around gap-2">
          <button
            onClick={() => setActiveView('koelcellen')}
            className="flex flex-col items-center flex-1 max-w-[110px]"
          >
            <span className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${
              activeView === 'koelcellen' ? 'text-[#0066cc] dark:text-[#00c8ff]' : 'text-gray-500 dark:text-slate-400'
            }`}>
              Koelcellen
            </span>
            <div
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                activeView === 'koelcellen'
                  ? 'bg-[#0066cc] border-[#0066cc] dark:bg-[#0052a3] dark:border-[#0052a3]'
                  : 'bg-white dark:bg-frost-800 border-[#0066cc]/40 dark:border-[#00c8ff]/30'
              }`}
            >
              <CubeIcon
                className={`h-8 w-8 ${activeView === 'koelcellen' ? 'text-white' : 'text-[#0066cc] dark:text-[#00c8ff]'}`}
              />
            </div>
          </button>

          <button
            onClick={() => setActiveView('alarmen')}
            className="flex flex-col items-center flex-1 max-w-[110px]"
          >
            <span className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${
              activeView === 'alarmen' ? 'text-[#0066cc] dark:text-[#00c8ff]' : 'text-gray-500 dark:text-slate-400'
            }`}>
              Alarmen
            </span>
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                  activeView === 'alarmen'
                    ? 'bg-[#0066cc] border-[#0066cc] dark:bg-[#0052a3] dark:border-[#0052a3]'
                    : 'bg-white dark:bg-frost-800 border-[#0066cc]/40 dark:border-[#00c8ff]/30'
                }`}
              >
                <ExclamationTriangleIcon
                  className={`h-8 w-8 ${activeView === 'alarmen' ? 'text-white' : 'text-[#0066cc] dark:text-[#00c8ff]'}`}
                />
              </div>
              {activeAlarms > 0 && (
                <span className="absolute -bottom-1 -right-1 min-w-[22px] h-[22px] rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center px-1">
                  {activeAlarms}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveView('technicus')}
            className="flex flex-col items-center flex-1 max-w-[110px]"
          >
            <span className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${
              activeView === 'technicus' ? 'text-[#0066cc] dark:text-[#00c8ff]' : 'text-gray-500 dark:text-slate-400'
            }`}>
              Technicus
            </span>
            <div
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                activeView === 'technicus'
                  ? 'bg-[#0066cc] border-[#0066cc] dark:bg-[#0052a3] dark:border-[#0052a3]'
                  : 'bg-white dark:bg-frost-800 border-[#0066cc]/40 dark:border-[#00c8ff]/30'
              }`}
            >
              <UserCircleIcon
                className={`h-8 w-8 ${activeView === 'technicus' ? 'text-white' : 'text-[#0066cc] dark:text-[#00c8ff]'}`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="min-h-screen pt-6 px-4 sm:px-6 pb-8">
        {activeView === 'koelcellen' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-frost-100">Koelingen</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Aantal koelcellen: {coldCells.length}
            </p>

            {locations.length > 1 && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setLocationFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    locationFilter === 'all'
                      ? 'bg-[#0066cc] text-white'
                      : 'bg-white dark:bg-frost-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-frost-700'
                  }`}
                >
                  Alle locaties
                </button>
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocationFilter(loc)}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      locationFilter === loc
                        ? 'bg-[#0066cc] text-white'
                        : 'bg-white dark:bg-frost-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-frost-700'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {filteredCells.map((cell: ColdCell) => (
                <button
                  key={cell.id}
                  onClick={() => navigate(`/coldcell/${cell.id}`)}
                  className="w-full text-left bg-white dark:bg-frost-800 rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 dark:border-frost-700 hover:shadow-md active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {cell.currentTemperature !== null
                        ? `${cell.currentTemperature.toFixed(1)}°`
                        : '—'}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-gray-200 dark:bg-frost-700" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-frost-100 truncate">
                      {cell.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Laatste meting:{' '}
                      {cell.lastReadingAt
                        ? new Date(cell.lastReadingAt).toLocaleString('nl-BE')
                        : '—'}
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${getStatusDot(getCellEffectiveStatus(cell))}`}
                    title={getCellEffectiveStatus(cell)}
                  />
                </button>
              ))}
            </div>

            {filteredCells.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                <CubeIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nog geen koelcellen</p>
              </div>
            )}
          </>
        )}

        {activeView === 'alarmen' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-frost-100">Alarmen</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {alarms.length === 0
                ? 'Geen actieve alarmen'
                : `${alarms.length} alarm${alarms.length !== 1 ? 'en' : ''} actief`}
            </p>

            <div className="mt-6 space-y-3">
              {alarms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircleIcon className="h-9 w-9 text-green-500" />
                  </div>
                  <p className="font-semibold text-gray-700 dark:text-frost-100">Alles in orde</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Alle systemen functioneren normaal.
                  </p>
                </div>
              ) : (
                alarms.map((alarm: any) => (
                  <div
                    key={alarm.id}
                    className={`bg-white dark:bg-frost-800 rounded-xl shadow-sm border-l-4 ${getAlarmBorder(alarm.type)} p-4 flex flex-col gap-3 ${
                      isNative && alarm.coldCellId ? 'cursor-pointer active:opacity-80' : ''
                    }`}
                    onClick={
                      isNative && alarm.coldCellId
                        ? (e) => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            navigate(`/coldcell/${alarm.coldCellId}`);
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getAlarmIcon(alarm.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-frost-100">
                          {getAlarmTitle(alarm.type)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                          {alarm.coldCell?.location?.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5" />
                              {alarm.coldCell.location.locationName}
                            </span>
                          )}
                          {alarm.coldCell?.name && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <CubeIcon className="h-3.5 w-3.5" />
                                {alarm.coldCell.name}
                              </span>
                            </>
                          )}
                        </div>
                        {alarm.value != null && alarm.type !== 'POWER_LOSS' && alarm.type !== 'WIFI_LOSS' && (
                          <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                            {alarm.value} °C{alarm.threshold != null ? ` (drempel: ${alarm.threshold} °C)` : ''}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                          {format(parseISO(alarm.triggeredAt), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className={`flex gap-2 ${isNative ? 'flex-col' : 'flex-row'}`}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await alertsApi.acknowledge(alarm.id);
                          fetchAlarms();
                        }}
                        className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium active:opacity-80"
                      >
                        Bevestigen
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const requireReason = alarm.coldCell?.requireResolutionReason !== false;
                          if (requireReason) {
                            setResolveAlert(alarm);
                          } else {
                            alertsApi.resolve(alarm.id).then(() => fetchAlarms());
                          }
                        }}
                        className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium active:opacity-80"
                      >
                        Oplossen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeView === 'technicus' && (
          <div className="py-4">
            {technician ? (
              <div className="bg-white dark:bg-frost-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-frost-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <UserCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-frost-100">
                        Jouw servicetechnicus
                      </h3>
                      <p className="text-gray-600 dark:text-slate-300 mt-1">
                        {technician.name}
                      </p>
                      {technician.companyName && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                          {technician.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUnlinkModal(true)}
                    className="text-red-600 dark:text-red-400 text-sm font-medium shrink-0"
                  >
                    Ontkoppelen
                  </button>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  {technician.phone && (
                    <button
                      onClick={() => window.open(`tel:${technician.phone}`, '_system')}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium active:opacity-70"
                    >
                      <PhoneIcon className="h-5 w-5" />
                      Bellen
                    </button>
                  )}
                  {technician.email && (
                    <button
                      onClick={() => window.open(`mailto:${technician.email}`, '_system')}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium active:opacity-70"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                      E-mail
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                <UserCircleIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nog geen technicus gekoppeld</p>
                <p className="text-sm mt-2">
                  Vraag een uitnodiging aan je technicus om te koppelen.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {resolveAlert && (
        <ResolveAlertModal
          alertType={resolveAlert.type || 'HIGH_TEMP'}
          alertTitle={getAlarmTitle(resolveAlert.type)}
          onResolve={async (reason) => {
            await alertsApi.resolve(resolveAlert.id, reason);
            setResolveAlert(null);
            fetchAlarms();
          }}
          onClose={() => setResolveAlert(null)}
        />
      )}

      {/* Unlink modal */}
      {showUnlinkModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowUnlinkModal(false)}
        >
          <div
            className="bg-white dark:bg-frost-800 rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-frost-100">
                  Technicus ontkoppelen
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">
                  Weet je zeker dat je de koppeling wilt verbreken met {technician?.name}?
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUnlinkModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-frost-600 text-gray-700 dark:text-slate-300 font-medium"
              >
                Annuleren
              </button>
              <button
                onClick={handleUnlinkTechnician}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium inline-flex items-center justify-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Ontkoppelen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
