import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invitationsApi } from '../services/api';
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Invitations: React.FC = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await invitationsApi.getAll();
      setInvitations(data || []);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      await invitationsApi.accept(invitationId);
      await fetchInvitations();
      // Refresh page to update dashboard
      window.location.reload();
    } catch (error: any) {
      console.error('Accept invitation error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to accept invitation';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`${errorMessage}${error.response?.status ? ` (Status: ${error.response.status})` : ''}`);
    }
  };

  const handleReject = async (invitationId: string) => {
    if (!confirm('Are you sure you want to reject this invitation?')) {
      return;
    }
    try {
      await invitationsApi.reject(invitationId);
      await fetchInvitations();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject invitation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'EXPIRED':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      ACCEPTED: { bg: 'bg-green-100', text: 'text-green-800' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {status}
      </span>
    );
  };

  const pendingInvitations = invitations.filter((inv: any) => inv.status === 'PENDING');
  const otherInvitations = invitations.filter((inv: any) => inv.status !== 'PENDING');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
        <p className="mt-1 text-sm text-gray-600">
          {user?.role === 'CUSTOMER' 
            ? 'Manage technician invitations to access your cold cells'
            : 'View invitations you have sent to customers'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading invitations...</div>
      ) : (
        <>
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pending Invitations ({pendingInvitations.length})
              </h2>
              <div className="space-y-4">
                {pendingInvitations.map((invitation: any) => (
                  <div
                    key={invitation.id}
                    className="bg-white rounded-lg shadow border-2 border-yellow-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {getStatusIcon(invitation.status)}
                        <div className="flex-1">
                          {user?.role === 'CUSTOMER' ? (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {invitation.technician?.name}
                                </h3>
                                {getStatusBadge(invitation.status)}
                              </div>
                              {invitation.technician?.companyName && (
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                  <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                                  {invitation.technician.companyName}
                                </div>
                              )}
                              <div className="space-y-1 text-sm text-gray-600">
                                {invitation.technician?.email && (
                                  <div className="flex items-center">
                                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                                    <a 
                                      href={`mailto:${invitation.technician.email}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {invitation.technician.email}
                                    </a>
                                  </div>
                                )}
                                {invitation.technician?.phone && (
                                  <div className="flex items-center">
                                    <PhoneIcon className="h-4 w-4 mr-2" />
                                    <a 
                                      href={`tel:${invitation.technician.phone}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {invitation.technician.phone}
                                    </a>
                                  </div>
                                )}
                              </div>
                              {invitation.message && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                  <p className="text-sm text-gray-700">{invitation.message}</p>
                                </div>
                              )}
                              <div className="mt-4 text-xs text-gray-500">
                                Sent: {new Date(invitation.sentAt).toLocaleString()}
                                {invitation.expiresAt && (
                                  <span className="ml-2">
                                    • Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {invitation.customer?.companyName}
                                </h3>
                                {getStatusBadge(invitation.status)}
                              </div>
                              <div className="text-sm text-gray-600">
                                Contact: {invitation.customer?.contactName}
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                Sent: {new Date(invitation.sentAt).toLocaleString()}
                                {invitation.expiresAt && (
                                  <span className="ml-2">
                                    • Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {user?.role === 'CUSTOMER' && invitation.status === 'PENDING' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleAccept(invitation.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 inline-flex items-center"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(invitation.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 inline-flex items-center"
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Invitations (Accepted, Rejected, Expired) */}
          {otherInvitations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {user?.role === 'CUSTOMER' ? 'Previous Invitations' : 'Invitation History'}
              </h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {user?.role === 'CUSTOMER' ? 'Technician' : 'Customer'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Responded
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {otherInvitations.map((invitation: any) => (
                      <tr key={invitation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user?.role === 'CUSTOMER' 
                              ? invitation.technician?.name
                              : invitation.customer?.companyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user?.role === 'CUSTOMER' 
                              ? invitation.technician?.email
                              : invitation.customer?.contactName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invitation.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invitation.sentAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.respondedAt 
                            ? new Date(invitation.respondedAt).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {invitations.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {user?.role === 'CUSTOMER' 
                  ? 'No invitations received yet'
                  : 'No invitations sent yet'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {user?.role === 'CUSTOMER' 
                  ? 'When a technician sends you an invitation, it will appear here'
                  : 'Send invitations to customers from the Manage Customers page'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Invitations;
