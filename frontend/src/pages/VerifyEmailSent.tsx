import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

/**
 * Pagina na succesvolle registratie: toont dat er een e-mail is verzonden
 * en dat de gebruiker eerst moet activeren voor hij kan inloggen.
 */
const VerifyEmailSent: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string } | null;
  const email = state?.email;

  // Zonder e-mail (directe URL) → terug naar login
  if (!email) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <EnvelopeIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Controleer je e-mail
          </h1>
          <p className="text-gray-600 mb-6">
            We hebben een e-mail gestuurd naar <strong className="text-gray-900">{email}</strong>.
          </p>
          <p className="text-gray-600 mb-8">
            Klik op de link in de e-mail om je account te activeren. Pas daarna kun je inloggen op je nieuwe account.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Geen e-mail ontvangen? Controleer je spam-map. De link is 24 uur geldig.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Naar inloggen
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          ColdMonitor – IoT-koelmonitoringplatform
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailSent;
