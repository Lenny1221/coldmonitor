import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  HomeIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  CubeIcon,
  UserGroupIcon,
  EnvelopeIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const IntelliFrostLogo: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 72 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 8px rgba(0,200,255,0.45))' }}
  >
    <defs>
      <linearGradient id="lg-layout" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="50%" stopColor="#0096ff" />
        <stop offset="100%" stopColor="#00c8ff" />
      </linearGradient>
    </defs>
    <path d="M36 4 L62 19 L62 49 L36 64 L10 49 L10 19 Z" stroke="url(#lg-layout)" strokeWidth="1.2" fill="none" opacity="0.5" />
    <line x1="36" y1="8" x2="36" y2="64" stroke="url(#lg-layout)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="8" y1="36" x2="64" y2="36" stroke="url(#lg-layout)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="15" y1="15" x2="57" y2="57" stroke="url(#lg-layout)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <line x1="57" y1="15" x2="15" y2="57" stroke="url(#lg-layout)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <line x1="36" y1="8"  x2="30" y2="14" stroke="url(#lg-layout)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="36" y1="8"  x2="42" y2="14" stroke="url(#lg-layout)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="36" y1="64" x2="30" y2="58" stroke="url(#lg-layout)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="36" y1="64" x2="42" y2="58" stroke="url(#lg-layout)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="8"  y1="36" x2="14" y2="30" stroke="url(#lg-layout)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="8"  y1="36" x2="14" y2="42" stroke="url(#lg-layout)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="64" y1="36" x2="58" y2="30" stroke="url(#lg-layout)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="64" y1="36" x2="58" y2="42" stroke="url(#lg-layout)" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="36" cy="22" r="2.5" fill="url(#lg-layout)" />
    <circle cx="36" cy="50" r="2.5" fill="url(#lg-layout)" />
    <circle cx="22" cy="36" r="2.5" fill="url(#lg-layout)" />
    <circle cx="50" cy="36" r="2.5" fill="url(#lg-layout)" />
    <circle cx="36" cy="36" r="5.5" fill="url(#lg-layout)" opacity="0.9" />
    <circle cx="36" cy="36" r="3" fill="#0a1520" />
    <circle cx="36" cy="36" r="1.5" fill="url(#lg-layout)" />
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setSidebarOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navLinks =
    user?.role === 'CUSTOMER'
      ? [
          { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
          { to: '/alarmeringen', label: 'Alarmeringen', icon: BellIcon },
          { to: '/locations', label: 'Locaties', icon: MapPinIcon },
          { to: '/coldcells', label: 'Koelcellen', icon: CubeIcon },
          { to: '/invitations', label: 'Uitnodigingen', icon: EnvelopeIcon },
          { to: '/settings', label: 'Instellingen', icon: Cog6ToothIcon },
        ]
      : user?.role === 'TECHNICIAN' || user?.role === 'ADMIN'
        ? [
            { to: '/technician', label: 'Dashboard', icon: HomeIcon },
            { to: '/alarmeringen', label: 'Alarmeringen', icon: BellIcon },
            { to: '/technician/customers', label: 'Klanten beheren', icon: UserGroupIcon },
          ]
        : [];

  const userDisplay = user?.profile?.contactName || user?.profile?.name || user?.email || 'Gebruiker';

  return (
    <div className="min-h-screen flex bg-frost-50 dark:bg-frost-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-white dark:bg-frost-800
          border-r border-gray-200 dark:border-[rgba(100,200,255,0.1)]
          shadow-sm dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)]
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header – Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-[rgba(100,200,255,0.1)] shrink-0">
          <div className="flex items-center gap-2.5">
            <IntelliFrostLogo size={32} />
            <div className="leading-none">
              <div className="flex items-baseline">
                <span className="font-['Exo_2'] font-light text-lg text-gray-800 dark:text-frost-100 tracking-tight">Intelli</span>
                <span
                  className="font-['Exo_2'] font-black text-lg tracking-tight"
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
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-frost-850"
            aria-label="Menu sluiten"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = isActive(to) || isActivePrefix(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${active
                    ? 'bg-gradient-to-r from-[#00c8ff]/10 to-[#0080ff]/10 dark:from-[#00c8ff]/15 dark:to-[#0080ff]/15 text-[#0080ff] dark:text-[#00c8ff] border border-[#00c8ff]/20 dark:border-[rgba(0,200,255,0.25)]'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-frost-850 hover:text-gray-900 dark:hover:text-frost-100'
                  }
                `}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-[#0080ff] dark:text-[#00c8ff]' : ''}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: user info + theme toggle + logout */}
        <div className="border-t border-gray-200 dark:border-[rgba(100,200,255,0.1)] p-4 shrink-0 space-y-3">
          {/* User info */}
          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-frost-100 truncate" title={userDisplay}>
              {userDisplay}
            </div>
            <div className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
              {user?.role === 'CUSTOMER' ? 'Klant' : user?.role === 'TECHNICIAN' ? 'Technicus' : user?.role === 'ADMIN' ? 'Beheerder' : user?.role}
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150
              text-gray-600 dark:text-slate-200
              bg-gray-100 dark:bg-frost-850
              hover:bg-gray-200 dark:hover:bg-[rgba(0,150,255,0.1)]
              border border-gray-200 dark:border-[rgba(100,200,255,0.12)]"
            aria-label="Thema wisselen"
          >
            {theme === 'dark' ? (
              <>
                <SunIcon className="h-4 w-4 text-amber-400" />
                <span>Lichte modus</span>
              </>
            ) : (
              <>
                <MoonIcon className="h-4 w-4 text-[#0080ff]" />
                <span>Donkere modus</span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center h-14 px-4
          bg-white dark:bg-frost-800
          border-b border-gray-200 dark:border-[rgba(100,200,255,0.1)]
          shadow-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-frost-900"
            aria-label="Menu openen"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <IntelliFrostLogo size={22} />
            <div className="flex items-baseline">
              <span className="font-['Exo_2'] font-light text-base text-gray-800 dark:text-frost-100">Intelli</span>
              <span
                className="font-['Exo_2'] font-black text-base"
                style={{
                  background: 'linear-gradient(135deg, #00c8ff 0%, #0080ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Frost
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-frost-850"
              aria-label="Thema wisselen"
            >
              {theme === 'dark'
                ? <SunIcon className="h-5 w-5 text-amber-400" />
                : <MoonIcon className="h-5 w-5 text-[#0080ff]" />
              }
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
