import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const IntelliFrostLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 72 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 14px rgba(0,200,255,0.55))' }}
  >
    <defs>
      <linearGradient id="lg-mkt" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="50%" stopColor="#0096ff" />
        <stop offset="100%" stopColor="#00c8ff" />
      </linearGradient>
    </defs>
    <path d="M36 4 L62 19 L62 49 L36 64 L10 49 L10 19 Z" stroke="url(#lg-mkt)" strokeWidth="1.2" fill="none" opacity="0.5" />
    <line x1="36" y1="8" x2="36" y2="64" stroke="url(#lg-mkt)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="8" y1="36" x2="64" y2="36" stroke="url(#lg-mkt)" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="36" cy="22" r="2.5" fill="url(#lg-mkt)" />
    <circle cx="36" cy="50" r="2.5" fill="url(#lg-mkt)" />
    <circle cx="22" cy="36" r="2.5" fill="url(#lg-mkt)" />
    <circle cx="50" cy="36" r="2.5" fill="url(#lg-mkt)" />
    <circle cx="36" cy="36" r="5.5" fill="url(#lg-mkt)" opacity="0.9" />
    <circle cx="36" cy="36" r="3" fill="#0a1520" />
    <circle cx="36" cy="36" r="1.5" fill="url(#lg-mkt)" />
  </svg>
);

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/product', label: 'Product' },
  { to: '/oplossingen', label: 'Oplossingen' },
  { to: '/prijzen', label: 'Prijzen' },
  { to: '/handleidingen', label: 'Handleidingen' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-frost-950 text-gray-900 dark:text-frost-100">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-frost-900/90 backdrop-blur-md border-b border-gray-200 dark:border-frost-800">
        <Link to="/" className="flex items-center gap-3">
          <IntelliFrostLogo size={40} />
          <div>
            <span className="font-['Exo_2'] font-light text-xl tracking-tight text-gray-800 dark:text-frost-100">Intelli</span>
            <span
              className="font-['Exo_2'] font-black text-xl tracking-tight"
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
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'text-[#00c8ff]'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-frost-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Inloggen
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-frost-800"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-20 bg-white dark:bg-frost-950 md:hidden">
          <nav className="flex flex-col p-6 gap-4">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 text-lg font-medium ${
                  location.pathname === to ? 'text-[#00c8ff]' : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 mt-4 px-5 py-3 rounded-lg font-medium text-white bg-[#00c8ff]"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Inloggen
            </Link>
          </nav>
        </div>
      )}

      <main className="pt-24 pb-16">{children}</main>

      <footer className="border-t border-gray-200 dark:border-frost-800 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-slate-500">IntelliFrost – Smart Cold Intelligence</span>
          <div className="flex gap-6">
            {navItems.map(({ to, label }) => (
              <Link key={to} to={to} className="text-sm text-gray-500 dark:text-slate-500 hover:text-[#00c8ff]">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
