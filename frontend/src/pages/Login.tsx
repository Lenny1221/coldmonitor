import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { techniciansApi, getErrorMessage } from '../services/api';
import { MagnifyingGlassIcon, PhoneIcon, EnvelopeIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

type RegisterType = 'customer' | 'technician';

const IntelliFrostMark: React.FC = () => (
  <div className="flex flex-col items-center gap-3 mb-2">
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 0 14px rgba(0,200,255,0.55))' }}>
      <defs>
        <linearGradient id="lg-login" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="50%" stopColor="#0096ff" />
          <stop offset="100%" stopColor="#00c8ff" />
        </linearGradient>
        <filter id="glow-login">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M36 4 L62 19 L62 49 L36 64 L10 49 L10 19 Z" stroke="url(#lg-login)" strokeWidth="1.2" fill="none" opacity="0.5" />
      <line x1="36" y1="8" x2="36" y2="64" stroke="url(#lg-login)" strokeWidth="2.2" strokeLinecap="round" filter="url(#glow-login)" />
      <line x1="8" y1="36" x2="64" y2="36" stroke="url(#lg-login)" strokeWidth="2.2" strokeLinecap="round" filter="url(#glow-login)" />
      <line x1="15" y1="15" x2="57" y2="57" stroke="url(#lg-login)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <line x1="57" y1="15" x2="15" y2="57" stroke="url(#lg-login)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <line x1="36" y1="8"  x2="30" y2="14" stroke="url(#lg-login)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="36" y1="8"  x2="42" y2="14" stroke="url(#lg-login)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="36" y1="64" x2="30" y2="58" stroke="url(#lg-login)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="36" y1="64" x2="42" y2="58" stroke="url(#lg-login)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8"  y1="36" x2="14" y2="30" stroke="url(#lg-login)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8"  y1="36" x2="14" y2="42" stroke="url(#lg-login)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="64" y1="36" x2="58" y2="30" stroke="url(#lg-login)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="64" y1="36" x2="58" y2="42" stroke="url(#lg-login)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="36" cy="22" r="2.5" fill="url(#lg-login)" />
      <circle cx="36" cy="50" r="2.5" fill="url(#lg-login)" />
      <circle cx="22" cy="36" r="2.5" fill="url(#lg-login)" />
      <circle cx="50" cy="36" r="2.5" fill="url(#lg-login)" />
      <circle cx="36" cy="36" r="5.5" fill="url(#lg-login)" opacity="0.9" />
      <circle cx="36" cy="36" r="3" fill="#0a1520" />
      <circle cx="36" cy="36" r="1.5" fill="url(#lg-login)" />
    </svg>
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-0">
        <span className="font-['Exo_2'] font-light text-4xl tracking-tight text-gray-800 dark:text-[#e8f4ff]">Intelli</span>
        <span
          className="font-['Exo_2'] font-black text-4xl tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #00c8ff 0%, #0080ff 60%, #00e5ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Frost
        </span>
      </div>
      <p className="mt-1 text-xs tracking-[4px] uppercase font-['Rajdhani'] text-[#5590bb] dark:text-[#3a7aaa]">
        Smart Cold Intelligence
      </p>
    </div>
  </div>
);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerType, setRegisterType] = useState<RegisterType>('customer');
  const { theme, toggleTheme } = useTheme();
  const [technicianSearch, setTechnicianSearch] = useState('');
  const [technicianResults, setTechnicianResults] = useState<any[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<any | null>(null);
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { login, loginWithToken, registerCustomer, registerTechnician } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Berichten van e-mailverificatie of registratie
  const verifiedMsg = searchParams.get('verified') === '1' ? 'Je e-mail is bevestigd. Je kunt nu inloggen.' : null;
  const errorParam = searchParams.get('error');
  const errorMsg = errorParam === 'invalid_or_expired_token' ? 'De verificatielink is ongeldig of verlopen.' : errorParam === 'missing_token' ? 'Geen verificatietoken gevonden.' : errorParam === 'google_not_configured' ? 'Google-inloggen is niet geconfigureerd.' : errorParam === 'email_not_verified' ? 'Bevestig eerst je e-mailadres via de link in je inbox.' : null;

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
      const ax = err as { response?: { data?: { code?: string } } };
      if (ax.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email-required', { state: { email } });
        return;
      }
      const msg = (err as { safeMessage?: string })?.safeMessage ?? getErrorMessage(err, 'Inloggen mislukt');
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
      navigate('/verify-email-sent', { state: { email: data.email } });
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
      navigate('/verify-email-sent', { state: { email: data.email } });
    } catch (err: unknown) {
      const msg = (err as { safeMessage?: string })?.safeMessage ?? getErrorMessage(err, 'Registration failed');
      setError(typeof msg === 'string' ? msg : 'Registratie mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f7ff] dark:bg-[#080e1a] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Theme toggle top-right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2.5 rounded-xl border border-gray-200 dark:border-[rgba(100,200,255,0.15)] bg-white dark:bg-frost-800 text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-frost-850 shadow-sm transition-all"
        aria-label="Thema wisselen"
      >
        {theme === 'dark'
          ? <SunIcon className="h-5 w-5 text-amber-400" />
          : <MoonIcon className="h-5 w-5 text-[#0080ff]" />
        }
      </button>

      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <IntelliFrostMark />
        </div>

        {/* Card wrapper */}
        <div className="bg-white dark:bg-frost-800 rounded-2xl shadow-lg dark:shadow-[0_0_40px_rgba(0,100,200,0.12)] border border-gray-100 dark:border-[rgba(100,200,255,0.1)] p-8 space-y-6">

        {!showRegister ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {verifiedMsg && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                <div className="text-sm text-green-800 dark:text-green-300">{verifiedMsg}</div>
              </div>
            )}
            {errorMsg && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                <div className="text-sm text-amber-800 dark:text-amber-300">{errorMsg}</div>
              </div>
            )}
          {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="text-sm text-red-800 dark:text-red-300">{typeof error === 'string' ? error : 'Er is iets misgegaan'}</div>
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-400 text-gray-900 dark:text-frost-100 bg-white dark:bg-frost-850 rounded-t-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] focus:z-10 sm:text-sm"
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-400 text-gray-900 dark:text-frost-100 bg-white dark:bg-frost-850 rounded-b-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] focus:z-10 sm:text-sm"
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
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg, #00c8ff 0%, #0080ff 100%)' }}
              >
                {loading ? 'Bezig met inloggen...' : 'Inloggen'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-frost-800 text-gray-400 dark:text-slate-400">of</span>
              </div>
            </div>

            <div>
              <a
                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '')}/auth/google`}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-frost-850 hover:bg-gray-50 dark:hover:bg-[rgba(0,150,255,0.08)] transition-colors"
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
                className="text-sm text-[#0080ff] dark:text-[#00c8ff] hover:opacity-80 transition-opacity"
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
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg border transition-colors ${
                  registerType === 'customer'
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-[#0a1520] text-gray-700 dark:text-slate-300 border-gray-300 dark:border-[rgba(100,200,255,0.15)] hover:bg-gray-50 dark:hover:bg-[rgba(0,150,255,0.06)]'
                }`}
                style={registerType === 'customer' ? { background: 'linear-gradient(135deg, #00c8ff, #0080ff)' } : {}}
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
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg border-t border-r border-b transition-colors ${
                  registerType === 'technician'
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-[#0a1520] text-gray-700 dark:text-slate-300 border-gray-300 dark:border-[rgba(100,200,255,0.15)] hover:bg-gray-50 dark:hover:bg-[rgba(0,150,255,0.06)]'
                }`}
                style={registerType === 'technician' ? { background: 'linear-gradient(135deg, #00c8ff, #0080ff)' } : {}}
              >
                Technicus
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="text-sm text-red-800 dark:text-red-300">{typeof error === 'string' ? error : 'Er is iets misgegaan'}</div>
              </div>
            )}

            {registerType === 'customer' ? (
              <form className="space-y-4" onSubmit={handleCustomerRegister}>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Bedrijfsnaam *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Jouw bedrijf"
                  />
                </div>
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Contactpersoon *
                  </label>
                  <input
                    id="contactName"
                    name="contactName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Jouw naam"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    E-mail *
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Telefoon *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="+32 123 456 789"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Adres *
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Straat, postcode, stad"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Wachtwoord *
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Minimaal 6 tekens"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password-confirm" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Wachtwoord bevestigen *
                  </label>
                  <input
                    id="reg-password-confirm"
                    name="passwordConfirm"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Herhaal wachtwoord"
                  />
                </div>
                
                {/* Technician Search */}
                <div className="relative" ref={dropdownRef}>
                  <label htmlFor="technicianSearch" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
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
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-md leading-5 bg-white dark:bg-[#0a1520] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] focus:outline-none focus:ring-1 focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                      placeholder="Zoek op naam, e-mail of bedrijf..."
                    />
                  </div>
                  
                  {/* Dropdown Results */}
                  {showTechnicianDropdown && technicianResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-frost-800 shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-[rgba(100,200,255,0.15)] ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {technicianResults.map((technician) => (
                        <div
                          key={technician.id}
                          onClick={() => {
                            setSelectedTechnician(technician);
                            setTechnicianSearch(`${technician.name}${technician.companyName ? ` - ${technician.companyName}` : ''}`);
                            setShowTechnicianDropdown(false);
                          }}
                          className="cursor-pointer hover:bg-[#e8f4ff] dark:hover:bg-[rgba(0,150,255,0.08)] px-4 py-2"
                        >
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-[#e8f4ff]">{technician.name}</div>
                              {technician.companyName && (
                                <div className="text-sm text-gray-500 dark:text-slate-400">{technician.companyName}</div>
                              )}
                              <div className="text-sm text-gray-500 dark:text-slate-400">{technician.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Selected Technician Display */}
                  {selectedTechnician && (
                    <div className="mt-2 p-3 bg-[#e8f4ff] dark:bg-[rgba(0,150,255,0.08)] border border-[#00c8ff]/30 dark:border-[rgba(0,200,255,0.2)] rounded-md">
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
                    className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all" style={{ background: "linear-gradient(135deg, #00c8ff 0%, #0080ff 100%)" }}
                  >
                    {loading ? 'Account aanmaken...' : 'Klantaccount aanmaken'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleTechnicianRegister}>
                <div>
                  <label htmlFor="tech-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Naam *
                  </label>
                  <input
                    id="tech-name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Volledige naam"
                  />
                </div>
                <div>
                  <label htmlFor="tech-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    E-mail *
                  </label>
                  <input
                    id="tech-email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="tech-phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Telefoon *
                  </label>
                  <input
                    id="tech-phone"
                    name="phone"
                    type="tel"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="+32 123 456 789"
                  />
                </div>
                <div>
                  <label htmlFor="tech-company" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Bedrijfsnaam *
                  </label>
                  <input
                    id="tech-company"
                    name="companyName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Jouw bedrijf"
                  />
                </div>
                <div>
                  <label htmlFor="tech-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Wachtwoord *
                  </label>
                  <input
                    id="tech-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Minimaal 6 tekens"
                  />
                </div>
                <div>
                  <label htmlFor="tech-password-confirm" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Wachtwoord bevestigen *
                  </label>
                  <input
                    id="tech-password-confirm"
                    name="passwordConfirm"
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-[#e8f4ff] bg-white dark:bg-[#0a1520] rounded-md focus:outline-none focus:ring-[#0080ff] focus:border-[#0080ff] sm:text-sm"
                    placeholder="Herhaal wachtwoord"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all" style={{ background: "linear-gradient(135deg, #00c8ff 0%, #0080ff 100%)" }}
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
                className="text-sm text-[#0080ff] dark:text-[#00c8ff] hover:opacity-80 transition-opacity"
              >
                Heb je al een account? Inloggen
              </button>
            </div>
          </div>
        )}
        </div>{/* end card */}

        <p className="text-center text-xs font-['Rajdhani'] tracking-widest uppercase text-gray-400 dark:text-[#3a7aaa]">
          IntelliFrost &mdash; Smart Cold Intelligence
        </p>
      </div>
    </div>
  );
};

export default Login;
