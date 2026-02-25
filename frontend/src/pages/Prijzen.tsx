import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/24/outline';

const Prijzen: React.FC = () => {
  const features = [
    'Onbeperkt aantal koelcellen',
    'Realtime monitoring',
    'Escalatie (e-mail, SMS, AI-telefoon)',
    'Dashboard & grafieken',
    'Technicus-koppeling',
    'Backup contacten',
    'Historische data',
  ];

  return (
    <div className="max-w-4xl mx-auto px-6">
      <h1 className="font-['Exo_2'] text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
        Prijzen
      </h1>
      <p className="text-lg text-gray-600 dark:text-slate-400 mb-12">
        Transparante prijzen op maat van uw bedrijf. Neem contact op voor een offerte op maat.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-frost-900 border-2 border-[#00c8ff]/50">
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-2">
            Starter
          </h2>
          <p className="text-3xl font-bold text-[#00c8ff] mb-8">Op maat</p>
          <ul className="space-y-3 mb-8">
            {features.slice(0, 4).map((f) => (
              <li key={f} className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                <CheckIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="block w-full text-center py-3 rounded-lg font-medium text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
          >
            Vraag offerte aan
          </Link>
        </div>

        <div className="p-8 rounded-2xl bg-gray-50 dark:bg-frost-900 border-2 border-[#00c8ff]">
          <div className="text-xs font-medium text-[#00c8ff] mb-2">POPULAIR</div>
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-2">
            Professional
          </h2>
          <p className="text-3xl font-bold text-[#00c8ff] mb-8">Op maat</p>
          <ul className="space-y-3 mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                <CheckIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="block w-full text-center py-3 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            Vraag offerte aan
          </Link>
        </div>
      </div>

      <p className="text-center text-gray-600 dark:text-slate-400 text-sm">
        Prijzen zijn afhankelijk van het aantal locaties, koelcellen en gewenste functionaliteit. Neem contact op voor een vrijblijvende offerte.
      </p>
    </div>
  );
};

export default Prijzen;
