import React from 'react';
import { Link } from 'react-router-dom';
import {
  CubeIcon,
  BellAlertIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Oplossingen: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6">
      <h1 className="font-['Exo_2'] text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
        Onze oplossingen
      </h1>
      <p className="text-lg text-gray-600 dark:text-slate-400 mb-12">
        IntelliFrost biedt een complete suite voor monitoring en management van koel- en vriescellen.
      </p>

      <div className="space-y-6 mb-12">
        <div className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
              <CubeIcon className="h-7 w-7 text-[#00c8ff]" />
            </div>
            <div>
              <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-2">
                Koelcelmonitoring
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mb-8">
                Bewaak temperatuur en deurstatus van uw koel- en vriescellen in realtime. Ontvang direct een melding bij afwijkingen. Configureer drempelwaarden per cel en stel de deur-alarmvertraging in.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
              <BellAlertIcon className="h-7 w-7 text-[#00c8ff]" />
            </div>
            <div>
              <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-2">
                Escalatie in lagen
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mb-8">
                E-mail, SMS en AI-telefoon bij niet-reageren. Backup contacten en technicus worden automatisch ingeschakeld. Configureer openingstijden en nachtmodus voor slimme escalatie.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
              <ChartBarIcon className="h-7 w-7 text-[#00c8ff]" />
            </div>
            <div>
              <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-2">
                Rapportage & historiek
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mb-8">
                Grafieken, historiek en overzichten. Ideaal voor compliance, HACCP en traceerbaarheid van temperatuurgegevens.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="text-center">
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
        >
          Vraag een offerte aan
        </Link>
      </section>
    </div>
  );
};

export default Oplossingen;
