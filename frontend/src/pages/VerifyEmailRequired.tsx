import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const VerifyEmailRequired: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string } | null;
  const email = state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f7ff] dark:bg-[#080e1a] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-[#0d1b2e] rounded-2xl shadow-lg dark:shadow-[0_0_40px_rgba(0,100,200,0.12)] border border-gray-100 dark:border-[rgba(100,200,255,0.1)] p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-6">
            <EnvelopeIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#e8f4ff] mb-4">
            Bevestig je e-mailadres
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            Je kunt nog niet inloggen. Bevestig eerst je e-mailadres via de link in je inbox.
          </p>
          {email && (
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Controleer de e-mail die we hebben gestuurd naar <strong className="text-gray-900 dark:text-[#e8f4ff]">{email}</strong>.
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-500 mb-8">
            Geen e-mail ontvangen? Controleer je spam-map. De link is 24 uur geldig.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #00c8ff 0%, #0080ff 100%)' }}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Terug naar inloggen
          </Link>
        </div>
        <p className="mt-6 text-center text-xs font-['Rajdhani'] tracking-widest uppercase text-gray-400 dark:text-[#3a7aaa]">
          IntelliFrost &mdash; Smart Cold Intelligence
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailRequired;
