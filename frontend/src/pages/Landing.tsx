import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BellAlertIcon,
  CubeIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const IntelliFrostLogo: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 72 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ filter: 'drop-shadow(0 0 14px rgba(0,200,255,0.55))' }}
  >
    <defs>
      <linearGradient id="lg-landing" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="50%" stopColor="#0096ff" />
        <stop offset="100%" stopColor="#00c8ff" />
      </linearGradient>
    </defs>
    <path d="M36 4 L62 19 L62 49 L36 64 L10 49 L10 19 Z" stroke="url(#lg-landing)" strokeWidth="1.2" fill="none" opacity="0.5" />
    <line x1="36" y1="8" x2="36" y2="64" stroke="url(#lg-landing)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="8" y1="36" x2="64" y2="36" stroke="url(#lg-landing)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="15" y1="15" x2="57" y2="57" stroke="url(#lg-landing)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <line x1="57" y1="15" x2="15" y2="57" stroke="url(#lg-landing)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <circle cx="36" cy="22" r="2.5" fill="url(#lg-landing)" />
    <circle cx="36" cy="50" r="2.5" fill="url(#lg-landing)" />
    <circle cx="22" cy="36" r="2.5" fill="url(#lg-landing)" />
    <circle cx="50" cy="36" r="2.5" fill="url(#lg-landing)" />
    <circle cx="36" cy="36" r="5.5" fill="url(#lg-landing)" opacity="0.9" />
    <circle cx="36" cy="36" r="3" fill="#0a1520" />
    <circle cx="36" cy="36" r="1.5" fill="url(#lg-landing)" />
  </svg>
);

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-frost-950 text-gray-900 dark:text-frost-100">
      {/* Header met Inloggen-knop rechtsboven */}
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
        <Link
          to="/login"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Inloggen
        </Link>
      </header>

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-20">
          <h1 className="font-['Exo_2'] font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 dark:text-frost-100 mb-4">
            Monitor. Alarm. Overal.
          </h1>
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl text-[#00c8ff] mb-8">
            IntelliFrost
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto mb-10">
            Dankzij IntelliFrost wordt het monitoren van koel- en vriescellen eenvoudig en betrouwbaar:
          </p>
          <ul className="text-left max-w-xl mx-auto space-y-3 text-gray-700 dark:text-slate-300 mb-12">
            <li className="flex items-start gap-2">
              <span className="text-[#00c8ff] mt-0.5">•</span>
              IoT-loggers voor temperatuur en deurstatus
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c8ff] mt-0.5">•</span>
              Escalatie bij overschrijden van grenswaarden (e-mail → SMS → AI-telefoon)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c8ff] mt-0.5">•</span>
              Online dashboard met realtime grafieken
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c8ff] mt-0.5">•</span>
              Koppeling technicus–klant voor snelle interventie
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00c8ff] mt-0.5">•</span>
              Automatische rapportage en historiek
            </li>
          </ul>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors text-lg"
          >
            Ga naar het platform
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </Link>
        </section>

        {/* Oplossingen */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <h2 className="font-['Exo_2'] text-2xl font-bold text-center mb-12 text-gray-900 dark:text-frost-100">
            Onze oplossingen
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 hover:border-[#00c8ff]/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center mb-4">
                <CubeIcon className="h-6 w-6 text-[#00c8ff]" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-frost-100">Koelcelmonitoring</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Bewaak temperatuur en deurstatus van uw koel- en vriescellen in realtime. Ontvang direct een melding bij afwijkingen.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 hover:border-[#00c8ff]/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center mb-4">
                <BellAlertIcon className="h-6 w-6 text-[#00c8ff]" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-frost-100">Escalatie in lagen</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                E-mail, SMS en AI-telefoon bij niet-reageren. Backup contacten en technicus worden automatisch ingeschakeld.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 hover:border-[#00c8ff]/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-[#00c8ff]" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-frost-100">Rapportage</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Grafieken, historiek en overzichten. Ideaal voor compliance en traceerbaarheid van temperatuurgegevens.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-['Exo_2'] text-2xl font-bold mb-4 text-gray-900 dark:text-frost-100">
            Contacteer ons
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-8">
            Benieuwd naar de mogelijkheden van IntelliFrost? Neem contact op voor meer informatie.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
          >
            <EnvelopeIcon className="h-5 w-5" />
            Ga naar inloggen
          </Link>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-frost-800 py-6 text-center text-sm text-gray-500 dark:text-slate-500">
        IntelliFrost – Smart Cold Intelligence
      </footer>
    </div>
  );
};

export default Landing;
