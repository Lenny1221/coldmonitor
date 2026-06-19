import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { PageHeader, CtaBand } from '../components/marketing/ui';

const categories = [
  {
    title: 'Algemeen',
    faqs: [
      { q: 'Wat is IntelliFrost?', a: 'Een cloudplatform voor het bewaken van koel- en vriescellen. IoT-sensoren meten temperatuur en deurstatus in realtime, met automatische escalatie van alarmen — van e-mail tot telefoonoproep.' },
      { q: 'Voor wie is het bedoeld?', a: 'Voor elke sector met temperatuurgevoelige producten: supermarkten, slagerijen, horeca, farmacie, logistiek, ziekenhuizen, apotheken en koeltechnici.' },
      { q: 'In welke landen is het beschikbaar?', a: 'Momenteel in België en Nederland. Uitbreiding naar andere Europese landen is gepland.' },
      { q: 'Hoe betrouwbaar is het?', a: 'We mikken op 99,9% uptime met redundante cloudinfrastructuur. Alarmen vertrekken zodra een afwijking wordt gedetecteerd, ook bij wegvallende WiFi dankzij 4G-backup.' },
    ],
  },
  {
    title: 'Hardware & sensoren',
    faqs: [
      { q: 'Hoe worden de sensoren geïnstalleerd?', a: 'In minder dan 5 minuten per sensor: bevestigen met clip of zelfklevende beugel en koppelen via het dashboard met het serienummer.' },
      { q: 'Wat is de batterijduur?', a: 'Tot 2 jaar, afhankelijk van het meetinterval. U krijgt een melding wanneer de batterij bijna leeg is.' },
      { q: 'Werken de sensoren zonder WiFi?', a: 'Ja, de 4G-variant werkt ook op locaties zonder WiFi. De SIM zit in het abonnement.' },
      { q: 'Hoe nauwkeurig is de meting?', a: 'Tot ± 0,1°C, over een bereik van -40°C tot +85°C. Meetinterval instelbaar van 1 tot 60 minuten.' },
      { q: 'Zijn ze water- en stofbestendig?', a: 'Ja, IP67-classificatie — ideaal voor koelcellen met condens of natte omgevingen.' },
    ],
  },
  {
    title: 'Alarmen & service',
    faqs: [
      { q: 'Hoe werkt de escalatie?', a: 'Stap 1: e-mail + push. Geen reactie? Stap 2: SMS naar uw contacten én uw gekoppelde servicepartner. Nog niets? Stap 3: automatische telefoonoproep en de technicus grijpt in.' },
      { q: 'Wat is uniek aan jullie aanpak?', a: 'Anders dan bij pure monitoring krijgt uw gekoppelde servicepartner in de regio dezelfde melding. Zo wordt het probleem niet alleen gedetecteerd, maar ook effectief opgelost.' },
      { q: 'Hoe werkt het zelflerende systeem?', a: 'Na installatie meet IntelliFrost 7 dagen lang de ruimtevoeler, de verdampervoeler en de delta ertussen om een baseline van uw specifieke cel op te bouwen. Geen enkele cel reageert exact hetzelfde, dus een vaste drempel volstaat niet. Wijkt de cel daarna af van haar geleerde gedrag, dan krijgt u preventief een melding — vaak nog voor de temperatuur ontspoort.' },
      { q: 'Kan ik het gebruiken als service-tool?', a: 'Zeker. Dankzij het zelflerende baseline-proces ziet een technieker beginnende koeltechnische of elektrische problemen vroeg en kan hij proactief onderhoud plannen bij zijn eindklanten — ingrijpen vóór er een storing is.' },
      { q: 'Kan ik de reactietijden zelf instellen?', a: 'Ja, per stap bepaalt u hoelang het systeem wacht voor het escaleert. Per locatie en tijdslot configureerbaar.' },
      { q: 'Kan ik alarmen pauzeren bij onderhoud?', a: 'Ja, stel per koelcel een onderhoudsvenster in. Tijdens dat venster worden geen alarmen gestuurd.' },
    ],
  },
  {
    title: 'Dashboard & rapportage',
    faqs: [
      { q: 'Werkt het op smartphone?', a: 'Ja, het platform is volledig responsive op smartphone, tablet en desktop, met push-notificaties via de browser.' },
      { q: 'Hoe lang wordt data bewaard?', a: 'Minstens 2 jaar. Extended retentie tot 5 jaar is beschikbaar als add-on.' },
      { q: 'Kan ik rapporten voor de FAVV maken?', a: 'Ja, genereer een HACCP-compliant PDF-rapport per locatie en periode, met alle metingen, alarmen en escalaties.' },
      { q: 'Kan ik meerdere gebruikers toevoegen?', a: 'Ja, met verschillende rollen: beheerder, operator, viewer of technicus. Elke rol heeft eigen rechten.' },
    ],
  },
  {
    title: 'Abonnement',
    faqs: [
      { q: 'Zijn de sensoren inbegrepen?', a: 'Nee, de sensoren zijn een eenmalige aankoop. Het abonnement dekt het platform, alarmverwerking, escalatie en support.' },
      { q: 'Hoe werkt de facturatie?', a: 'Maandelijks of jaarlijks. Bij langere contracten (jaar, 3 of 5 jaar) geldt een korting.' },
      { q: 'Kan ik op elk moment stoppen?', a: 'Bij maandelijkse facturatie zegt u maandelijks op. Bij langere contracten loopt het af op de einddatum.' },
      { q: 'Is er een proefperiode?', a: 'Ja, we installeren een pilootunit bij u en u test 30 dagen gratis. Zonder verplichtingen.' },
    ],
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: categories.flatMap((c) =>
    c.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    }))
  ),
};

const FAQ: React.FC = () => {
  const [cat, setCat] = useState(0);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <Helmet>
        <title>Veelgestelde vragen – IntelliFrost | FAQ koelcelmonitoring</title>
        <meta name="description" content="Antwoorden op veelgestelde vragen over IntelliFrost: hardware, sensoren, alarmen, het zelflerende systeem, rapportage en abonnementen." />
        <meta name="keywords" content="IntelliFrost FAQ, koelcelmonitoring vragen, temperatuursensor batterij, HACCP rapport, alarmen escalatie" />
        <link rel="canonical" href="https://intellifrost.be/faq" />
        <meta property="og:title" content="Veelgestelde vragen – IntelliFrost" />
        <meta property="og:description" content="Antwoorden op uw vragen over koelcelmonitoring, hardware, alarmen en abonnementen." />
        <meta property="og:url" content="https://intellifrost.be/faq" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageHeader
        kicker="Veelgestelde vragen"
        title="Antwoorden op uw vragen"
        subtitle="Staat uw vraag er niet bij? Neem gerust contact met ons op."
      />

      <div className="max-w-3xl mx-auto px-5">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((c, i) => (
            <button
              key={c.title}
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

        {/* FAQs */}
        <div className="space-y-2 mb-16">
          {categories[cat].faqs.map((faq, i) => (
            <div key={faq.q} className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-gray-100/60 transition-colors"
              >
                <span className="font-medium text-navy pr-2 leading-snug">{faq.q}</span>
                {open === i ? (
                  <ChevronUpIcon className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <CtaBand
        title="Nog vragen?"
        text="Ons team helpt u graag verder. Stuur een bericht of plan een vrijblijvende demo."
        primaryLabel="Stel uw vraag"
        secondaryTo="/handleidingen"
        secondaryLabel="Bekijk handleidingen"
      />
    </>
  );
};

export default FAQ;
