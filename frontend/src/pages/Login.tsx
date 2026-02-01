import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { techniciansApi } from '../services/api';
import { MagnifyingGlassIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

type RegisterType = 'customer' | 'technician';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerType, setRegisterType] = useState<RegisterType>('customer');
  const [technicianSearch, setTechnicianSearch] = useState('');
  const [technicianResults, setTechnicianResults] = useState<any[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<any | null>(null);
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { login, registerCustomer, registerTechnician } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTechnicianDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search technicians when typing
  useEffect(() => {
    if (technicianSearch.length < 2) {
      setTechnicianResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await techniciansApi.search(technicianSearch);
        setTechnicianResults(results);
        setShowTechnicianDropdown(true);
      } catch (error) {
        console.error('Failed to search technicians:', error);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [technicianSearch]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      companyName: formData.get('companyName') as string,
      contactName: formData.get('contactName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      password: formData.get('password') as string,
      technicianId: selectedTechnician?.id || undefined,
    };

    try {
      await registerCustomer(data);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTechnicianRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      companyName: formData.get('companyName') as string,
      password: formData.get('password') as string,
    };

    try {
      await registerTechnician(data);
      navigate('/technician');
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ColdMonitor
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            IoT Refrigeration Monitoring Platform
          </p>
        </div>

        {!showRegister ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Don't have an account? Register
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Registration Type Tabs */}
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setRegisterType('customer');
                  setSelectedTechnician(null);
                  setTechnicianSearch('');
                }}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
                  registerType === 'customer'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegisterType('technician');
                  setSelectedTechnician(null);
                  setTechnicianSearch('');
                }}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  registerType === 'technician'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Technician
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {registerType === 'customer' ? (
              <form className="space-y-4" onSubmit={handleCustomerRegister}>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                    Contact Name *
                  </label>
                  <input
                    id="contactName"
                    name="contactName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                
                {/* Technician Search */}
                <div className="relative" ref={dropdownRef}>
                  <label htmlFor="technicianSearch" className="block text-sm font-medium text-gray-700">
                    Link to Technician (Optional)
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="technicianSearch"
                      type="text"
                      value={technicianSearch}
                      onChange={(e) => {
                        setTechnicianSearch(e.target.value);
                        if (e.target.value === '') {
                          setSelectedTechnician(null);
                        }
                      }}
                      onFocus={() => {
                        if (technicianResults.length > 0) {
                          setShowTechnicianDropdown(true);
                        }
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search by name, email, or company..."
                    />
                  </div>
                  
                  {/* Dropdown Results */}
                  {showTechnicianDropdown && technicianResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {technicianResults.map((technician) => (
                        <div
                          key={technician.id}
                          onClick={() => {
                            setSelectedTechnician(technician);
                            setTechnicianSearch(`${technician.name}${technician.companyName ? ` - ${technician.companyName}` : ''}`);
                            setShowTechnicianDropdown(false);
                          }}
                          className="cursor-pointer hover:bg-blue-50 px-4 py-2"
                        >
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{technician.name}</div>
                              {technician.companyName && (
                                <div className="text-sm text-gray-500">{technician.companyName}</div>
                              )}
                              <div className="text-sm text-gray-500">{technician.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Selected Technician Display */}
                  {selectedTechnician && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Selected: {selectedTechnician.name}
                          </div>
                          {selectedTechnician.companyName && (
                            <div className="text-xs text-gray-600">{selectedTechnician.companyName}</div>
                          )}
                          {selectedTechnician.phone && (
                            <div className="text-xs text-gray-600 flex items-center mt-1">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {selectedTechnician.phone}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 flex items-center mt-1">
                            <EnvelopeIcon className="h-3 w-3 mr-1" />
                            {selectedTechnician.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTechnician(null);
                            setTechnicianSearch('');
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating account...' : 'Create Customer Account'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleTechnicianRegister}>
                <div>
                  <label htmlFor="tech-name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    id="tech-name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Your Full Name"
                  />
                </div>
                <div>
                  <label htmlFor="tech-email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    id="tech-email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="tech-phone" className="block text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <input
                    id="tech-phone"
                    name="phone"
                    type="tel"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label htmlFor="tech-company" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    id="tech-company"
                    name="companyName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label htmlFor="tech-password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    id="tech-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating account...' : 'Create Technician Account'}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowRegister(false);
                  setRegisterType('customer');
                  setSelectedTechnician(null);
                  setTechnicianSearch('');
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
