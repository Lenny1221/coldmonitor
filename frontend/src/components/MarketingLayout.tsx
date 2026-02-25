import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-white text-gray-900">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/intellifrost-logo.svg"
            alt="IntelliFrost logo"
            width={40}
            height={40}
            style={{ filter: 'drop-shadow(0 0 10px rgba(0,200,255,0.5))' }}
          />
          <div>
            <span className="font-['Exo_2'] font-light text-xl tracking-tight text-gray-800">Intelli</span>
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
                  : 'text-gray-600 hover:text-gray-900'
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
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-20 bg-white md:hidden">
          <nav className="flex flex-col p-6 gap-4">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 text-lg font-medium ${
                  location.pathname === to ? 'text-[#00c8ff]' : 'text-gray-600'
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

      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/intellifrost-logo.svg" alt="IntelliFrost" width={24} height={24} />
            <span className="text-sm text-gray-500">IntelliFrost – Smart Cold Intelligence</span>
          </div>
          <div className="flex gap-6">
            {navItems.map(({ to, label }) => (
              <Link key={to} to={to} className="text-sm text-gray-500 hover:text-[#00c8ff]">
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
