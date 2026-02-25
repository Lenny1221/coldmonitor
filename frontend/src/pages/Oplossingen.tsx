import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CubeIcon,
  BellAlertIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  TruckIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  BuildingOffice2Icon,
  HeartIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const sectors = [
  {
    id: 'voeding',
    icon: BuildingStorefrontIcon,
    title: 'Retail & voeding',
    subtitle: 'Supermarkten, slagerijen, restaurants en groothandels',
    color: 'border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    description:
      'In de voedingssector is temperatuurbewaking niet alleen wettelijk verplicht, maar ook essentieel om voedselverspilling en boetes te vermijden. IntelliFrost biedt een kant-en-klare oplossing die voldoet aan de HACCP-wetgeving.',
    challenges: [
      'Temperatuurafwijkingen bij stroomuitval of defect compressor',
      'Deuren die vergeten worden te sluiten na levering',
      'Handmatige HACCP-registratie is tijdrovend en foutgevoelig',
      'Alarmen buiten werkuren missen',
    ],
    solutions: [
      'Realtime meldingen bij temperatuuroverschrijding, dag en nacht',
      'Deur-alarm bij open deur langer dan X seconden',
      'Automatische digitale HACCP-rapportage, exporteerbaar',
      'Escalatie naar backup contacten buiten werkuren',
    ],
    regulations: ['HACCP-verordening (EG) nr. 852/2004', 'FAVV-controles', 'ISO 22000'],
  },
  {
    id: 'farmaceutisch',
    icon: BeakerIcon,
    title: 'Farmaceutisch',
    subtitle: 'Apotheken, ziekenhuizen en distributeurs',
    color: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    description:
      'Farmaceutische producten vereisen strikte temperatuurcontrole. Afwijkingen kunnen producten onbruikbaar maken en leiden tot serieuze financiële schade. IntelliFrost levert gecertificeerde dataloggers en audit-klare rapporten.',
    challenges: [
      'Medicijnen of vaccins buiten de gespecificeerde temperatuurrange',
      'Bewijs van koelketen bij leveringen en audits',
      'GDP/GMP-compliance vereiste voor temperatuurregistratie',
      'Spoedopvolging bij alarmen',
    ],
    solutions: [
      'Nauwkeurige logging tot ± 0,1°C met tijdstempel',
      'Volledige audit trail per koelcel per periode',
      'GDP- en GMP-conforme rapportage exporteerbaar als PDF/CSV',
      'Onmiddellijke escalatie tot AI-telefoon bij non-respons',
    ],
    regulations: ['EU GDP-richtlijn 2013/C 68/01', 'GMP Annex 15', 'FAGG-reglementering'],
  },
  {
    id: 'logistiek',
    icon: TruckIcon,
    title: 'Logistiek & transport',
    subtitle: 'Koelketen, depots en distributiecentra',
    color: 'border-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    description:
      'In logistieke omgevingen gaan producten door meerdere schakels. IntelliFrost bewaakt elk depot en elke schakel in de koelketen, met volledig traceerbaarheidsbewijs.',
    challenges: [
      'Producten die meerdere locaties passeren zonder registratie',
      'Temperatuurproblemen in koelruimtes detecteren voor producten worden gelost',
      'Aansprakelijkheidsbewijzen bij klachten van klanten',
      'Grote oppervlaktes met veel koelcellen beheren',
    ],
    solutions: [
      'Monitoring van meerdere locaties en depots vanuit één dashboard',
      'Tijdstempel-logboek per koelcel voor volledig traceerbaarheid',
      'Exporteerbaar bewijs bij aansprakelijkheidskwesties',
      'Schaalbaar: van 1 tot honderden koelcellen',
    ],
    regulations: ['EU-verordening 37/2005', 'IFS Logistics', 'BRC Storage & Distribution'],
  },
  {
    id: 'technici',
    icon: WrenchScrewdriverIcon,
    title: 'Technici & servicebedrijven',
    subtitle: 'Koeltechnici, installateurs en onderhoudsbedrijven',
    color: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    description:
      'Als technicus beheert u installaties bij meerdere klanten. IntelliFrost biedt een technicusportal waarmee u proactief kunt ingrijpen – nog voor de klant het probleem merkt.',
    challenges: [
      'Reactive onderhoud leidt tot dure spoedinterventies',
      'Klanten bellen pas als het al te laat is',
      'Overzicht houden over installaties bij meerdere klanten',
      'Nachtelijke alarmen missen',
    ],
    solutions: [
      'Multi-klant dashboard: alle klanten en hun installaties op één scherm',
      'Automatisch technicus-alarm via e-mail, SMS of telefoon',
      'Alarm-historiek per klant voor preventief onderhoud',
      'Koppeling op uitnodiging: klant beheert eigen toestemming',
    ],
    regulations: ['Dienstverleningscontracten', 'SLA-bewaking', 'ATEX-installaties op aanvraag'],
  },
  {
    id: 'medisch',
    icon: HeartIcon,
    title: 'Medisch & zorg',
    subtitle: 'Ziekenhuizen, woonzorgcentra en bloedbanken',
    color: 'border-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    description:
      'In zorg- en medische omgevingen kan een temperatuurfout levensgevaarlijk zijn. Bloedproducten, vaccins en medicatie moeten onder strikt gecontroleerde omstandigheden worden bewaard.',
    challenges: [
      'Strikte bewaartemperaturen voor bloed, vaccins en medicatie',
      'Continue registratie vereist voor accreditatie',
      'Spoedrespons bij alarmen dag en nacht',
      'Traceerbaarheid voor zorginspectie',
    ],
    solutions: [
      '24/7 monitoring met onmiddellijke alarmopvolging',
      'Gecertificeerde dataregistratie voor accreditatie-eisen',
      'Escalatie tot telefonisch contact bij niet-reageren',
      'Per koeltoestel individueel configureerbaar',
    ],
    regulations: ['JCI-accreditatie', 'Belgische Ziekenhuiswet', 'RIZIV-reglementering'],
  },
  {
    id: 'kantoor',
    icon: BuildingOffice2Icon,
    title: 'Bedrijven & facilitair',
    subtitle: 'Kantines, vergaderfaciliteiten en bedrijfsrestaurants',
    color: 'border-slate-400',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
    description:
      'Ook voor bedrijven met een kantine of personeelsrestaurant is HACCP van toepassing. IntelliFrost maakt de administratieve last minimaal terwijl de voedselveiligheid maximaal wordt geborgd.',
    challenges: [
      'HACCP-verplichting ook voor bedrijfskantines',
      'Geen fulltime kookpersoneel = niemand die alarmen opvolgt',
      'Facilitaire dienst beheert meerdere locaties/gebouwen',
    ],
    solutions: [
      'Automatische digitale HACCP-logboeken',
      'Escalatie naar facilitaire dienst of externe dienst',
      'Multi-site beheer voor meerdere kantoren of gebouwen',
    ],
    regulations: ['HACCP-wetgeving', 'FAVV', 'ISO 22000'],
  },
];

