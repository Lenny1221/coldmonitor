import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { techniciansApi, customersApi, authApi, invitationsApi } from '../services/api';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ManageCustomers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [linkedCustomers, setLinkedCustomers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [customerToUnlink, setCustomerToUnlink] = useState<any>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLinkedCustomers();
    fetchInvitations();
  }, [user]);

  // Close modal on ESC key
  useEffect(() => {
    if (!showUnlinkModal) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUnlinkModal(false);
        setCustomerToUnlink(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showUnlinkModal]);

  const fetchInvitations = async () => {
    try {
      const data = await invitationsApi.getAll();
      setInvitations(data || []);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search customers when typing
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await customersApi.search(searchQuery);
        // Filter out already linked customers and customers with pending invitations
        const linkedIds = new Set(linkedCustomers.map(c => c.id));
        const pendingInvitationIds = new Set(
          invitations
            .filter((inv: any) => inv.status === 'PENDING')
            .map((inv: any) => inv.customerId || inv.customer?.id)
        );
        const filtered = results.filter((c: any) => 
          !linkedIds.has(c.id) && !pendingInvitationIds.has(c.id)
        );
        setSearchResults(filtered);
        setShowSearchDropdown(true);
      } catch (error) {
        console.error('Failed to search customers:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, linkedCustomers, invitations]);

  const getTechnicianId = async (): Promise<string | null> => {
    // Try to get from user profile first
    if ((user?.profile as any)?.id) {
      return (user!.profile as any).id;
    }
    
    // If not in profile, fetch current user to get technician ID
    try {
      const currentUser = await authApi.getCurrentUser();
      return (currentUser.profile as any)?.id || null;
    } catch (error) {
      console.error('Failed to get technician ID:', error);
      return null;
    }
  };

  const fetchLinkedCustomers = async () => {
    try {
      setLoading(true);
      const technicianId = await getTechnicianId();
      if (!technicianId) {
        console.error('Technician ID not found');
        return;
      }
      const customers = await techniciansApi.getCustomers(technicianId);
      setLinkedCustomers(customers);
    } catch (error) {
      console.error('Failed to fetch linked customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (customerId: string) => {
    try {
      await invitationsApi.send({ customerId });
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchDropdown(false);
      await fetchInvitations();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Uitnodiging versturen mislukt';
      alert(errorMsg);
    }
  };

  const handleUnlinkClick = (customer: any) => {
    setCustomerToUnlink(customer);
    setShowUnlinkModal(true);
  };

  const handleUnlinkConfirm = async () => {
    if (!customerToUnlink) return;

    try {
      const technicianId = await getTechnicianId();
      if (!technicianId) {
        alert('Technicus-ID niet gevonden. Log uit en opnieuw in.');
        setShowUnlinkModal(false);
        setCustomerToUnlink(null);
        return;
      }

      await techniciansApi.unlinkCustomer(technicianId, customerToUnlink.id);
      // Refresh both linked customers and invitations
      await Promise.all([
        fetchLinkedCustomers(),
        fetchInvitations(),
      ]);
      setShowUnlinkModal(false);
      setCustomerToUnlink(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Klant ontkoppelen mislukt';
      alert(errorMsg);
    }
  };

  const handleUnlinkCancel = () => {
    setShowUnlinkModal(false);
    setCustomerToUnlink(null);
  };

  const getTotalColdCells = (customer: any) => {
    return customer.locations?.reduce((sum: number, loc: any) => sum + (loc.coldCells?.length || 0), 0) || 0;
  };

  const getActiveAlerts = (customer: any) => {
    return customer.locations?.reduce((sum: number, loc: any) => {
      return sum + (loc.coldCells?.reduce((cellSum: number, cell: any) => {
        return cellSum + (cell._count?.alerts || 0);
      }, 0) || 0);
    }, 0) || 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-frost-100">Klanten beheren</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Koppel klanten om hun koelcellen te bekijken en beheren
          </p>
        </div>
      </div>

      {/* Add Customer Section */}
      <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-4">Klant toevoegen</h2>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchDropdown(true);
                }
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Zoek op bedrijfsnaam, contactpersoon of e-mail..."
            />
            {searching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-frost-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {searchResults.map((customer) => (
                <div
                  key={customer.id}
                  className="cursor-pointer hover:bg-blue-50 px-4 py-3 border-b border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="font-medium text-gray-900 dark:text-frost-100">{customer.companyName}</div>
                        {customer.linkedTechnician && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Gekoppeld aan {customer.linkedTechnician.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 ml-7">
                        <div className="flex items-center">
                          <span className="mr-2">{customer.contactName}</span>
                          <EnvelopeIcon className="h-3 w-3 mr-1" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center mt-1">
                            <PhoneIcon className="h-3 w-3 mr-1" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer._count?.locations > 0 && (
                          <div className="text-xs text-gray-500 dark:text-frost-500 mt-1">
                            {customer._count.locations} locatie(s)
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendInvitation(customer.id)}
                      disabled={!!customer.linkedTechnician}
                      className="ml-4 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      {customer.linkedTechnician ? 'Al gekoppeld' : 'Uitnodiging versturen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSearchDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-frost-800 shadow-lg rounded-md py-4 text-center text-sm text-gray-500 dark:text-frost-400">
              Geen klanten gevonden
            </div>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.filter((inv: any) => inv.status === 'PENDING').length > 0 && (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-4">
            Openstaande uitnodigingen ({invitations.filter((inv: any) => inv.status === 'PENDING').length})
          </h2>
          <div className="space-y-3">
            {invitations
              .filter((inv: any) => inv.status === 'PENDING')
              .map((invitation: any) => (
                <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="font-medium text-gray-900 dark:text-frost-100">
                          {invitation.customer?.companyName || 'Onbekend'}
                        </div>
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          In afwachting
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1 ml-7">
                        Verzonden: {new Date(invitation.sentAt).toLocaleDateString('nl-BE')}
                        {invitation.expiresAt && (
                          <span className="ml-2">
                            (Verloopt: {new Date(invitation.expiresAt).toLocaleDateString('nl-BE')})
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await invitationsApi.cancel(invitation.id);
                          await fetchInvitations();
                        } catch (error: any) {
                          alert(error.response?.data?.error || 'Uitnodiging annuleren mislukt');
                        }
                      }}
                      className="ml-4 px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Rejected Invitations */}
      {invitations.filter((inv: any) => inv.status === 'REJECTED').length > 0 && (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-4">
            Afgewezen uitnodigingen ({invitations.filter((inv: any) => inv.status === 'REJECTED').length})
          </h2>
          <div className="space-y-3">
            {invitations
              .filter((inv: any) => inv.status === 'REJECTED')
              .map((invitation: any) => (
                <div key={invitation.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="font-medium text-gray-900 dark:text-frost-100">
                          {invitation.customer?.companyName || 'Onbekend'}
                        </div>
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Afgewezen
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1 ml-7">
                        Verzonden: {new Date(invitation.sentAt).toLocaleDateString('nl-BE')}
                        {invitation.respondedAt && (
                          <span className="ml-2">
                            • Afgewezen: {new Date(invitation.respondedAt).toLocaleDateString('nl-BE')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Accepted Invitations */}
      {invitations.filter((inv: any) => inv.status === 'ACCEPTED').length > 0 && (
        <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] p-6 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-4">
            Geaccepteerde uitnodigingen ({invitations.filter((inv: any) => inv.status === 'ACCEPTED').length})
          </h2>
          <div className="space-y-3">
            {invitations
              .filter((inv: any) => inv.status === 'ACCEPTED')
              .map((invitation: any) => (
                <div key={invitation.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="font-medium text-gray-900 dark:text-frost-100">
                          {invitation.customer?.companyName || 'Onbekend'}
                        </div>
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Geaccepteerd
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1 ml-7">
                        Verzonden: {new Date(invitation.sentAt).toLocaleDateString('nl-BE')}
                        {invitation.respondedAt && (
                          <span className="ml-2">
                            • Geaccepteerd: {new Date(invitation.respondedAt).toLocaleDateString('nl-BE')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Linked Customers List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-frost-100 mb-4">
          Gekoppelde klanten ({linkedCustomers.length})
        </h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Klanten laden...</div>
        ) : linkedCustomers.length > 0 ? (
          <div className="bg-white dark:bg-frost-800 rounded-lg shadow dark:shadow-[0_0_24px_rgba(0,0,0,0.2)] overflow-x-auto w-full border border-gray-100 dark:border-[rgba(100,200,255,0.08)]">
            <table className="w-full min-w-full table-fixed divide-y divide-gray-200 dark:divide-[rgba(100,200,255,0.12)]">
              <thead className="bg-gray-50 dark:bg-[rgba(100,200,255,0.06)]">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-frost-400 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-frost-800 divide-y divide-gray-200 dark:divide-[rgba(100,200,255,0.12)]">
                {linkedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-[rgba(100,200,255,0.04)]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-frost-100">{customer.companyName}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-frost-100">{customer.contactName}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <PhoneIcon className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.address && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {customer.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-frost-100">
                      {customer.locations?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-frost-100">
                      {getTotalColdCells(customer)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActiveAlerts(customer) > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {getActiveAlerts(customer)}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Bekijken
                        </button>
                        <button
                          onClick={() => handleUnlinkClick(customer)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Ontkoppelen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white dark:bg-frost-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 dark:text-frost-400">Nog geen klanten gekoppeld</p>
            <p className="text-sm text-gray-400 dark:text-frost-500 mt-2">
              Zoek en koppel klanten hierboven om hun koelcellen te beheren
            </p>
          </div>
        )}
      </div>

      {/* Unlink Confirmation Modal */}
      {showUnlinkModal && customerToUnlink && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={handleUnlinkCancel}
        >
          <div 
            className="relative bg-white dark:bg-frost-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-100 dark:border-[rgba(100,200,255,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-frost-100 mb-2">
                    Klant ontkoppelen
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-frost-400 mb-4">
                    Weet u zeker dat u <span className="font-semibold text-gray-900 dark:text-frost-100">{customerToUnlink.companyName}</span> wilt ontkoppelen?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-frost-400">
                    U kunt hun locaties, koelcellen en alarmen niet meer bekijken. Deze actie kan ongedaan worden gemaakt door een nieuwe uitnodiging te versturen.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-frost-850 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={handleUnlinkCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-frost-200 bg-white dark:bg-frost-800 border border-gray-300 dark:border-frost-600 rounded-md hover:bg-gray-50 dark:hover:bg-frost-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuleren
              </button>
              <button
                onClick={handleUnlinkConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 inline-flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Ja, ontkoppelen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCustomers;
