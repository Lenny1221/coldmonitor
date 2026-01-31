import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsApi } from '../services/api';
import { MapPinIcon, PlusIcon, ArrowRightIcon, CheckIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const Locations: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState<string>('');
  const [mapLoading, setMapLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string>('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'not-set' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const mapScriptLoaded = useRef(false);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<any>(null);

  useEffect(() => {
    fetchLocations();
    loadGoogleMapsScript();
    testApiKey();
  }, []);

  const testApiKey = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setApiKeyStatus('not-set');
      return;
    }

    setApiKeyStatus('checking');
    
    try {
      // Test the API key by making a simple Geocoding API request
      const testAddress = '1600 Amphitheatre Parkway, Mountain View, CA';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        setApiKeyStatus('valid');
      } else if (data.status === 'REQUEST_DENIED') {
        setApiKeyStatus('invalid');
        console.error('Google Maps API Error:', data.error_message || 'API key is invalid or restricted');
      } else {
        setApiKeyStatus('invalid');
        console.error('Google Maps API Error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('Failed to test API key:', error);
      setApiKeyStatus('invalid');
    }
  };

  useEffect(() => {
    // Initialize autocomplete when Google Maps is loaded and dialog is open
    if (showCreateDialog && window.google && window.google.maps && autocompleteRef.current) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        // Cleanup existing instance if any
        if (autocompleteInstance.current) {
          window.google?.maps?.event?.clearInstanceListeners?.(autocompleteInstance.current);
        }
        
        try {
          autocompleteInstance.current = new window.google.maps.places.Autocomplete(
            autocompleteRef.current,
            {
              types: ['address'],
              fields: ['formatted_address', 'geometry', 'name'],
            }
          );

          autocompleteInstance.current.addListener('place_changed', () => {
            const place = autocompleteInstance.current.getPlace();
            if (place.formatted_address) {
              setAddress(place.formatted_address);
              setGeocodingError('');
              // Auto-update map when address is selected
              updateMapForAddress(place.formatted_address);
            }
          });
        } catch (error) {
          console.error('Failed to initialize autocomplete:', error);
        }
      }
    }

    // Cleanup autocomplete when dialog closes
    return () => {
      if (!showCreateDialog) {
        if (autocompleteInstance.current) {
          window.google?.maps?.event?.clearInstanceListeners?.(autocompleteInstance.current);
          autocompleteInstance.current = null;
        }
      }
    };
  }, [showCreateDialog]);

  // Update map when address changes (debounced)
  useEffect(() => {
    if (address.trim() && showCreateDialog) {
      const timer = setTimeout(() => {
        updateMapForAddress(address);
      }, 500); // Wait 500ms after user stops typing
      return () => clearTimeout(timer);
    }
  }, [address, showCreateDialog]);

  const loadGoogleMapsScript = () => {
    if (mapScriptLoaded.current || window.google) {
      return;
    }
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found. Autocomplete will not work. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      mapScriptLoaded.current = true;
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    document.head.appendChild(script);
  };

  const updateMapForAddress = async (addressToGeocode: string) => {
    if (!addressToGeocode.trim()) {
      setMapUrl('');
      return;
    }

    setMapLoading(true);
    setGeocodingError('');
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      // Use Google Maps Geocoding API if key is available
      if (apiKey && window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: addressToGeocode }, (results: any[], status: string) => {
          setMapLoading(false);
          if (status === 'OK' && results[0]) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            // Use Embed API with key for better results
            const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`;
            setMapUrl(mapUrl);
            setGeocodingError('');
          } else {
            setMapUrl('');
            setGeocodingError('Address not found. Please check the address.');
          }
        });
      } else {
        // Fallback: Use Google Maps search URL
        const encodedAddress = encodeURIComponent(addressToGeocode);
        const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
        setMapUrl(mapUrl);
        setMapLoading(false);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setMapLoading(false);
      setGeocodingError('Failed to load map. Please check the address.');
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      console.log('Fetching locations...');
      const data = await locationsApi.getAll();
      console.log('Received locations data:', data);
      console.log('Data type:', typeof data);
      console.log('Is array?', Array.isArray(data));
      
      // Ensure data is an array
      const locationsArray = Array.isArray(data) ? data : [];
      console.log('Locations array length:', locationsArray.length);
      
      // Sort by creation date (newest first) to show newly created locations at the top
      const sortedData = locationsArray.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Newest first
      });
      console.log('Setting locations:', sortedData);
      setLocations(sortedData);
    } catch (error: any) {
      console.error('=== FETCH LOCATIONS ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationName.trim()) {
      setGeocodingError('Location name is required');
      return;
    }
    
    if (!address.trim()) {
      setGeocodingError('Address is required');
      return;
    }

    setCreating(true);
    try {
      const newLocation = await locationsApi.create({
        locationName,
        address: address,
      });
      
      // Close dialog first
      setShowCreateDialog(false);
      
      // Reset form
      setLocationName('');
      setAddress('');
      setMapUrl('');
      setGeocodingError('');
      
      // Optimistically add the new location to the list immediately
      if (newLocation) {
        setLocations(prevLocations => {
          // Check if location already exists (avoid duplicates)
          const exists = prevLocations.some((loc: any) => loc.id === newLocation.id);
          if (exists) {
            return prevLocations;
          }
          // Add new location at the beginning of the list
          return [newLocation, ...prevLocations];
        });
      }
      
      // Also refresh from server to get full data with relations
      setTimeout(async () => {
        await fetchLocations();
      }, 500);
      
      // Scroll to top to see the new location
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('=== CREATE LOCATION ERROR ===');
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Request config:', error.config);
      
      let errorMessage = 'Failed to create location';
      
      if (error.response) {
        // Server responded with error
        const data = error.response.data;
        if (data?.details) {
          errorMessage = `${data.error || 'Validation failed'}: ${data.details}`;
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.message) {
          errorMessage = data.message;
        } else {
          errorMessage = `Server error (${error.response.status}): ${JSON.stringify(data)}`;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Is the backend running?';
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      alert(`Failed to create location:\n\n${errorMessage}\n\nCheck the browser console (F12) for more details.`);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setShowCreateDialog(false);
    setLocationName('');
    setAddress('');
    setMapUrl('');
    setGeocodingError('');
    // Cleanup autocomplete
    if (autocompleteInstance.current) {
      window.google?.maps?.event?.clearInstanceListeners?.(autocompleteInstance.current);
      autocompleteInstance.current = null;
    }
  };

  const handleDeleteClick = (location: any) => {
    setLocationToDelete(location);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    setDeleting(true);
    try {
      await locationsApi.delete(locationToDelete.id);
      setShowDeleteModal(false);
      setLocationToDelete(null);
      await fetchLocations();
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete location';
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setLocationToDelete(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your business locations
          </p>
          {apiKeyStatus !== null && apiKeyStatus !== 'not-set' && (
            <div className="mt-2">
              {apiKeyStatus === 'checking' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Testing API key...
                </span>
              )}
              {apiKeyStatus === 'valid' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Google Maps API Key: Active
                </span>
              )}
              {apiKeyStatus === 'invalid' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ✗ Google Maps API Key: Invalid or Restricted
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Location
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading locations...</div>
      ) : locations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location: any) => (
            <div
              key={location.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {location.locationName}
                  </h3>
                </div>
                <button
                  onClick={() => handleDeleteClick(location)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete location"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              {location.address && (
                <p className="text-sm text-gray-600 mb-4">{location.address}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {location.coldCells?.length || 0} cold cell{location.coldCells?.length !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={() => navigate(`/locations/${location.id}`)}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  View
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No locations found</p>
          <p className="text-sm text-gray-400 mt-2">
            {loading ? 'Loading...' : 'Create your first location to get started'}
          </p>
        </div>
      )}

      {/* Create Location Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Location</h2>
            <p className="text-sm text-gray-600 mb-6">
              Enter the location details. The address will be shown on the map automatically.
            </p>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name *
                </label>
                <input
                  id="locationName"
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Main Store, Warehouse"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <div className="relative">
                  <input
                    ref={autocompleteRef}
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setGeocodingError('');
                    }}
                    placeholder="Start typing an address..."
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                    autoComplete="off"
                  />
                  <MapPinIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
                    ? apiKeyStatus === 'valid'
                      ? "Start typing and select from suggestions. The map will update automatically."
                      : apiKeyStatus === 'invalid'
                      ? "API key is invalid. Autocomplete may not work. Please check your VITE_GOOGLE_MAPS_API_KEY."
                      : "Loading autocomplete..."
                    : "Enter the full address. The map will update automatically. (Add VITE_GOOGLE_MAPS_API_KEY to enable autocomplete)"}
                </p>
                {geocodingError && (
                  <p className="mt-1 text-sm text-red-600">{geocodingError}</p>
                )}
              </div>

              {/* Map Preview */}
              {address.trim() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Map Preview
                  </label>
                  <div className="rounded-lg overflow-hidden border border-gray-300" style={{ height: '300px' }}>
                    {mapLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-500 text-sm">Loading map...</p>
                        </div>
                      </div>
                    ) : mapUrl ? (
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapUrl}
                        title="Location Map"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <p className="text-gray-500 text-sm">Enter an address to see it on the map</p>
                      </div>
                    )}
                  </div>
                  {mapUrl && (
                    <div className="mt-2 text-center">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !locationName.trim() || !address.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {creating ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Location Confirmation Modal */}
      {showDeleteModal && locationToDelete && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={handleDeleteCancel}
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
                    Location verwijderen
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Weet je zeker dat je <span className="font-semibold text-gray-900">{locationToDelete.locationName}</span> wilt verwijderen?
                  </p>
                  <p className="text-sm text-gray-500">
                    Alle cold cells en bijbehorende gegevens van deze locatie worden ook verwijderd. Deze actie kan niet ongedaan worden gemaakt.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {deleting ? 'Verwijderen...' : 'Ja, verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Locations;
