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
  {
    icon: BuildingStorefrontIcon,
    title: 'Retail & supermarkten',
    desc: 'Monitor alle koel- en vriestoonkasten vanuit één dashboard. Ontvang direct een alarm bij deuren die te lang openstaan of temperatuurproblemen.',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: BeakerIcon,
    title: 'Farmaceutisch',
    desc: 'Voldoe aan strenge regelgeving (GDP, GMP) met gecertificeerde temperatuurregistratie en automatische compliance-rapporten.',
    img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: TruckIcon,
    title: 'Logistiek & transport',
    desc: 'Bewijs de integriteit van uw koelketen van depot tot levering. Tijdstempel-logboek voor elke schakel.',
    img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: WrenchScrewdriverIcon,
    title: 'Technici & servicebedrijven',
    desc: 'Beheer meerdere klanten vanuit één portal. Ontvang alarmen van uw klanten en intervenieer proactief.',
    img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80',
  },
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
      {/* Hero – split layout */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00c8ff]/10 border border-[#00c8ff]/30 text-[#00c8ff] text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[#00c8ff] animate-pulse" />
              Realtime koelcelmonitoring voor België & Nederland
            </div>
            <h1 className="font-['Exo_2'] font-bold text-4xl sm:text-5xl lg:text-5xl text-gray-900 mb-6 leading-tight">
              Nooit meer een kapotte{' '}
              <span className="text-[#00c8ff]">koelcel missen</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              IntelliFrost bewaakt uw koel- en vriescellen 24/7. Bij een alarm escaleert het systeem
              automatisch van e-mail naar SMS naar een AI-telefoonoproep – totdat iemand reageert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors text-lg shadow-lg shadow-[#00c8ff]/20"
              >
                Vraag een demo aan
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors text-lg"
              >
                Inloggen
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </Link>
            </div>
            {/* Stats inline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                  <div className="font-['Exo_2'] text-2xl font-bold text-[#00c8ff] mb-0.5">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative lg:h-[520px] h-72">
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=85"
                alt="Koelcel opslag"
                className="w-full h-full object-cover"
              />
              {/* Overlay met cijfers */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2E]/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <div>
                    <div className="text-white text-sm font-semibold">Vriescel – Visvak A</div>
                    <div className="text-white/70 text-xs">−22,3°C · Deur gesloten · Alles OK</div>
                  </div>
                  <div className="ml-auto font-['Exo_2'] text-lg font-bold text-green-400">−22,3°C</div>
                </div>
              </div>
            </div>
            {/* Decoratief accent */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#00c8ff]/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-[#0080ff]/10 blur-3xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Hoe het werkt – met foto naast stappen */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Foto links */}
          <div className="relative rounded-3xl overflow-hidden h-80 lg:h-auto lg:min-h-[400px] shadow-xl order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
              alt="IoT sensor technologie"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00c8ff]/30 to-transparent mix-blend-multiply" />
          </div>
          {/* Stappen rechts */}
          <div className="order-1 lg:order-2">
            <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Hoe werkt IntelliFrost?
            </h2>
            <p className="text-gray-600 mb-8">
              Van hardware installatie tot automatische alarmopvolging – in 4 stappen operationeel.
            </p>
            <div className="space-y-5">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="font-['Exo_2'] text-2xl font-bold text-[#00c8ff]/40 flex-shrink-0 leading-none pt-1">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Escalatievisualisatie */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="text-center mb-14">
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Automatische escalatie – totdat iemand reageert
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Geen gemiste alarmen meer. Het systeem gaat door totdat er een reactie is.
          </p>
        </div>
        <div className="relative flex flex-col md:flex-row items-stretch gap-4">
          {[
            { level: 'Laag 1', time: 'Direct', channels: ['E-mail', 'Push-notificatie'], color: 'border-green-400', badge: 'bg-green-100 text-green-700' },
            { level: 'Laag 2', time: 'Na X min. geen reactie', channels: ['SMS', 'Backup contact', 'Technicus verwittigd'], color: 'border-orange-400', badge: 'bg-orange-100 text-orange-700' },
            { level: 'Laag 3', time: 'Na verdere non-respons', channels: ['AI-telefoonoproep', 'Backup gebeld', 'Technicus dispatched'], color: 'border-red-400', badge: 'bg-red-100 text-red-700' },
          ].map((layer) => (
            <div key={layer.level} className="flex-1 flex flex-col">
              <div className={`flex-1 p-6 rounded-2xl bg-gray-50 border-2 ${layer.color}`}>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${layer.badge}`}>
                  {layer.level}
                </div>
                <div className="text-xs text-gray-500 mb-3">{layer.time}</div>
                <ul className="space-y-2">
                  {layer.channels.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-gray-700">
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
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Alles wat u nodig heeft
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            IntelliFrost combineert betrouwbare hardware met een slimme cloudoplossing.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#00c8ff]/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#00c8ff]/15 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-[#00c8ff]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectoren – met foto's */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <div className="text-center mb-14">
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Voor elke sector
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Van kleine slagerij tot grote farmaceutische distributeur – IntelliFrost past zich aan uw noden aan.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {sectors.map((s) => (
            <div key={s.title} className="group rounded-2xl overflow-hidden border border-gray-200 hover:border-[#00c8ff]/40 transition-all hover:shadow-lg">
              {/* Foto */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={s.img}
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <s.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-semibold text-sm">{s.title}</span>
                </div>
              </div>
              {/* Text */}
              <div className="p-5 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/oplossingen" className="inline-flex items-center gap-2 text-[#00c8ff] font-medium hover:underline">
            Bekijk alle sectoren
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Visuele tussensectie – grote foto met overlay */}
      <section className="relative mb-24 mx-4 sm:mx-8 lg:mx-16 rounded-3xl overflow-hidden shadow-2xl">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=85"
          alt="Koelcel magazijn"
          className="w-full h-72 sm:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2E]/90 via-[#0D1B2E]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-10 sm:px-16">
          <div className="max-w-lg">
            <h2 className="font-['Exo_2'] text-2xl sm:text-4xl font-bold text-white mb-4">
              Uw koelketen, continu bewaakt
            </h2>
            <p className="text-white/80 mb-6 leading-relaxed">
              Elke seconde telt bij een defecte koelcel. IntelliFrost zorgt ervoor dat u altijd en overal
              op de hoogte bent – dag en nacht.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#0D1B2E] bg-[#00c8ff] hover:bg-[#00e5ff] transition-colors"
            >
              Start vandaag
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 mb-20">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-[#00c8ff]/20 to-[#0080aa]/10 border border-[#00c8ff]/30 text-center">
          <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Klaar om te starten?
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
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