const coreCapabilities = [
  { icon: CubeIcon, title: 'IoT-monitoring', desc: 'Temperatuur & deurstatus in realtime, elke 1-60 min., opgeslagen in de cloud.' },
  { icon: BellAlertIcon, title: 'Escalatiebeheer', desc: '3 lagen: e-mail → SMS → AI-telefoon. Per tijdslot en per dag configureerbaar.' },
  { icon: ChartBarIcon, title: 'Data & rapportage', desc: 'Grafieken, historiek en downloadbare rapporten. Tot 2 jaar terugkijken.' },
  { icon: ShieldCheckIcon, title: 'Compliance', desc: 'HACCP, GDP, GMP – automatische auditklare documentatie.' },
];

const Oplossingen: React.FC = () => {
  const [activeSector, setActiveSector] = useState(0);
  const sector = sectors[activeSector];

  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="mb-14">
        <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-gray-900 dark:text-frost-100 mb-4">
          Oplossingen per sector
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          IntelliFrost is inzetbaar in vrijwel elke sector waar temperatuurgevoelige producten worden bewaard.
          Elk platform is hetzelfde – de configuratie past zich aan uw sector aan.
        </p>
      </div>

      {/* Core capabilities */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {coreCapabilities.map((cap) => (
          <div key={cap.title} className="p-5 rounded-2xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center mx-auto mb-3">
              <cap.icon className="h-5 w-5 text-[#00c8ff]" />
            </div>
            <div className="font-semibold text-gray-900 dark:text-frost-100 text-sm mb-1">{cap.title}</div>
            <div className="text-xs text-gray-500 dark:text-slate-500">{cap.desc}</div>
          </div>
        ))}
      </div>

      {/* Sector selector */}
      <div className="mb-14">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 dark:text-frost-100 mb-8">
          Kies uw sector
        </h2>
        <div className="flex flex-wrap gap-2 mb-8">
          {sectors.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveSector(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSector === i
                  ? 'bg-[#00c8ff] text-white shadow-md shadow-[#00c8ff]/20'
                  : 'bg-gray-100 dark:bg-frost-900 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-frost-800 border border-gray-200 dark:border-frost-800'
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.title}
            </button>
          ))}
        </div>

        {/* Active sector detail */}
        <div className={`p-8 rounded-3xl border-2 ${sector.color} bg-gray-50 dark:bg-frost-900`}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
              <sector.icon className="h-7 w-7 text-[#00c8ff]" />
            </div>
            <div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${sector.badge}`}>
                {sector.subtitle}
              </div>
              <h3 className="font-['Exo_2'] text-xl font-bold text-gray-900 dark:text-frost-100">
                {sector.title}
              </h3>
            </div>
          </div>
          <p className="text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">{sector.description}</p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-frost-100 uppercase tracking-wide mb-4">
                Uitdagingen in deze sector
              </h4>
              <ul className="space-y-2.5">
                {sector.challenges.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-400">
                    <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">✕</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-frost-100 uppercase tracking-wide mb-4">
                Hoe IntelliFrost helpt
              </h4>
              <ul className="space-y-2.5">
                {sector.solutions.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                    <CheckCircleIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-frost-800">
            <div className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-3">
              Relevante regelgeving & normen
            </div>
            <div className="flex flex-wrap gap-2">
              {sector.regulations.map((r) => (
                <span key={r} className="px-3 py-1 rounded-lg bg-[#00c8ff]/10 border border-[#00c8ff]/20 text-xs font-medium text-[#00c8ff]">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Technicus-koppeling */}
      <section className="mb-14 p-8 rounded-3xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c8ff]/10 border border-[#00c8ff]/30 text-[#00c8ff] text-xs font-medium mb-4">
              Unieke functie
            </div>
            <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 dark:text-frost-100 mb-3">
              Klant–technicus koppeling
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
              Een technicus kan via het platform een uitnodiging sturen aan een klant. Bij acceptatie heeft de technicus
              toegang tot de alarmen van die klant. Zo kan hij proactief ingrijpen – nog voor de klant het probleem merkt.
            </p>
            <ul className="space-y-2">
              {[
                'Technicus beheert meerdere klanten via één dashboard',
                'Klant beheert zelf zijn toestemming (uitnodiging accepteren of weigeren)',
                'Alarmen van klanten zichtbaar in technicusportal',
                'Volledige historiek beschikbaar voor onderhoudsgesprekken',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <CheckCircleIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Technicus stuurt uitnodiging vanuit zijn portal', color: 'bg-[#00c8ff]' },
              { step: '2', text: 'Klant ontvangt e-mail en accepteert of weigert', color: 'bg-[#00c8ff]' },
              { step: '3', text: 'Technicus ziet nu klantalarmen in zijn dashboard', color: 'bg-[#00c8ff]' },
              { step: '4', text: 'Proactief ingrijpen bij problemen – vóór escalatie', color: 'bg-[#00c8ff]' },
            ].map((step) => (
              <div key={step.step} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-frost-800 border border-gray-200 dark:border-frost-700">
                <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {step.step}
                </div>
                <span className="text-sm text-gray-700 dark:text-slate-300">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center mb-6">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-3">
          Klaar om uw installatie te beschermen?
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Vraag een vrijblijvende offerte aan en ontdek welke oplossing het beste bij uw sector past.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            Offerte aanvragen
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/prijzen"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
          >
            Bekijk de prijzen
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Oplossingen;
