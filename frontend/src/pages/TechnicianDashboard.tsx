import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, alertsApi } from '../services/api';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

const TechnicianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
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
      setError(err.response?.data?.error || 'Failed to load dashboard');
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
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of all your customers and their monitoring systems
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Customers</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {data?.summary?.totalCustomers || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Active Alarms</div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {data?.summary?.totalAlarms || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Cold Cells</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {data?.customers?.reduce((sum: number, c: any) => sum + (c.totalCells || 0), 0) || 0}
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Customers</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cold Cells
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Alarms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.customers?.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.companyName}</div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.contactName}</div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.totalLocations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.customers || data.customers.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              No customers assigned yet
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Alerts</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setAlertFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                alertFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAlertFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                alertFilter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setAlertFilter('resolved')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                alertFilter === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved
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
                    <div className="font-semibold text-gray-900">
                      {alert.type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{alert.coldCell?.location?.customer?.companyName}</span>
                      {' - '}
                      {alert.coldCell?.location?.locationName} - {alert.coldCell?.name}
                    </div>
                    {alert.value && (
                      <div className="text-sm text-gray-600 mt-1">
                        Temperature: {alert.value}°C (Threshold: {alert.threshold}°C)
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                {alert.status === 'ACTIVE' && (
                  <button
                    onClick={async () => {
                      await alertsApi.resolve(alert.id);
                      fetchDashboard();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredAlerts.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No alerts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
