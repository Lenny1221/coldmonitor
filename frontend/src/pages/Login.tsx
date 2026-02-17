import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { techniciansApi, getErrorMessage } from '../services/api';
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
  const { login, loginWithToken, registerCustomer, registerTechnician } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = location.state as { message?: string } | null;

  // Berichten van e-mailverificatie of registratie
  const verifiedMsg = searchParams.get('verified') === '1' ? 'Je e-mail is bevestigd. Je kunt nu inloggen.' : null;
  const errorParam = searchParams.get('error');
  const errorMsg = errorParam === 'invalid_or_expired_token' ? 'De verificatielink is ongeldig of verlopen.' : errorParam === 'missing_token' ? 'Geen verificatietoken gevonden.' : errorParam === 'google_not_configured' ? 'Google-inloggen is niet geconfigureerd.' : null;
  const registerSuccessMsg = locationState?.message ?? null;

  // OAuth callback: token uit URL halen en inloggen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauth = params.get('oauth');
    if (oauth === '1' && oauthToken) {
      window.history.replaceState({}, '', '/login');
      loginWithToken(oauthToken).then(() => navigate('/')).catch(() => setError('OAuth-inloggen mislukt.'));
    }
  }, []);

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
      navigate('/');
    } catch (err: unknown) {
      const         msg = (err as { safeMessage?: string })?.safeMessage ?? getErrorMessage(err, 'Inloggen mislukt');
      setError(typeof msg === 'string' ? msg : 'Inloggen mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('passwordConfirm') as string;

    if (password !== passwordConfirm) {
      setError('De wachtwoorden komen niet overeen.');
      setLoading(false);
      return;
    }

    const data = {
      companyName: formData.get('companyName') as string,
      contactName: formData.get('contactName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      password,
      technicianId: selectedTechnician?.id || undefined,
    };

    try {
      await registerCustomer(data);
      navigate('/login', { state: { message: 'Controleer je e-mail om je account te bevestigen.' } });
    } catch (err: unknown) {
      const msg = (err as { safeMessage?: string })?.safeMessage ?? getErrorMessage(err, 'Registration failed');
      setError(typeof msg === 'string' ? msg : 'Registratie mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleTechnicianRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('passwordConfirm') as string;

    if (password !== passwordConfirm) {
      setError('De wachtwoorden komen niet overeen.');
      setLoading(false);
      return;
    }

    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      companyName: formData.get('companyName') as string,
      password,
    };

    try {
      await registerTechnician(data);
      navigate('/login', { state: { message: 'Controleer je e-mail om je account te bevestigen.' } });
    } catch (err: unknown) {
      const msg = (err as { safeMessage?: string })?.safeMessage ?? getErrorMessage(err, 'Registration failed');
      setError(typeof msg === 'string' ? msg : 'Registratie mislukt');
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
            IoT-koelmonitoringplatform
          </p>
        </div>

        {!showRegister ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {(verifiedMsg || registerSuccessMsg) && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-800">{verifiedMsg || registerSuccessMsg}</div>
              </div>
            )}
            {errorMsg && (
              <div className="rounded-md bg-amber-50 p-4">
                <div className="text-sm text-amber-800">{errorMsg}</div>
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{typeof error === 'string' ? error : 'Er is iets misgegaan'}</div>
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
                  placeholder="E-mailadres"
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
                  placeholder="Wachtwoord"
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
                {loading ? 'Bezig met inloggen...' : 'Inloggen'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">of</span>
              </div>
            </div>

            <div>
              <a
                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '')}/auth/google`}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Inloggen met Google
              </a>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Nog geen account? Registreren
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
                Klant
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
                Technicus
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{typeof error === 'string' ? error : 'Er is iets misgegaan'}</div>
              </div>
            )}

            {registerType === 'customer' ? (
              <form className="space-y-4" onSubmit={handleCustomerRegister}>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Bedrijfsnaam *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Jouw bedrijf"
                  />
                </div>
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                    Contactpersoon *
                  </label>
                  <input
                    id="contactName"
                    name="contactName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Jouw naam"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
                    E-mail *
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
                    Telefoon *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+32 123 456 789"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Adres *
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Straat, postcode, stad"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                    Wachtwoord *
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Minimaal 6 tekens"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password-confirm" className="block text-sm font-medium text-gray-700">
                    Wachtwoord bevestigen *
                  </label>
                  <input
                    id="reg-password-confirm"
                    name="passwordConfirm"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Herhaal wachtwoord"
                  />
                </div>
                
                {/* Technician Search */}
                <div className="relative" ref={dropdownRef}>
                  <label htmlFor="technicianSearch" className="block text-sm font-medium text-gray-700">
                    Koppelen aan technicus (optioneel)
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
                      placeholder="Zoek op naam, e-mail of bedrijf..."
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
                            Geselecteerd: {selectedTechnician.name}
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
                          Verwijderen
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
                    {loading ? 'Account aanmaken...' : 'Klantaccount aanmaken'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleTechnicianRegister}>
                <div>
                  <label htmlFor="tech-name" className="block text-sm font-medium text-gray-700">
                    Naam *
                  </label>
                  <input
                    id="tech-name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Volledige naam"
                  />
                </div>
                <div>
                  <label htmlFor="tech-email" className="block text-sm font-medium text-gray-700">
                    E-mail *
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
                    Telefoon *
                  </label>
                  <input
                    id="tech-phone"
                    name="phone"
                    type="tel"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+32 123 456 789"
                  />
                </div>
                <div>
                  <label htmlFor="tech-company" className="block text-sm font-medium text-gray-700">
                    Bedrijfsnaam *
                  </label>
                  <input
                    id="tech-company"
                    name="companyName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Jouw bedrijf"
                  />
                </div>
                <div>
                  <label htmlFor="tech-password" className="block text-sm font-medium text-gray-700">
                    Wachtwoord *
                  </label>
                  <input
                    id="tech-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Minimaal 6 tekens"
                  />
                </div>
                <div>
                  <label htmlFor="tech-password-confirm" className="block text-sm font-medium text-gray-700">
                    Wachtwoord bevestigen *
                  </label>
                  <input
                    id="tech-password-confirm"
                    name="passwordConfirm"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Herhaal wachtwoord"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Account aanmaken...' : 'Technicus account aanmaken'}
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
                Heb je al een account? Inloggen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
