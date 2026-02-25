import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BellAlertIcon,
  CubeIcon,
  ShieldCheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  BuildingStorefrontIcon,
  BeakerIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const stats = [
  { value: '99.9%', label: 'Uptime garantie' },
  { value: '< 30s', label: 'Alarmreactietijd' },
  { value: '3 lagen', label: 'Escalatieniveaus' },
  { value: '24/7', label: 'Monitoring' },
];

const steps = [
  {
    num: '01',
    title: 'Hardware installeren',
    desc: 'Bevestig de IoT-sensoren in uw koel- of vriescel. Geen bekabeling nodig – de loggers werken draadloos en versturen data via WiFi of 4G naar het platform.',
  },
  {
    num: '02',
    title: 'Dashboard configureren',
    desc: 'Stel drempelwaarden, deur-alarmvertraging en escalatiecontacten in via het gebruiksvriendelijke webdashboard. Klaar in enkele minuten.',
  },
  {
    num: '03',
    title: 'Alarmen ontvangen',
    desc: 'Bij overschrijding van een grenswaarde start automatisch de escalatieprocedure: e-mail, SMS en eventueel een AI-telefoonoproep.',
  },
  {
    num: '04',
    title: 'Rapporteren & compliant blijven',
    desc: 'Bekijk historische grafieken, download HACCP-rapporten en demonstreer compliance bij audits met één klik.',
  },
];

const sectors = [
  { icon: BuildingStorefrontIcon, title: 'Retail & supermarkten', desc: 'Monitor alle koel- en vriestoonkasten vanuit één dashboard. Ontvang direct een alarm bij deuren die te lang openstaan of temperatuurproblemen.' },
  { icon: BeakerIcon, title: 'Farmaceutisch', desc: 'Voldoe aan strenge regelgeving (GDP, GMP) met gecertificeerde temperatuurregistratie en automatische compliance-rapporten.' },
  { icon: TruckIcon, title: 'Logistiek & transport', desc: 'Bewijs de integriteit van uw koelketen van depot tot levering. Tijdstempel-logboek voor elke schakel.' },
  { icon: WrenchScrewdriverIcon, title: 'Technici & servicebedrijven', desc: 'Beheer meerdere klanten vanuit één portal. Ontvang alarmen van uw klanten en intervenieer proactief.' },
];

const features = [
  { icon: CubeIcon, title: 'IoT-sensoren', desc: 'Meten temperatuur tot op 0,1°C nauwkeurig. Batterijduur tot 2 jaar. Draadloos en eenvoudig te installeren.' },
  { icon: BellAlertIcon, title: 'Slimme escalatie', desc: '3 escalatielagen: e-mail → SMS → AI-telefoon. Configureerbaar per tijdslot en per dag van de week.' },
  { icon: ChartBarIcon, title: 'Live dashboard', desc: 'Realtime temperatuurgrafieken per cel. Historische data tot 2 jaar terug beschikbaar.' },
  { icon: ShieldCheckIcon, title: 'HACCP-compliant', desc: 'Automatische rapportage voor voedselveiligheidsaudits. Exporteerbaar als PDF of CSV.' },
  { icon: ClockIcon, title: 'Openingstijden-bewust', desc: 'Stel nachtmodus en weekendgedrag in zodat u alleen alarmen ontvangt wanneer relevant.' },
  { icon: DevicePhoneMobileIcon, title: 'Mobiel & responsive', desc: 'Werkt op smartphone, tablet en desktop. Altijd en overal toegang tot uw data.' },
];

