import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BellAlertIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  return (
    <>
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors text-lg"
          >
            Ga naar het platform
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors text-lg"
          >
            Contacteer ons
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 mb-20">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-center mb-12 text-gray-900 dark:text-frost-100">
          Onze oplossingen
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/oplossingen" className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 hover:border-[#00c8ff]/40 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center mb-4">
              <CubeIcon className="h-6 w-6 text-[#00c8ff]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-frost-100">Koelcelmonitoring</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Bewaak temperatuur en deurstatus van uw koel- en vriescellen in realtime.
            </p>
          </Link>
          <Link to="/oplossingen" className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 hover:border-[#00c8ff]/40 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center mb-4">
              <BellAlertIcon className="h-6 w-6 text-[#00c8ff]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-frost-100">Escalatie in lagen</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              E-mail, SMS en AI-telefoon bij niet-reageren. Backup contacten worden automatisch ingeschakeld.
            </p>
          </Link>
          <Link to="/oplossingen" className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 hover:border-[#00c8ff]/40 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center mb-4">
              <ChartBarIcon className="h-6 w-6 text-[#00c8ff]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-frost-100">Rapportage</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Grafieken, historiek en overzichten voor compliance en traceerbaarheid.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
