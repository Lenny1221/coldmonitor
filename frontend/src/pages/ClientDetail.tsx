import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customersApi } from '../services/api';
import {
  ArrowLeftIcon,
  DevicePhoneMobileIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  devices: Array<{
    id: string;
    deviceId: string;
    name: string;
    status: string;
    currentTemperature: number | null;
    alarms: Array<{
      id: string;
      type: string;
      status: string;
      message: string;
      triggeredAt: string;
    }>;
  }>;
}

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const data = await customersApi.getById(id!);
      setClient(data);
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
        return 'text-green-600 bg-green-100';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-100';
      case 'ALARM':
        return 'text-red-600 bg-red-100';
      case 'OFFLINE':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Client not found</p>
        <Link to="/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/clients"
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
      </div>

      {/* Client Info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{client.user.name}</dd>
              </div>
            </div>
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{client.user.email}</dd>
              </div>
            </div>
            {client.phone && (
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.address}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Devices List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Devices</h2>
            <span className="text-sm text-gray-500">{client.devices.length} device(s)</span>
          </div>
          {client.devices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temperature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alarms
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {client.devices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{device.name}</div>
                            <div className="text-sm text-gray-500">{device.deviceId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {device.currentTemperature !== null
                          ? `${device.currentTemperature}°C`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            device.status
                          )}`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {device.alarms.length > 0 ? (
                          <span className="text-red-600 font-medium">
                            {device.alarms.filter(a => a.status === 'ACTIVE').length} active
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/device/${device.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No devices found for this client.
            </div>
          )}
        </div>
      </div>

      {/* Active Alarms */}
      {client.devices.some(d => d.alarms.length > 0) && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Active Alarms</h2>
            <div className="space-y-3">
              {client.devices.flatMap(device =>
                device.alarms
                  .filter(alarm => alarm.status === 'ACTIVE')
                  .map(alarm => (
                    <div
                      key={alarm.id}
                      className="border-l-4 border-red-500 bg-red-50 p-4 rounded"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">{device.name}</p>
                          <p className="text-sm text-red-600">{alarm.message}</p>
                          <p className="text-xs text-red-500 mt-1">
                            {new Date(alarm.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-red-800">
                          {alarm.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
