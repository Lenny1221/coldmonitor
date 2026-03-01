import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

/** Inline IntelliFrost logo – voorkomt wit vakje bij laadfout */
const IntelliFrostLogo: React.FC<{ size?: number; className?: string }> = ({ size = 40, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 72 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ filter: 'drop-shadow(0 0 10px rgba(0,200,255,0.5))' }}
  >
    <defs>
      <linearGradient id="ml-grad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="50%" stopColor="#0096ff" />
        <stop offset="100%" stopColor="#00c8ff" />
      </linearGradient>
    </defs>
    <path d="M36 4 L62 19 L62 49 L36 64 L10 49 L10 19 Z" stroke="url(#ml-grad)" strokeWidth="1.2" fill="none" opacity="0.5" />
    <line x1="36" y1="8" x2="36" y2="64" stroke="url(#ml-grad)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="8" y1="36" x2="64" y2="36" stroke="url(#ml-grad)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="15" y1="15" x2="57" y2="57" stroke="url(#ml-grad)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <line x1="57" y1="15" x2="15" y2="57" stroke="url(#ml-grad)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <line x1="36" y1="8" x2="30" y2="14" stroke="url(#ml-grad)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="36" y1="8" x2="42" y2="14" stroke="url(#ml-grad)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="36" y1="64" x2="30" y2="58" stroke="url(#ml-grad)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="36" y1="64" x2="42" y2="58" stroke="url(#ml-grad)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="8" y1="36" x2="14" y2="30" stroke="url(#ml-grad)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="8" y1="36" x2="14" y2="42" stroke="url(#ml-grad)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="64" y1="36" x2="58" y2="30" stroke="url(#ml-grad)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="64" y1="36" x2="58" y2="42" stroke="url(#ml-grad)" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="36" cy="22" r="2.5" fill="url(#ml-grad)" />
    <circle cx="36" cy="50" r="2.5" fill="url(#ml-grad)" />
    <circle cx="22" cy="36" r="2.5" fill="url(#ml-grad)" />
    <circle cx="50" cy="36" r="2.5" fill="url(#ml-grad)" />
    <circle cx="36" cy="36" r="5.5" fill="url(#ml-grad)" opacity="0.9" />
    <circle cx="36" cy="36" r="3" fill="#0a1520" />
    <circle cx="36" cy="36" r="1.5" fill="url(#ml-grad)" />
  </svg>
);

/** Made in Belgium logo – zwarte tekst met Belgische vlagstrepen */
const MadeInBelgiumLogo: React.FC<{ className?: string; compact?: boolean }> = ({ className, compact }) => {
  const isCompact = compact;
  if (isCompact) {
    return (
      <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
        <div className="flex w-6 h-1.5 rounded-sm overflow-hidden shrink-0">
          <span className="flex-1 bg-[#000000]" />
          <span className="flex-1 bg-[#FDDA24]" />
          <span className="flex-1 bg-[#EF3340]" />
        </div>
        <span className="font-medium tracking-wide text-gray-700 uppercase text-[9px] whitespace-nowrap" style={{ fontFamily: 'sans-serif' }}>
          Made in Belgium
        </span>
      </div>
    );
  }
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className ?? ''}`}>
      <div className={`flex w-full ${'max-w-[120px] h-0.5'}`}>
        <span className="flex-1 bg-[#000000]" />
        <span className="flex-1 bg-[#FDDA24]" />
        <span className="flex-1 bg-[#EF3340]" />
      </div>
      <span className={`font-medium tracking-wide text-gray-700 uppercase text-[10px] sm:text-xs`} style={{ fontFamily: 'sans-serif' }}>
        Made in Belgium
      </span>
      <div className={`flex w-full max-w-[120px] h-0.5`}>
        <span className="flex-1 bg-[#000000]" />
        <span className="flex-1 bg-[#FDDA24]" />
        <span className="flex-1 bg-[#EF3340]" />
      </div>
    </div>
  );
};

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

  // Force light mode op marketingpagina's – altijd dezelfde kleuren op elke PC
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    return () => {
      root.style.colorScheme = '';
      const saved = localStorage.getItem('intellifrost-theme');
      if (saved === 'dark') root.classList.add('dark');
    };
  }, []);

  return (
    <div className="marketing-light min-h-screen bg-white text-[#212529]" data-marketing="true" style={{ colorScheme: 'light' }}>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-6 px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <IntelliFrostLogo size={40} />
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

        <nav className="hidden md:flex items-center gap-6 shrink-0">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === to
                  ? 'text-[#00c8ff]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 ml-auto shrink-0">
          <MadeInBelgiumLogo compact className="hidden lg:flex" />
          <Link
            to="/login"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors lg:pl-4 lg:border-l lg:border-gray-200"
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
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <IntelliFrostLogo size={24} />
            <span className="text-sm text-gray-500">IntelliFrost – Slimme koelbewaking</span>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-end gap-6">
            {navItems.map(({ to, label }) => (
              <Link key={to} to={to} className="text-sm text-gray-500 hover:text-[#00c8ff] shrink-0">
                {label}
              </Link>
            ))}
            <MadeInBelgiumLogo compact className="ml-4 pl-4 border-l border-gray-200 shrink-0" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
