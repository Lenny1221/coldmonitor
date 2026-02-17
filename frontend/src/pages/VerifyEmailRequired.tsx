import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Pagina wanneer iemand probeert in te loggen zonder e-mail bevestigd te hebben.
 */
const VerifyEmailRequired: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string } | null;
  const email = state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
            <EnvelopeIcon className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Bevestig je e-mailadres
          </h1>
          <p className="text-gray-600 mb-6">
            Je kunt nog niet inloggen. Bevestig eerst je e-mailadres via de link in je inbox.
          </p>
          {email && (
            <p className="text-gray-600 mb-6">
              Controleer de e-mail die we hebben gestuurd naar <strong className="text-gray-900">{email}</strong>.
            </p>
          )}
          <p className="text-sm text-gray-500 mb-8">
            Geen e-mail ontvangen? Controleer je spam-map. De link is 24 uur geldig.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Terug naar inloggen
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          ColdMonitor – IoT-koelmonitoringplatform
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailRequired;
