import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { devicesApi, measurementsApi, alarmsApi, reportsApi } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface Device {
  id: string;
  deviceId: string;
  name: string;
  description?: string;
  currentTemperature: number | null;
  status: 'OK' | 'WARNING' | 'ALARM' | 'OFFLINE';
  highTemperatureThreshold: number;
  lowTemperatureThreshold: number;
  dataIntervalMinutes: number;
  lastDataReceived: string | null;
  client: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface Measurement {
  id: string;
  temperature: number;
  timestamp: string;
}

interface Alarm {
  id: string;
  type: string;
  status: string;
  message: string;
  temperature?: number;
  triggeredAt: string;
  resolvedAt?: string;
}

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDevice();
      fetchMeasurements();
      fetchAlarms();
      fetchStats();
    }

    const interval = setInterval(() => {
      if (id) {
        fetchDevice();
        fetchMeasurements();
        fetchAlarms();
        fetchStats();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [id, timeRange]);

  const fetchDevice = async () => {
    try {
      const data = await devicesApi.getById(id!);
      setDevice(data);
    } catch (error) {
      console.error('Failed to fetch device:', error);
    }
  };

  const fetchMeasurements = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const data = await measurementsApi.getByDevice(id!, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000,
      });
      
      // Sort by timestamp and format for chart
      const sortedData = [...data].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMeasurements(sortedData);
    } catch (error) {
      console.error('Failed to fetch measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlarms = async () => {
    try {
      const data = await alarmsApi.getByDevice(id!);
      setAlarms(data.slice(0, 20)); // Last 20 alarms
    } catch (error) {
      console.error('Failed to fetch alarms:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const data = await measurementsApi.getStats(id!, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Export last 30 days

      const blob = await reportsApi.getCSV(id!, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `device-${device?.deviceId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
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

  const chartData = measurements.map((m) => ({
    time: format(new Date(m.timestamp), timeRange === '24h' ? 'HH:mm' : 'MMM dd'),
    temperature: m.temperature,
    high: device?.highTemperatureThreshold,
    low: device?.lowTemperatureThreshold,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Device not found</p>
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{device.name}</h1>
            <p className="text-sm text-gray-500">{device.deviceId}</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Device Info Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Current Temp</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {device.currentTemperature !== null
                      ? `${device.currentTemperature}°C`
                      : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                  <dd className="text-lg font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        {stats && (
          <>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowPathIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Min Temp</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.min !== null ? `${stats.min}°C` : 'N/A'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowPathIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Max Temp</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.max !== null ? `${stats.max}°C` : 'N/A'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Temperature Chart */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Temperature History</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('24h')}
                className={`px-3 py-1 text-sm rounded ${
                  timeRange === '24h'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 text-sm rounded ${
                  timeRange === '7d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                7d
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 text-sm rounded ${
                  timeRange === '30d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                30d
              </button>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Temperature (°C)"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="high"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  name="High Threshold"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="low"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  name="Low Threshold"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No measurement data available for the selected time range.
            </div>
          )}
        </div>
      </div>

      {/* Alarms History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Alarm History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alarms.map((alarm) => (
                  <tr key={alarm.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(alarm.triggeredAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {alarm.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{alarm.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alarm.temperature !== null && alarm.temperature !== undefined
                        ? `${alarm.temperature}°C`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alarm.status === 'ACTIVE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {alarm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {alarms.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No alarms found for this device.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetail;
