import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { techniciansApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserGroupIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  user: {
    name: string;
    email: string;
  };
  devices?: Array<{
    id: string;
    name: string;
    status: string;
    currentTemperature: number | null;
  }>;
  _count?: {
    devices: number;
  };
}

const ClientList: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    if (!user?.id || (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN')) return;
    try {
      const data = await techniciansApi.getCustomers(user.id);
      setClients(data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceStatusCounts = (devices: Client['devices']) => {
    if (!devices) return { total: 0, alarms: 0, warnings: 0, offline: 0 };
    
    return {
      total: devices.length,
      alarms: devices.filter(d => d.status === 'ALARM').length,
      warnings: devices.filter(d => d.status === 'WARNING').length,
      offline: devices.filter(d => d.status === 'OFFLINE').length,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-frost-100">Clients</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devices
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => {
                  const statusCounts = getDeviceStatusCounts(client.devices);
                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-frost-100">{client.name}</div>
                            {client.user && (
                              <div className="text-sm text-gray-500">{client.user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{client.email || client.user?.email || 'N/A'}</div>
                        {client.phone && <div>{client.phone}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DevicePhoneMobileIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-frost-100">
                            {client._count?.devices || statusCounts.total || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {statusCounts.alarms > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {statusCounts.alarms} Alarm{statusCounts.alarms !== 1 ? 's' : ''}
                            </span>
                          )}
                          {statusCounts.warnings > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {statusCounts.warnings} Warning{statusCounts.warnings !== 1 ? 's' : ''}
                            </span>
                          )}
                          {statusCounts.offline > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {statusCounts.offline} Offline
                            </span>
                          )}
                          {statusCounts.total === 0 && (
                            <span className="text-sm text-gray-400">No devices</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/clients/${client.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {clients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No clients found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientList;
