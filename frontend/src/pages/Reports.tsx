import React, { useEffect, useState } from 'react';
import { devicesApi, reportsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Device {
  id: string;
  deviceId: string;
  name: string;
  client?: {
    user: {
      name: string;
    };
  };
}

interface ReportSummary {
  device: {
    id: string;
    deviceId: string;
    name: string;
    client: string;
  };
  period: {
    start: string;
    end: string;
  };
  statistics: {
    measurementCount: number;
    minTemperature: number | null;
    maxTemperature: number | null;
    avgTemperature: number | null;
  };
  thresholds: {
    low: number;
    high: number;
  };
  alarms: {
    total: number;
    active: number;
    resolved: number;
  };
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchReport();
    }
  }, [selectedDevice, startDate, endDate]);

  const fetchDevices = async () => {
    try {
      const data = await devicesApi.getAll();
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  };

  const fetchReport = async () => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      const data = await reportsApi.getSummary(selectedDevice, {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate + 'T23:59:59').toISOString(),
      });
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedDevice) return;

    try {
      const blob = await reportsApi.getCSV(selectedDevice, {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate + 'T23:59:59').toISOString(),
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const device = devices.find(d => d.id === selectedDevice);
      a.download = `report-${device?.deviceId || 'device'}-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="device" className="block text-sm font-medium text-gray-700">
                Device
              </label>
              <select
                id="device"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.deviceId})
                    {user?.role !== 'CUSTOMER' && device.client && ` - ${device.client.user.name}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleExportCSV}
              disabled={!selectedDevice || loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      {report && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Report Summary</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading report...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Device Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Device Information</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Device Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{report.device.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Device ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{report.device.deviceId}</dd>
                    </div>
                    {user?.role !== 'CUSTOMER' && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Client</dt>
                        <dd className="mt-1 text-sm text-gray-900">{report.device.client}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Period */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Report Period</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {report.period.start
                          ? format(new Date(report.period.start), 'PPP')
                          : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">End Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {report.period.end
                          ? format(new Date(report.period.end), 'PPP')
                          : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Temperature Statistics</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Measurements</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {report.statistics.measurementCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Min Temperature</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {report.statistics.minTemperature !== null
                          ? `${report.statistics.minTemperature}°C`
                          : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Max Temperature</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {report.statistics.maxTemperature !== null
                          ? `${report.statistics.maxTemperature}°C`
                          : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Average Temperature</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {report.statistics.avgTemperature !== null
                          ? `${report.statistics.avgTemperature}°C`
                          : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Thresholds */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Thresholds</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Low Temperature Threshold</dt>
                      <dd className="mt-1 text-sm text-gray-900">{report.thresholds.low}°C</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">High Temperature Threshold</dt>
                      <dd className="mt-1 text-sm text-gray-900">{report.thresholds.high}°C</dd>
                    </div>
                  </dl>
                </div>

                {/* Alarms */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Alarms</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Alarms</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">
                        {report.alarms.total}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Active Alarms</dt>
                      <dd className="mt-1 text-lg font-semibold text-red-600">
                        {report.alarms.active}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Resolved Alarms</dt>
                      <dd className="mt-1 text-lg font-semibold text-green-600">
                        {report.alarms.resolved}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
