import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  locationsApi,
  haccpReportsApi,
  techniciansApi,
  customersApi,
  authApi,
  getErrorMessage,
} from '../services/api';
import {
  DocumentTextIcon,
  TableCellsIcon,
  CalendarIcon,
  MapPinIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { format, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

type DatePreset = 'day' | 'week' | 'month' | 'custom';

interface Location {
  id: string;
  locationName: string;
  address?: string;
  coldCells?: ColdCell[];
}

interface ColdCell {
  id: string;
  name: string;
  type: string;
  location?: { locationName: string };
}

interface Customer {
  id: string;
  companyName: string;
  contactName?: string;
  locations?: Location[];
}

const HACCPAuditReport: React.FC = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedColdCellIds, setSelectedColdCellIds] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('week');
  const [startDate, setStartDate] = useState<string>(() =>
    format(subWeeks(new Date(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);

  const isCustomer = user?.role === 'CUSTOMER';
  const isTechnicianOrAdmin = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';

  const applyDatePreset = useCallback((preset: DatePreset) => {
    const now = new Date();
    switch (preset) {
      case 'day':
        setStartDate(format(startOfDay(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfDay(now), 'yyyy-MM-dd'));
        break;
      case 'week':
        setStartDate(format(subWeeks(now, 1), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(subMonths(now, 1), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (datePreset !== 'custom') {
      applyDatePreset(datePreset);
    }
  }, [datePreset, applyDatePreset]);

  // Load locations for CUSTOMER
  useEffect(() => {
    if (!isCustomer) return;
    const load = async () => {
      try {
        const data = await locationsApi.getAll();
        setLocations(data || []);
        if (data?.length > 0 && !selectedLocationId) {
          setSelectedLocationId('');
        }
      } catch (e) {
        setError(getErrorMessage(e, 'Locaties laden mislukt'));
      }
    };
    load();
  }, [isCustomer]);

  // Load linked customers for TECHNICIAN
  useEffect(() => {
    if (user?.role !== 'TECHNICIAN') return;
    const load = async () => {
      try {
        const profile = (user as any).profile;
        const technicianId = profile?.id;
        if (!technicianId) {
          const me = await authApi.getCurrentUser();
          const tid = (me.profile as any)?.id;
          if (tid) {
            const data = await techniciansApi.getCustomers(tid);
            setCustomers(data || []);
            if (data?.length === 1) setSelectedCustomerId(data[0].id);
          }
          return;
        }
        const data = await techniciansApi.getCustomers(technicianId);
        setCustomers(data || []);
        if (data?.length === 1) setSelectedCustomerId(data[0].id);
      } catch (e) {
        setError(getErrorMessage(e, 'Klanten laden mislukt'));
      }
    };
    load();
  }, [user?.role]);

  // Customer search for ADMIN (and TECHNICIAN fallback)
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const results = await customersApi.search(customerSearch);
        setCustomerSearchResults(results || []);
      } catch {
        setCustomerSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // Load locations/cold cells when customer selected (TECHNICIAN/ADMIN)
  useEffect(() => {
    if (!selectedCustomerId || !isTechnicianOrAdmin) return;
    const load = async () => {
      try {
        const customer = await customersApi.getById(selectedCustomerId);
        const locs = customer?.locations || [];
        setLocations(locs);
        setSelectedLocationId('');
        setSelectedColdCellIds([]);
      } catch (e) {
        setError(getErrorMessage(e, 'Klantgegevens laden mislukt'));
      }
    };
    load();
  }, [selectedCustomerId, isTechnicianOrAdmin]);

  const allColdCells = locations.flatMap((loc) =>
    (loc.coldCells || []).map((cc) => ({
      ...cc,
      locationId: loc.id,
      locationName: loc.locationName,
    }))
  );
  const filteredColdCells =
    selectedLocationId && selectedLocationId !== 'all'
      ? allColdCells.filter((cc) => (cc as any).locationId === selectedLocationId)
      : allColdCells;

  const getReportParams = () => {
    const customerId = isCustomer ? undefined : selectedCustomerId || undefined;
    const locationId = selectedLocationId && selectedLocationId !== 'all' ? selectedLocationId : undefined;
    const coldCellIds =
      selectedColdCellIds.length > 0 ? selectedColdCellIds : undefined;
    return {
      customerId,
      locationId,
      coldCellIds,
      startDate,
      endDate,
    };
  };

  const fetchPreview = useCallback(async () => {
    if (isTechnicianOrAdmin && !selectedCustomerId) {
      setError('Selecteer eerst een klant');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = getReportParams();
      const data = await haccpReportsApi.getAuditData(params);
      setPreview(data);
    } catch (e) {
      setError(getErrorMessage(e, 'Rapportdata laden mislukt'));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [
    isTechnicianOrAdmin,
    selectedCustomerId,
    selectedLocationId,
    selectedColdCellIds,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (isCustomer && locations.length > 0) fetchPreview();
    if (isTechnicianOrAdmin && selectedCustomerId) fetchPreview();
  }, [
    isCustomer,
    isTechnicianOrAdmin,
    locations.length,
    selectedCustomerId,
    selectedLocationId,
    selectedColdCellIds,
    startDate,
    endDate,
  ]);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (isTechnicianOrAdmin && !selectedCustomerId) {
      setError('Selecteer eerst een klant');
      return;
    }
    setDownloading(format);
    setError('');
    try {
      const params = getReportParams();
      const blob =
        format === 'pdf'
          ? await haccpReportsApi.downloadPdf(params)
          : await haccpReportsApi.downloadExcel(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HACCP-audit-${startDate}-${endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(getErrorMessage(e, `Download ${format.toUpperCase()} mislukt`));
    } finally {
      setDownloading(null);
    }
  };

  const canDownload =
    (isCustomer && locations.length > 0) || (isTechnicianOrAdmin && selectedCustomerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-frost-100">
          HACCP Audit Rapport
        </h1>
      </div>
      <p className="text-gray-600 dark:text-frost-300">
        Download uw HACCP-auditrapport als PDF of Excel voor FAVV-, ISO 22000- en wetgevingsconformiteit.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-frost-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-frost-100 mb-4">
            Rapportopties
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Klantselector (alleen voor technicus/admin) */}
            {isTechnicianOrAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">
                  Klant
                </label>
                {user?.role === 'TECHNICIAN' && customers.length > 0 ? (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Selecteer klant</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Typ om klant te zoeken (min. 2 tekens)"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {customerSearchResults.length > 0 && (
                      <ul className="mt-1 max-h-40 overflow-auto rounded border border-gray-200 dark:border-frost-600 bg-white dark:bg-frost-700">
                        {customerSearchResults.map((c) => (
                          <li
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerSearch(c.companyName);
                              setCustomerSearchResults([]);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-frost-600 text-sm"
                          >
                            {c.companyName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Locatie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                Locatie
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  setSelectedColdCellIds([]);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Alle locaties</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.locationName}
                  </option>
                ))}
              </select>
            </div>

            {/* Koelcellen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">
                <CubeIcon className="inline h-4 w-4 mr-1" />
                Koelcellen
              </label>
              <select
                multiple
                value={selectedColdCellIds}
                onChange={(e) =>
                  setSelectedColdCellIds(
                    Array.from(e.target.selectedOptions, (o) => o.value)
                  )
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                size={Math.min(4, Math.max(2, filteredColdCells.length))}
              >
                {filteredColdCells.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.name} ({cc.locationName || ''})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-frost-400">
                Laat leeg of selecteer meerdere voor alle koelcellen
              </p>
            </div>

            {/* Datumbereik */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-frost-300 mb-1">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Periode
              </label>
              <div className="flex gap-2 mb-2">
                {(['day', 'week', 'month', 'custom'] as DatePreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDatePreset(p)}
                    className={`px-2 py-1 text-sm rounded ${
                      datePreset === p
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-frost-600 text-gray-700 dark:text-frost-200 hover:bg-gray-300 dark:hover:bg-frost-500'
                    }`}
                  >
                    {p === 'day' ? 'Dag' : p === 'week' ? 'Week' : p === 'month' ? 'Maand' : 'Aangepast'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100 shadow-sm sm:text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-frost-600 dark:bg-frost-700 dark:text-frost-100 shadow-sm sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Downloadknoppen */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={!canDownload || downloading !== null}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              {downloading === 'pdf' ? 'Bezig...' : 'Download PDF'}
            </button>
            <button
              onClick={() => handleDownload('excel')}
              disabled={!canDownload || downloading !== null}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TableCellsIcon className="h-5 w-5 mr-2" />
              {downloading === 'excel' ? 'Bezig...' : 'Download Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {loading && (
        <div className="bg-white dark:bg-frost-800 shadow rounded-lg p-6 text-center text-gray-500 dark:text-frost-400">
          Rapport laden...
        </div>
      )}
      {preview && !loading && (
        <div className="bg-white dark:bg-frost-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-frost-100 mb-4">
              Samenvatting
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-frost-400">
                  Totaal metingen
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-frost-100">
                  {preview.samenvatting?.totaalMetingen ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-frost-400">
                  Binnen norm
                </dt>
                <dd className="mt-1 text-lg font-semibold text-green-600">
                  {preview.samenvatting?.percentageBinnenNorm ?? 0}%
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-frost-400">
                  CCP-afwijkingen
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-frost-100">
                  {preview.samenvatting?.aantalAfwijkingen ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-frost-400">
                  Beoordeling
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-frost-100">
                  {preview.samenvatting?.beoordeling ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-frost-400">
                  Per-dag registraties
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-frost-100">
                  {preview.perDagOverzicht?.length ?? 0}
                </dd>
                <dd className="text-xs text-gray-500 dark:text-frost-400">
                  (conform EU 852/2004, FAVV)
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default HACCPAuditReport;
