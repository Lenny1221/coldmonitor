import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BuildingStorefrontIcon,
  BeakerIcon,
  TruckIcon,
  HeartIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, Check, CtaBand } from '../components/marketing/ui';
import Photo from '../components/marketing/Photo';

const sectors = [
  {
    id: 'horeca',
    icon: BuildingStorefrontIcon,
    title: 'Slagers, horeca & retail',
    sub: 'Slagerijen, ijssalons, restaurants, supermarkten',
    challenges: [
      'Temperatuur loopt op bij stroomuitval of defecte compressor',
      'Deur blijft openstaan na levering',
      'Handmatige HACCP-registratie kost tijd en fouten',
    ],
    solutions: [
      'Realtime alarm bij overschrijding, dag en nacht',
      'Deur-alarm bij te lang open',
      'Automatische HACCP-rapporten, exporteerbaar',
    ],
    regs: ['HACCP (EG) 852/2004', 'FAVV', 'ISO 22000'],
  },
  {
    id: 'farma',
    icon: BeakerIcon,
    title: 'Farmaceutisch',
    sub: 'Apotheken, ziekenhuizen, distributeurs',
    challenges: [
      'Medicijnen/vaccins buiten de toegestane range',
      'Bewijs van koelketen nodig bij audits',
      'GDP/GMP-registratie verplicht',
    ],
    solutions: [
      'Nauwkeurige logging tot ± 0,1°C met tijdstempel',
      'Volledige audit trail per koelcel',
      'GDP/GMP-conforme rapporten (PDF/CSV)',
    ],
    regs: ['EU GDP 2013/C 68/01', 'GMP Annex 15', 'FAGG'],
  },
  {
    id: 'logistiek',
    icon: TruckIcon,
    title: 'Logistiek & transport',
    sub: 'Koelketen, depots, distributiecentra',
    challenges: [
      'Producten passeren schakels zonder registratie',
      'Problemen pas zichtbaar na het lossen',
      'Aansprakelijkheid bij klachten',
    ],
    solutions: [
      'Meerdere locaties in één dashboard',
      'Tijdstempel-logboek per koelcel',
      'Schaalbaar van 1 tot honderden cellen',
    ],
    regs: ['EU 37/2005', 'IFS Logistics', 'BRC S&D'],
  },
  {
    id: 'zorg',
    icon: HeartIcon,
    title: 'Medisch & zorg',
    sub: 'Ziekenhuizen, woonzorg, bloedbanken',
    challenges: [
      'Strikte bewaartemperaturen voor bloed en medicatie',
      'Continue registratie voor accreditatie',
      'Spoedrespons nodig, dag en nacht',
    ],
    solutions: [
      '24/7 monitoring met directe opvolging',
      'Gecertificeerde data voor accreditatie',
      'Escalatie tot telefoon bij non-respons',
    ],
    regs: ['JCI-accreditatie', 'Ziekenhuiswet', 'RIZIV'],
  },
  {
    id: 'technici',
    icon: WrenchScrewdriverIcon,
    title: 'Technici & servicebedrijven',
    sub: 'Koeltechnici, installateurs, onderhoud',
    challenges: [
      'Reactief onderhoud = dure spoedinterventies',
      'Klanten bellen pas als het te laat is',
      'Overzicht over veel klanten ontbreekt',
    ],
    solutions: [
      'Multi-klant dashboard: alles op één scherm',
      'Automatisch technicus-alarm bij afwijking',
      'Koppeling op uitnodiging, klant beheert toestemming',
    ],
    regs: ['SLA-bewaking', 'Servicecontracten', 'Proactief onderhoud'],
  },
];

const Oplossingen: React.FC = () => {
  const [active, setActive] = useState(0);
  const s = sectors[active];

  return (
    <>
      <Helmet>
        <title>Oplossingen per sector – IntelliFrost | Retail, Farmaceutisch, Logistiek & meer</title>
        <meta name="description" content="IntelliFrost biedt koelcelmonitoring voor retail, supermarkten, farmaceutische bedrijven, logistiek, ziekenhuizen en koeltechnici. HACCP, GDP en GMP compliant." />
        <meta name="keywords" content="koelcelmonitoring retail, farmaceutische temperatuurmonitoring, logistiek koelketen, HACCP koelcel, technicus koelcel monitoring" />
        <link rel="canonical" href="https://intellifrost.be/oplossingen" />
        <meta property="og:title" content="Oplossingen per sector – IntelliFrost" />
        <meta property="og:description" content="Koelcelmonitoring voor retail, farmaceutisch, logistiek, medisch en meer. Ontdek welke oplossing bij uw sector past." />
        <meta property="og:url" content="https://intellifrost.be/oplossingen" />
      </Helmet>

      <PageHeader
        kicker="Per sector"
        title="Oplossingen voor uw branche"
        subtitle="Eén platform, configuratie op maat van uw sector. Overal waar temperatuurgevoelige producten liggen."
      />

      <div className="max-w-4xl mx-auto px-5">
        {/* Sector tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {sectors.map((sec, i) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === i ? 'bg-brand text-navy shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <sec.icon className="h-4 w-4" />
              {sec.title}
            </button>
          ))}
        </div>

        {/* Active sector */}
        <div className="rounded-3xl border border-gray-200 overflow-hidden mb-16">
          <div className="bg-navy text-white p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <s.icon className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{s.title}</h2>
              <p className="text-white/60 text-sm">{s.sub}</p>
            </div>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Uitdagingen</h3>
              <ul className="space-y-3">
                {s.challenges.map((c) => (
                  <li key={c} className="flex gap-2.5 items-start text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <XMarkIcon className="w-3 h-3 text-red-500" strokeWidth={3} />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Hoe IntelliFrost helpt</h3>
              <ul className="space-y-3">
                {s.solutions.map((sol) => (
                  <li key={sol} className="flex gap-2.5 items-start text-sm text-gray-700">
                    <Check />
                    {sol}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              {s.regs.map((r) => (
                <span key={r} className="px-3 py-1 rounded-lg bg-brand/10 text-brand text-xs font-medium">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Technicus-koppeling highlight */}
        <section className="mb-16 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden grid md:grid-cols-2">
          <div className="p-6">
            <span className="inline-block bg-brand/15 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
              Unieke functie
            </span>
            <h2 className="font-display text-xl font-bold text-navy mb-2">Klant–technicus koppeling</h2>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Een technicus stuurt een uitnodiging; bij acceptatie ziet hij de alarmen van die klant en kan hij proactief
              ingrijpen — nog voor de klant het probleem merkt. Samen met het zelflerende baseline-systeem wordt
              IntelliFrost zo een echte service-tool.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {[
                'Eén dashboard voor alle klanten',
                'Klant beheert zelf de toestemming',
                'Klantalarmen in technicusportal',
                'Volledige historiek voor onderhoud',
              ].map((t) => (
                <div key={t} className="flex gap-2 items-start text-sm text-gray-700">
                  <Check />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <Photo
            src="technician-dashboard.png"
            alt="Technicusportal met meerdere klanten en hun koelcellen"
            placeholder="Screenshot: technicusportal (meerdere klanten)"
            ratio="square"
            className="h-full !rounded-none"
          />
        </section>
      </div>

      <CtaBand
        title="Klaar om uw installatie te beschermen?"
        text="Vraag een vrijblijvende offerte aan en ontdek welke oplossing bij uw sector past."
        primaryLabel="Offerte aanvragen"
        secondaryTo="/prijzen"
        secondaryLabel="Bekijk de prijzen"
      />
    </>
  );
};

export default Oplossingen;
