import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  CubeIcon,
  UserGroupIcon,
  EnvelopeIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
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

  // Sluit sidebar bij navigatie op mobiel
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navLinks =
    user?.role === 'CUSTOMER'
      ? [
          { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
          { to: '/locations', label: 'Locaties', icon: MapPinIcon },
          { to: '/coldcells', label: 'Koelcellen', icon: CubeIcon },
          { to: '/invitations', label: 'Uitnodigingen', icon: EnvelopeIcon },
        ]
      : user?.role === 'TECHNICIAN' || user?.role === 'ADMIN'
        ? [
            { to: '/technician', label: 'Dashboard', icon: HomeIcon },
            { to: '/technician/customers', label: 'Klanten beheren', icon: UserGroupIcon },
          ]
        : [];

  const userDisplay = user?.profile?.contactName || user?.profile?.name || user?.email || 'Gebruiker';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay op mobiel wanneer sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header sidebar */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
            <h1 className="text-xl font-bold text-blue-600">ColdMonitor</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Menu sluiten"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigatie */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive(to) || isActivePrefix(to + '/')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Gebruiker + Logout */}
          <div className="border-t border-gray-200 p-4 shrink-0">
            <div className="text-xs text-gray-500 mb-2 truncate" title={userDisplay}>
              {userDisplay}
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {user?.role === 'CUSTOMER' ? 'Klant' : user?.role === 'TECHNICIAN' ? 'Technicus' : user?.role === 'ADMIN' ? 'Beheerder' : user?.role}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
              Uitloggen
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobiel: hamburger + titel) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center h-14 px-4 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Menu openen"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="ml-3 font-medium text-gray-900 truncate">
            {navLinks.find((l) => isActive(l.to) || isActivePrefix(l.to + '/'))?.label || 'ColdMonitor'}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
