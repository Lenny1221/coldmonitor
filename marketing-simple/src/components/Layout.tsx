import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Logo = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(0,200,255,0.4))' }}>
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="100%" stopColor="#00c8ff" />
      </linearGradient>
    </defs>
    <path d="M36 4 L62 19 L62 49 L36 64 L10 49 L10 19 Z" stroke="url(#lg)" strokeWidth="1.4" fill="none" opacity="0.5" />
    <line x1="36" y1="8" x2="36" y2="64" stroke="url(#lg)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="8" y1="36" x2="64" y2="36" stroke="url(#lg)" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="36" cy="36" r="5.5" fill="url(#lg)" opacity="0.9" />
    <circle cx="36" cy="36" r="3" fill="#0a1520" />
  </svg>
);

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/product', label: 'Product' },
  { to: '/oplossingen', label: 'Oplossingen' },
  { to: '/prijzen', label: 'Prijzen' },
  { to: '/servicepartner', label: 'Servicepartner' },
  { to: '/handleidingen', label: 'Handleidingen' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo />
            <span className="font-display text-lg tracking-tight">
              <span className="font-light text-gray-800">Intelli</span>
              <span className="font-extrabold text-brand">Frost</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-brand' : 'text-gray-600 hover:text-navy'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/contact"
              className="hidden sm:inline-flex bg-brand text-navy font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors text-sm"
            >
              Gratis demo
            </Link>
            <a
              href="https://intellifrost.be/login"
              className="hidden sm:inline-flex items-center gap-1.5 border border-brand text-brand font-medium px-4 py-2 rounded-lg hover:bg-brand/10 transition-colors text-sm"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Inloggen
            </a>
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Menu"
            >
              {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden border-t border-gray-100 bg-white px-5 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2.5 text-base font-medium ${isActive ? 'text-brand' : 'text-gray-700'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-3 bg-brand text-navy text-center font-semibold py-2.5 rounded-lg"
            >
              Gratis demo aanvragen
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="bg-navy text-white/70 text-sm">
        <div className="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Logo size={28} />
              <span className="font-display text-white text-lg font-semibold">IntelliFrost</span>
            </div>
            <p className="text-white/50 leading-relaxed">
              24/7 koelcelbewaking voor horeca, retail &amp; zorg. Wij detecteren én lossen op — samen met
              servicepartner Serv-Ice.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Pagina's</p>
            <ul className="space-y-2">
              {navItems.slice(0, 4).map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-brand">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Meer</p>
            <ul className="space-y-2">
              {navItems.slice(4).map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-brand">{item.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/app" className="hover:text-brand">Mobiele app</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Contact</p>
            <ul className="space-y-2">
              <li><a href="mailto:info@intellifrost.be" className="hover:text-brand">info@intellifrost.be</a></li>
              <li><a href="tel:+32468429719" className="hover:text-brand">+32 468 42 97 19</a></li>
              <li className="text-white/50">België &amp; Nederland</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-5 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/40">
            <span>© {new Date().getFullYear()} IntelliFrost — Made in Belgium</span>
            <span>HACCP · GDP · GMP compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
