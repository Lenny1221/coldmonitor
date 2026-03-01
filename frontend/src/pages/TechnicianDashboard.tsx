import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, alertsApi } from '../services/api';
import { ResolveAlertModal } from '../components/ResolveAlertModal';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

const TechnicianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [resolveAlert, setResolveAlert] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertFilter, setAlertFilter] = useState<'all' | 'active' | 'resolved'>('active');

  useEffect(() => {
    fetchDashboard();
  }, [alertFilter]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getTechnicianDashboard();
      setData(response);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Dashboard laden mislukt');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'HIGH_TEMP':
      case 'LOW_TEMP':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'POWER_LOSS':
      case 'SENSOR_ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'HIGH_TEMP':
      case 'LOW_TEMP':
        return 'bg-orange-50 border-orange-200';
      case 'POWER_LOSS':
      case 'SENSOR_ERROR':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredAlerts = data?.alerts?.filter((alert: any) => {
    if (alertFilter === 'active') return alert.status === 'ACTIVE';
    if (alertFilter === 'resolved') return alert.status === 'RESOLVED';
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Dashboard laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-frost-100">Technicus overzicht</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
          Overzicht van al uw klanten en hun monitorsystemen
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <div className="text-sm font-medium text-gray-500 dark:text-slate-300">Totaal klanten</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-frost-100">
            {data?.summary?.totalCustomers || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <div className="text-sm font-medium text-gray-500 dark:text-slate-300">Actieve alarmen</div>
          <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
            {data?.summary?.totalAlarms || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <div className="text-sm font-medium text-gray-500 dark:text-slate-300">Totaal koelcellen</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-frost-100">
            {data?.customers?.reduce((sum: number, c: any) => sum + (c.totalCells || 0), 0) || 0}
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100 mb-4">Klanten</h2>
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow overflow-x-auto w-full border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <table className="w-full min-w-full table-fixed divide-y divide-gray-200 dark:divide-frost-600">
            <thead className="bg-gray-50 dark:bg-frost-850">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-frost-400 uppercase tracking-wider">
                  Bedrijf
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-frost-400 uppercase tracking-wider">
                  Contactpersoon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-frost-400 uppercase tracking-wider">
                  Locaties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-frost-400 uppercase tracking-wider">
                  Koelcellen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-frost-400 uppercase tracking-wider">
                  Actieve alarmen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-frost-400 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-frost-800 divide-y divide-gray-200 dark:divide-frost-600">
              {data?.customers?.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-frost-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-frost-100">{customer.companyName}</div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-frost-100">{customer.contactName}</div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-frost-100">
                    {customer.totalLocations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-frost-100">
                    {customer.totalCells}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.activeAlarms > 0 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {customer.activeAlarms}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        0
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Bekijken
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.customers || data.customers.length === 0) && (
            <div className="text-center py-12 text-gray-500 dark:text-frost-400">
              Nog geen klanten gekoppeld
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100">Alarmen</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setAlertFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                alertFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-frost-700 text-gray-700 dark:text-frost-300 hover:bg-gray-200 dark:hover:bg-frost-600'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setAlertFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                alertFilter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-frost-700 text-gray-700 dark:text-frost-300 hover:bg-gray-200 dark:hover:bg-frost-600'
              }`}
            >
              Actief
            </button>
            <button
              onClick={() => setAlertFilter('resolved')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                alertFilter === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-frost-700 text-gray-700 dark:text-frost-300 hover:bg-gray-200 dark:hover:bg-frost-600'
              }`}
            >
              Opgelost
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {filteredAlerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg shadow border-2 ${getAlertColor(alert.type)} p-4`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-frost-100">
                      {alert.type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{alert.coldCell?.location?.customer?.companyName}</span>
                      {' - '}
                      {alert.coldCell?.location?.locationName} - {alert.coldCell?.name}
                    </div>
                    {alert.value && (
                    <div className="text-sm text-gray-600 dark:text-frost-400 mt-1">
                      Temperatuur: {alert.value}°C (Drempel: {alert.threshold}°C)
                    </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-frost-500 mt-1">
                      Getriggerd: {new Date(alert.triggeredAt).toLocaleString('nl-BE')}
                    </div>
                  </div>
                </div>
                {alert.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      const requireReason = alert.coldCell?.requireResolutionReason !== false;
                      if (requireReason) {
                        setResolveAlert(alert);
                      } else {
                        alertsApi.resolve(alert.id).then(() => fetchDashboard());
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    Oplossen
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredAlerts.length === 0 && (
            <div className="bg-white dark:bg-frost-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 dark:text-frost-400">Geen alarmen gevonden</p>
            </div>
          )}
        </div>
      </div>

      {resolveAlert && (
        <ResolveAlertModal
          alertType={resolveAlert.type || 'HIGH_TEMP'}
          alertTitle={
            resolveAlert.type === 'POWER_LOSS'
              ? 'Stroomuitval'
              : resolveAlert.type?.replace('_', ' ') ?? 'Alarm'
          }
          onResolve={async (reason) => {
            await alertsApi.resolve(resolveAlert.id, reason);
            setResolveAlert(null);
            fetchDashboard();
          }}
          onClose={() => setResolveAlert(null)}
        />
      )}
    </div>
  );
};

export default TechnicianDashboard;
