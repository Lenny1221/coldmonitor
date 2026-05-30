import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDownIcon, ChevronUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { PageHeader, CtaBand } from '../components/marketing/ui';

const categories = [
  {
    id: 'start',
    title: 'Aan de slag',
    guides: [
      { title: 'Eerste inlog & dashboard', time: '5 min.', steps: [
        'Ga naar het platform via de link in uw welkomst-e-mail.',
        'Log in met uw e-mailadres en wachtwoord.',
        'Stel bij eerste inlog een nieuw wachtwoord in.',
        'Het dashboard toont al uw locaties en koelcellen: groen = ok, oranje = let op, rood = alarm.',
        'Klik op een koelcel voor de realtime grafiek.',
      ] },
      { title: 'Account & profiel instellen', time: '5 min.', steps: [
        'Klik rechtsboven op uw naam om naar uw profiel te gaan.',
        'Pas naam, e-mail en telefoonnummer aan.',
        'Stel uw voorkeurstaal in.',
        'Activeer tweestapsverificatie voor extra beveiliging.',
        'Sla op.',
      ] },
    ],
  },
  {
    id: 'koelcellen',
    title: 'Locaties & koelcellen',
    guides: [
      { title: 'Een koelcel configureren', time: '10 min.', steps: [
        'Ga naar een locatie en klik op "Koelcel toevoegen".',
        'Geef een naam en kies het type (koel- of vriescel).',
        'Vul het serienummer van de sensor in om te koppelen.',
        'Stel min- en maxtemperatuur in voor het alarm.',
        'Stel de deur-alarmvertraging in.',
        'Sla op — de sensor begint te meten.',
      ] },
      { title: 'Drempelwaarden aanpassen', time: '5 min.', steps: [
        'Open een koelcel en klik op "Instellingen".',
        'Pas de min- en maxtemperatuur aan.',
        'Stel eventueel een waarschuwingszone in.',
        'Sla op — direct van kracht.',
      ] },
    ],
  },
  {
    id: 'alarmen',
    title: 'Alarmen & escalatie',
    guides: [
      { title: 'Escalatiecontacten instellen', time: '10 min.', steps: [
        'Ga naar "Instellingen" > "Alarmen".',
        'Voeg contacten toe voor stap 1 (e-mail + push).',
        'Voeg SMS-contacten toe voor stap 2.',
        'Voeg backup-contacten toe voor stap 3 (telefoon).',
        'Stel de reactietijden per stap in en test via de testknop.',
      ] },
      { title: 'Een alarm bevestigen of sluiten', time: '3 min.', steps: [
        'Actieve alarmen staan bovenaan in het dashboard.',
        'Klik voor details: koelcel, tijdstip, temperatuur, niveau.',
        'Klik op "Bevestigen" dat u het zag.',
        'Na herstel: klik op "Sluiten" en voeg een notitie toe.',
      ] },
    ],
  },
  {
    id: 'rapporten',
    title: 'Rapporten & data',
    guides: [
      { title: 'HACCP-rapport genereren', time: '5 min.', steps: [
        'Ga naar "Rapporten".',
        'Selecteer locatie, koelcel(len) en periode.',
        'Klik op "Genereer rapport".',
        'Download de PDF — klaar voor de inspectie.',
      ] },
      { title: 'Data exporteren (CSV)', time: '5 min.', steps: [
        'Ga naar "Rapporten" > "Export".',
        'Selecteer koelcel en periode.',
        'Kies CSV of Excel-formaat.',
        'Exporteer en gebruik in uw eigen tools.',
      ] },
    ],
  },
  {
    id: 'technicus',
    title: 'Technicus & koppeling',
    guides: [
      { title: 'Technicus-uitnodiging accepteren', time: '5 min.', steps: [
        'U ontvangt een e-mail met uitnodigingslink.',
        'Klik op de link en log in (of maak een account).',
        'Bekijk de uitnodiging: naam technicus en bedrijf.',
        'Klik op "Accepteren". Toegang is altijd weer in te trekken.',
      ] },
      { title: 'Technicustoegang beheren', time: '5 min.', steps: [
        'Ga naar "Instellingen" > "Technici".',
        'Bekijk alle gekoppelde technici.',
        'Klik op "Koppeling verwijderen" om in te trekken.',
      ] },
    ],
  },
];

const Handleidingen: React.FC = () => {
  const [cat, setCat] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const active = categories[cat];

  return (
    <>
      <Helmet>
        <title>Handleidingen – IntelliFrost | Stapsgewijze gidsen</title>
        <meta name="description" content="Duidelijke handleidingen voor IntelliFrost: van eerste inlog en koelcel-configuratie tot alarmen, HACCP-rapporten en technicuskoppeling." />
        <meta name="keywords" content="IntelliFrost handleiding, koelcel configureren, alarmen instellen, HACCP rapport genereren, technicus koppeling" />
        <link rel="canonical" href="https://intellifrost.be/handleidingen" />
        <meta property="og:title" content="Handleidingen – IntelliFrost" />
        <meta property="og:description" content="Stapsgewijze gidsen voor elke functie van IntelliFrost." />
        <meta property="og:url" content="https://intellifrost.be/handleidingen" />
      </Helmet>

      <PageHeader
        kicker="Hulp & uitleg"
        title="Handleidingen"
        subtitle="Stapsgewijze gidsen voor elke functie van IntelliFrost — van eerste inlog tot rapporten."
      />

      <div className="max-w-3xl mx-auto px-5">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setCat(i); setOpen(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                cat === i ? 'bg-brand text-navy shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Guides */}
        <div className="space-y-3 mb-16">
          {active.guides.map((g, i) => (
            <div key={g.title} className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-100/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                  <DocumentTextIcon className="h-5 w-5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy text-sm">{g.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{g.time}</div>
                </div>
                {open === i ? (
                  <ChevronUpIcon className="h-5 w-5 text-brand shrink-0" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400 shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5 border-t border-gray-200 pt-5">
                  <ol className="space-y-3">
                    {g.steps.map((step, si) => (
                      <li key={si} className="flex gap-3 items-start">
                        <span className="w-6 h-6 rounded-full bg-brand text-navy text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {si + 1}
                        </span>
                        <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <CtaBand
        title="Staat uw vraag er niet bij?"
        text="Bekijk de FAQ of neem rechtstreeks contact op — we helpen u graag verder."
        primaryLabel="Stel uw vraag"
        secondaryTo="/faq"
        secondaryLabel="Naar de FAQ"
      />
    </>
  );
};

export default Handleidingen;
