import React from 'react';
import { Link } from 'react-router-dom';
import {
  CubeIcon,
  BellAlertIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Product: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6">
      <h1 className="font-['Exo_2'] text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
        Wat is IntelliFrost?
      </h1>
      <p className="text-lg text-gray-600 dark:text-slate-400 mb-12">
        IntelliFrost is een intelligente monitoringoplossing voor koel- en vriescellen. Het platform combineert IoT-hardware met een slimme escalatie-engine en een gebruiksvriendelijk dashboard.
      </p>

      <section className="mb-12">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-6">
          Kernfunctionaliteiten
        </h2>
        <div className="space-y-6">
          <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
            <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
              <CubeIcon className="h-6 w-6 text-[#00c8ff]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-frost-100 mb-1">IoT-monitoring</h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Sensoren meten temperatuur en deurstatus. Data wordt realtime naar het cloudplatform gestuurd.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
            <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
              <BellAlertIcon className="h-6 w-6 text-[#00c8ff]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-frost-100 mb-1">Drie escalatielagen</h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Laag 1: e-mail + push. Laag 2: SMS + backup contact. Laag 3: AI-telefoon + technicus dispatch.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
            <div className="w-12 h-12 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-[#00c8ff]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-frost-100 mb-1">Dashboard & rapportage</h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Realtime grafieken, historiek en overzichten. Ideaal voor HACCP en traceerbaarheid.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-6">
          Voor wie?
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          IntelliFrost is geschikt voor supermarkten, slagerijen, restaurants, groothandels, farmaceutische en logistieke bedrijven – overal waar temperatuurgevoelige producten worden bewaard.
        </p>
      </section>

      <section className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Ga naar het platform
        </Link>
      </section>
    </div>
  );
};

export default Product;
