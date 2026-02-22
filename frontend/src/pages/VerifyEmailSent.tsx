import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const VerifyEmailSent: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string } | null;
  const email = state?.email;

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f7ff] dark:bg-[#080e1a] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-frost-800 rounded-2xl shadow-lg dark:shadow-[0_0_40px_rgba(0,100,200,0.12)] border border-gray-100 dark:border-[rgba(100,200,255,0.1)] p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
            <EnvelopeIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-frost-100 mb-4">
            Controleer je e-mail
          </h1>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            We hebben een e-mail gestuurd naar <strong className="text-gray-900 dark:text-frost-100">{email}</strong>.
          </p>
          <p className="text-gray-600 dark:text-slate-300 mb-8">
            Klik op de link in de e-mail om je account te activeren. Pas daarna kun je inloggen op je nieuwe account.
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
            Geen e-mail ontvangen? Controleer je spam-map. De link is 24 uur geldig.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #00c8ff 0%, #0080ff 100%)' }}
          >
            Naar inloggen
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-6 text-center text-xs font-['Rajdhani'] tracking-widest uppercase text-gray-400 dark:text-[#3a7aaa]">
          IntelliFrost &mdash; Smart Cold Intelligence
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailSent;
