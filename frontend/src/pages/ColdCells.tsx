import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coldCellsApi, locationsApi } from '../services/api';
import { CubeIcon, PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const ColdCells: React.FC = () => {
  const navigate = useNavigate();
  const [coldCells, setColdCells] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'fridge' as 'fridge' | 'freezer',
    temperatureMinThreshold: 2,
    temperatureMaxThreshold: 8,
    locationId: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cellsData, locationsData] = await Promise.all([
        coldCellsApi.getAll(),
        locationsApi.getAll(),
      ]);
      setColdCells(cellsData || []);
      setLocations(locationsData || []);
      if (locationsData && locationsData.length > 0 && !formData.locationId) {
        setFormData(prev => ({ ...prev, locationId: locationsData[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setColdCells([]);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateColdCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.locationId) {
      alert('Please select a location first');
      return;
    }
    setCreating(true);
    try {
      await coldCellsApi.create({
        ...formData,
        locationId: formData.locationId,
      });
      setShowCreateDialog(false);
      setFormData({
        name: '',
        type: 'fridge',
        temperatureMinThreshold: 2,
        temperatureMaxThreshold: 8,
        locationId: locations[0]?.id || '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create cold cell:', error);
      alert(error.response?.data?.error || 'Failed to create cold cell');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (cell: any) => {
    if (cell._count?.alerts > 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">Critical</span>;
    }
    const latestReading = cell.devices?.[0]?.sensorReadings?.[0];
    if (latestReading) {
      const temp = latestReading.temperature;
      if (temp > cell.temperatureMaxThreshold || temp < cell.temperatureMinThreshold) {
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">Warning</span>;
      }
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">Normal</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-frost-100">Cold Cells</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Manage your refrigeration and freezer units
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          disabled={locations.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Koelcel toevoegen
        </button>
      </div>

      {locations.length === 0 && (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 text-center border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <p className="text-gray-500 dark:text-slate-300 mb-4">
            You need to create a location first before adding cold cells.
          </p>
          <button
            onClick={() => navigate('/locations')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Locations
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-300">Koelcellen laden...</div>
      ) : coldCells.length > 0 ? (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] overflow-x-auto border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[rgba(100,200,255,0.1)] min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-frost-850">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Cold Cell Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Current Temp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-frost-800 divide-y divide-gray-200 dark:divide-[rgba(100,200,255,0.1)]">
              {coldCells.map((cell) => {
                const latestReading = cell.devices?.[0]?.sensorReadings?.[0];
                return (
                  <tr key={cell.id} className="hover:bg-gray-50 dark:hover:bg-frost-850">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CubeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-frost-100">{cell.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      {cell.location?.locationName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {latestReading ? (
                        <span className="font-medium text-gray-900 dark:text-frost-100">
                          {latestReading.temperature.toFixed(1)}°C
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cell)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/coldcell/${cell.id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center"
                      >
                        View Details
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-12 text-center border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <p className="text-gray-500 dark:text-slate-300">No cold cells found</p>
          <p className="text-sm text-gray-400 dark:text-slate-400 mt-2">
            Maak je eerste koelcel aan om te beginnen met monitoren
          </p>
        </div>
      )}

      {/* Create Cold Cell Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black/60">
          <div className="bg-white dark:bg-frost-800 rounded-lg shadow-xl dark:shadow-[0_0_24px_rgba(0,0,0,0.3)] p-6 w-full max-w-md border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-frost-100 mb-4">Nieuwe koelcel aanmaken</h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
              Voeg een nieuwe koel- of vriescel toe om te monitoren
            </p>
            <form onSubmit={handleCreateColdCell} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Cold Cell Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Freezer 1, Fridge 2"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-frost-850 text-gray-900 dark:text-frost-100"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Location *
                </label>
                <select
                  id="location"
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-frost-850 text-gray-900 dark:text-frost-100"
                >
                  <option value="">Select a location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.locationName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Type *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fridge' | 'freezer' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-frost-850 text-gray-900 dark:text-frost-100"
                >
                  <option value="fridge">Fridge</option>
                  <option value="freezer">Freezer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minTemp" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Min Temp (°C) *
                  </label>
                  <input
                    id="minTemp"
                    type="number"
                    step="0.1"
                    value={formData.temperatureMinThreshold}
                    onChange={(e) => setFormData({ ...formData, temperatureMinThreshold: parseFloat(e.target.value) })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-frost-850 text-gray-900 dark:text-frost-100"
                  />
                </div>
                <div>
                  <label htmlFor="maxTemp" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Max Temp (°C) *
                  </label>
                  <input
                    id="maxTemp"
                    type="number"
                    step="0.1"
                    value={formData.temperatureMaxThreshold}
                    onChange={(e) => setFormData({ ...formData, temperatureMaxThreshold: parseFloat(e.target.value) })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-frost-850 text-gray-900 dark:text-frost-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-frost-850 hover:bg-gray-50 dark:hover:bg-frost-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.locationId}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {creating ? 'Aanmaken...' : 'Koelcel aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdCells;
