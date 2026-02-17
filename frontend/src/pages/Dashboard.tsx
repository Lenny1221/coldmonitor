import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, invitationsApi, customersApi } from '../services/api';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  BellIcon,
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

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
  _count?: {
    alerts: number;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
    if (user?.role === 'CUSTOMER') {
      fetchPendingInvitations();
    }
  }, [user]);

  // Automatisch vernieuwen elke 20 seconden (zelfde ritme als ESP32)
  useEffect(() => {
    if (user?.role !== 'CUSTOMER') return;
    const intervalId = setInterval(() => {
      fetchDashboard(true);
      fetchPendingInvitations();
    }, 20000);
    return () => clearInterval(intervalId);
  }, [user?.role]);

  // Bij terugkeer naar tab direct verversen (browsers vertragen timers in achtergrond tot ~10 min)
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
    if (!confirm('Weet je zeker dat je de koppeling met je technicus wilt verbreken? Ze hebben dan geen toegang meer tot je koelcellen.')) {
      return;
    }

    try {
      await customersApi.unlinkTechnician();
      // Refresh dashboard to update technician info
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'WARNING':
        return <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />;
      case 'ALARM':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
        return 'bg-green-50 border-green-200';
      case 'WARNING':
        return 'bg-orange-50 border-orange-200';
      case 'ALARM':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welkom terug, {data.customer?.contactName || 'Klant'}
            </p>
          </div>
          {pendingInvitationsCount > 0 && (
            <Link
              to="/invitations"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <BellIcon className="h-5 w-5 mr-2" />
              {pendingInvitationsCount} openstaande uitnodiging{pendingInvitationsCount !== 1 ? 'en' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Totaal locaties</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {data.summary?.totalLocations || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Totaal koelcellen</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {data.summary?.totalColdCells || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Actieve alarmen</div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {data.summary?.activeAlarms || 0}
          </div>
        </div>
      </div>

      {/* Technician Info Card */}
      {data.customer?.linkedTechnician && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Jouw technicus</h3>
                  <button
                    onClick={() => setShowUnlinkModal(true)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium inline-flex items-center"
                    title="Technicus ontkoppelen"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Ontkoppelen
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Neem contact op met je toegewezen technicus voor ondersteuning
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{data.customer.linkedTechnician.name}</span>
                  </div>
                  {data.customer.linkedTechnician.companyName && (
                    <div className="text-sm text-gray-600 ml-6">
                      {data.customer.linkedTechnician.companyName}
                    </div>
                  )}
                  {data.customer.linkedTechnician.email && (
                    <div className="flex items-center text-sm text-gray-700">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a 
                        href={`mailto:${data.customer.linkedTechnician.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {data.customer.linkedTechnician.email}
                      </a>
                    </div>
                  )}
                  {data.customer.linkedTechnician.phone && (
                    <div className="flex items-center text-sm text-gray-700">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a 
                        href={`tel:${data.customer.linkedTechnician.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {data.customer.linkedTechnician.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Technician Modal */}
      {showUnlinkModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={() => setShowUnlinkModal(false)}
        >
          <div 
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Technicus ontkoppelen
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Weet je zeker dat je de koppeling wilt verbreken met <span className="font-semibold text-gray-900">{data.customer?.linkedTechnician?.name}</span>?
                  </p>
                  <p className="text-sm text-gray-500">
                    Ze hebben dan geen toegang meer tot je locaties, koelcellen en alarmen. Je kunt later eventueel een nieuwe uitnodiging sturen.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={() => setShowUnlinkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuleren
              </button>
              <button
                onClick={handleUnlinkTechnician}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 inline-flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Ja, ontkoppelen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cold Cells Overview */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Koelcellen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.summary?.coldCells?.map((cell: ColdCell) => (
            <div
              key={cell.id}
              className={`bg-white rounded-lg shadow border-2 ${getStatusColor(cell.status)} p-6 cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => navigate(`/coldcell/${cell.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{cell.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{cell.type}</p>
                  {cell.location && (
                    <div
                      className="mt-1.5 flex items-center text-sm text-gray-500"
                      title={cell.location.address ? `${cell.location.locationName} – ${cell.location.address}` : cell.location.locationName}
                    >
                      <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{cell.location.locationName}</span>
                    </div>
                  )}
                </div>
                {getStatusIcon(cell.status)}
              </div>
              
              <div className="mt-4 space-y-2">
                {cell.currentTemperature !== null ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Temperature</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {cell.currentTemperature.toFixed(1)}°C
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No data available</div>
                )}
                
                {cell.lastReadingAt && (
                  <div className="text-xs text-gray-500">
                    Last reading: {new Date(cell.lastReadingAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                View Details
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        {(!data.summary?.coldCells || data.summary.coldCells.length === 0) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No cold cells configured yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Voeg locaties en koelcellen toe om te beginnen met monitoren.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
