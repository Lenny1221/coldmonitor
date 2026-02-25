import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Handleidingen: React.FC = () => {
  const manuals = [
    { title: 'Aan de slag met IntelliFrost', desc: 'Registratie, eerste inlog en dashboard-overzicht' },
    { title: 'Koelcellen beheren', desc: 'Locaties toevoegen, koelcellen configureren en drempelwaarden instellen' },
    { title: 'Alarminstellingen', desc: 'Escalatielagen, backup contacten en tijdsloten configureren' },
    { title: 'Technicus-koppeling', desc: 'Uitnodigingen accepteren en klanten koppelen' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6">
      <h1 className="font-['Exo_2'] text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
        Handleidingen
      </h1>
      <p className="text-lg text-gray-600 dark:text-slate-400 mb-12">
        Stapsgewijze handleidingen om snel aan de slag te gaan met IntelliFrost.
      </p>

      <div className="space-y-4 mb-12">
        {manuals.map((m, i) => (
          <div
            key={i}
            className="flex gap-4 p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800"
          >
            <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="h-6 w-6 text-[#00c8ff]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-frost-100 mb-1">{m.title}</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl bg-[#00c8ff]/10 border border-[#00c8ff]/30 text-center">
        <p className="text-gray-700 dark:text-slate-300 mb-4">
          Log in op het platform om toegang te krijgen tot de volledige handleidingen en video-tutorials.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Ga naar inloggen
        </Link>
      </div>
    </div>
  );
};

export default Handleidingen;
