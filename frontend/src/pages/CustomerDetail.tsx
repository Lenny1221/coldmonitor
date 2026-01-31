import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersApi } from '../services/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const data = await customersApi.getById(id!);
      setCustomer(data);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Customer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/technician')}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{customer.companyName}</h1>
          <p className="text-sm text-gray-600">{customer.contactName}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Company Name</div>
            <div className="text-lg font-medium text-gray-900">{customer.companyName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Contact Name</div>
            <div className="text-lg font-medium text-gray-900">{customer.contactName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Email</div>
            <div className="text-lg font-medium text-gray-900">{customer.email}</div>
          </div>
          {customer.phone && (
            <div>
              <div className="text-sm text-gray-600">Phone</div>
              <div className="text-lg font-medium text-gray-900">{customer.phone}</div>
            </div>
          )}
          {customer.address && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Address</div>
              <div className="text-lg font-medium text-gray-900">{customer.address}</div>
            </div>
          )}
        </div>
      </div>

      {/* Locations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Locations</h2>
        <div className="space-y-4">
          {customer.locations?.map((location: any) => (
            <div key={location.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{location.locationName}</h3>
                  {location.address && (
                    <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Cold Cells</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {location.coldCells?.length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Active Alarms</div>
                      <div className="text-2xl font-bold text-red-600">
                        {location.coldCells?.reduce(
                          (sum: number, cell: any) => sum + (cell._count?.alerts || 0),
                          0
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cold Cells in this location */}
              {location.coldCells && location.coldCells.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Cold Cells:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {location.coldCells.map((cell: any) => (
                      <div
                        key={cell.id}
                        className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/coldcell/${cell.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{cell.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{cell.type}</div>
                          </div>
                          {cell._count?.alerts > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                              {cell._count.alerts} alarm{cell._count.alerts !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {(!customer.locations || customer.locations.length === 0) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No locations configured</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