const Home: React.FC = () => {
  return (
    <>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 text-center mb-24">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00c8ff]/10 border border-[#00c8ff]/30 text-[#00c8ff] text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00c8ff] animate-pulse" />
          Realtime koelcelmonitoring voor België & Nederland
        </div>
        <h1 className="font-['Exo_2'] font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 dark:text-frost-100 mb-6 leading-tight">
          Nooit meer een kapotte <br className="hidden sm:block" />
          <span className="text-[#00c8ff]">koelcel missen</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto mb-10">
          IntelliFrost bewaakt uw koel- en vriescellen 24/7. Bij een alarm escaleert het systeem automatisch
          van e-mail naar SMS naar een AI-telefoonoproep – totdat iemand reageert.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors text-lg shadow-lg shadow-[#00c8ff]/20"
          >
            Vraag een demo aan
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors text-lg"
          >
            Inloggen op het platform
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="p-5 rounded-2xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
              <div className="font-['Exo_2'] text-3xl font-bold text-[#00c8ff] mb-1">{s.value}</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Hoe het werkt */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="text-center mb-14">
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
            Hoe werkt IntelliFrost?
          </h2>
          <p className="text-gray-600 dark:text-slate-400 max-w-xl mx-auto">
            Van hardware installatie tot automatische alarmopvolging – in 4 stappen operationeel.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="flex gap-5 p-6 rounded-2xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
              <div className="font-['Exo_2'] text-3xl font-bold text-[#00c8ff]/30 flex-shrink-0 leading-none pt-1">
                {step.num}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-frost-100 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Escalatievisualisatie */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="text-center mb-14">
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
            Automatische escalatie – totdat iemand reageert
          </h2>
          <p className="text-gray-600 dark:text-slate-400 max-w-xl mx-auto">
            Geen gemiste alarmen meer. Het systeem gaat door totdat er een reactie is.
          </p>
        </div>
        <div className="relative flex flex-col md:flex-row items-stretch gap-4">
          {[
            { level: 'Laag 1', time: 'Direct', channels: ['E-mail', 'Push-notificatie'], color: 'border-green-400', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
            { level: 'Laag 2', time: 'Na X min. geen reactie', channels: ['SMS', 'Backup contact', 'Technicus verwittigd'], color: 'border-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
            { level: 'Laag 3', time: 'Na verdere non-respons', channels: ['AI-telefoonoproep', 'Backup gebeld', 'Technicus dispatched'], color: 'border-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
          ].map((layer, i) => (
            <div key={layer.level} className="flex-1 flex flex-col">
              {i > 0 && (
                <div className="hidden md:flex items-center justify-center absolute" style={{ left: `calc(${i * 33.33}% - 10px)`, top: '50%' }}>
                </div>
              )}
              <div className={`flex-1 p-6 rounded-2xl bg-gray-50 dark:bg-frost-900 border-2 ${layer.color}`}>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${layer.badge}`}>
                  {layer.level}
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-500 mb-3">{layer.time}</div>
                <ul className="space-y-2">
                  {layer.channels.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                      <CheckCircleIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="text-center mb-14">
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
            Alles wat u nodig heeft
          </h2>
          <p className="text-gray-600 dark:text-slate-400 max-w-xl mx-auto">
            IntelliFrost combineert betrouwbare hardware met een slimme cloudoplossing.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 hover:border-[#00c8ff]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#00c8ff]/15 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-[#00c8ff]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-frost-100 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectoren */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="text-center mb-14">
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 dark:text-frost-100 mb-3">
            Voor elke sector
          </h2>
          <p className="text-gray-600 dark:text-slate-400 max-w-xl mx-auto">
            Van kleine slagerij tot grote farmaceutische distributeur – IntelliFrost past zich aan uw noden aan.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {sectors.map((s) => (
            <div key={s.title} className="flex gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
              <div className="w-12 h-12 rounded-xl bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                <s.icon className="h-6 w-6 text-[#00c8ff]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-frost-100 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 mb-20">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-[#00c8ff]/20 to-[#0080aa]/10 border border-[#00c8ff]/30 text-center">
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 dark:text-frost-100 mb-4">
            Klaar om te starten?
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Vraag een vrijblijvende demo aan en ontdek hoe IntelliFrost uw koelketen beschermt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
            >
              Demo aanvragen
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/prijzen"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
            >
              Bekijk de prijzen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
