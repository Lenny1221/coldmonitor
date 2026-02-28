import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const plans = [
  {
    name: 'Starter',
    tagline: 'Voor kleine bedrijven met 1-5 koelcellen',
    price: 'Op maat',
    highlight: false,
    features: [
      { text: 'Tot 5 koelcellen', included: true },
      { text: 'Realtime temperatuurmonitoring', included: true },
      { text: 'Deurstatus monitoring', included: true },
      { text: 'E-mail alarmen', included: true },
      { text: 'SMS alarmen', included: true },
      { text: 'AI-telefoon escalatie', included: false },
      { text: 'Backup contacten', included: true },
      { text: 'Webdashboard', included: true },
      { text: 'Historische grafieken (6 maanden)', included: true },
      { text: 'Historische grafieken (2 jaar)', included: false },
      { text: 'HACCP-rapportage (PDF)', included: true },
      { text: 'CSV-export', included: false },
      { text: 'Technicus-koppeling', included: false },
      { text: 'Multi-locatie beheer', included: false },
      { text: 'Openingstijden-configuratie', included: true },
      { text: 'Gebruikersbeheer', included: false },
      { text: 'API-toegang', included: false },
      { text: 'Prioritaire support', included: false },
    ],
  },
  {
    name: 'Professional',
    tagline: 'Voor middelgrote bedrijven en retail',
    price: 'Op maat',
    highlight: true,
    badge: 'MEEST GEKOZEN',
    features: [
      { text: 'Onbeperkt koelcellen', included: true },
      { text: 'Realtime temperatuurmonitoring', included: true },
      { text: 'Deurstatus monitoring', included: true },
      { text: 'E-mail alarmen', included: true },
      { text: 'SMS alarmen', included: true },
      { text: 'AI-telefoon escalatie', included: true },
      { text: 'Backup contacten', included: true },
      { text: 'Webdashboard', included: true },
      { text: 'Historische grafieken (6 maanden)', included: true },
      { text: 'Historische grafieken (2 jaar)', included: true },
      { text: 'HACCP-rapportage (PDF)', included: true },
      { text: 'CSV-export', included: true },
      { text: 'Technicus-koppeling', included: true },
      { text: 'Multi-locatie beheer', included: true },
      { text: 'Openingstijden-configuratie', included: true },
      { text: 'Gebruikersbeheer', included: true },
      { text: 'API-toegang', included: false },
      { text: 'Prioritaire support', included: false },
    ],
  },
  {
    name: 'Enterprise',
    tagline: 'Voor grote bedrijven en technici',
    price: 'Op maat',
    highlight: false,
    features: [
      { text: 'Onbeperkt koelcellen', included: true },
      { text: 'Realtime temperatuurmonitoring', included: true },
      { text: 'Deurstatus monitoring', included: true },
      { text: 'E-mail alarmen', included: true },
      { text: 'SMS alarmen', included: true },
      { text: 'AI-telefoon escalatie', included: true },
      { text: 'Backup contacten', included: true },
      { text: 'Webdashboard', included: true },
      { text: 'Historische grafieken (6 maanden)', included: true },
      { text: 'Historische grafieken (2 jaar)', included: true },
      { text: 'HACCP-rapportage (PDF)', included: true },
      { text: 'CSV-export', included: true },
      { text: 'Technicus-koppeling', included: true },
      { text: 'Multi-locatie beheer', included: true },
      { text: 'Openingstijden-configuratie', included: true },
      { text: 'Gebruikersbeheer', included: true },
      { text: 'API-toegang', included: true },
      { text: 'Prioritaire support', included: true },
    ],
  },
];

const addons = [
  { name: 'Extra SMS-bundel', desc: 'Bijkomende SMS-kredieten bij hoog alarmvolume' },
  { name: 'AI-telefoon premium', desc: 'Hogere beschikbaarheid en meertalige stemmen' },
  { name: 'Verlengde dataretentie', desc: 'Data bewaren tot 5 jaar i.p.v. 2 jaar' },
  { name: 'White-label', desc: 'Platform in uw eigen huisstijl voor technici' },
  { name: 'On-premise hosting', desc: 'Data op uw eigen servers (op aanvraag)' },
  { name: 'SLA-contract', desc: 'Gegarandeerde responstijden en uptime-SLA' },
];

const faqs = [
  { q: 'Zijn er opstartkosten?', a: 'De hardware (sensoren) is een eenmalige aankoop. De abonnementsprijs dekt het cloudplatform, alarmsysteem en support.' },
  { q: 'Hoe werkt de facturatie?', a: 'Facturatie verloopt maandelijks of jaarlijks. Bij jaarlijkse facturatie is een korting van toepassing.' },
  { q: 'Kan ik upgraden of downgraden?', a: 'Ja. U kunt op elk moment van abonnement wijzigen. Aanpassingen gelden vanaf de volgende factuurperiode.' },
  { q: 'Zijn de sensoren inbegrepen in het abonnement?', a: 'De sensoren worden apart aangekocht. De maandelijkse abonnementsprijs is voor het platform. Hardware-pakketten zijn beschikbaar via ons.' },
  { q: 'Is er een proefperiode?', a: 'We bieden een demo-installatie aan waarbij u het systeem kunt testen. Neem contact op voor de voorwaarden.' },
  { q: 'Wat als ik meer koelcellen nodig heb dan het plan dekt?', a: 'Bij Starter kunt u upgraden naar Professional voor onbeperkt aantal koelcellen. Bijkomende koelcellen zijn ook mogelijk op aanvraag.' },
];

const Prijzen: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-6">
      <Helmet>
        <title>Prijzen – IntelliFrost | Transparante abonnementen voor koelcelmonitoring</title>
        <meta name="description" content="Bekijk de abonnementen van IntelliFrost: Starter, Professional en Enterprise. Koelcelmonitoring op maat van uw bedrijf. Vraag een vrijblijvende offerte aan." />
        <meta name="keywords" content="prijs koelcelmonitoring, abonnement temperatuurmonitoring, offerte koelcel bewaking, kosten HACCP monitoring" />
        <link rel="canonical" href="https://intellifrost.be/prijzen" />
        <meta property="og:title" content="Prijzen – IntelliFrost | Abonnementen op maat" />
        <meta property="og:description" content="Transparante abonnementen voor koelcelmonitoring. Starter, Professional en Enterprise. Vraag een offerte aan." />
        <meta property="og:url" content="https://intellifrost.be/prijzen" />
      </Helmet>

      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Transparante prijzen
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Kies het plan dat past bij uw bedrijfsgrootte. Alle plannen zijn beschikbaar op maat –
          neem contact op voor een persoonlijke offerte.
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-3xl border-2 overflow-hidden ${
              plan.highlight
                ? 'border-[#00c8ff] bg-gradient-to-b from-[#00c8ff]/5 to-transparent'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="p-8 flex-1">
              {plan.highlight && plan.badge && (
                <div className="inline-block px-3 py-1 rounded-full bg-[#00c8ff] text-white text-xs font-bold mb-4">
                  {plan.badge}
                </div>
              )}
              <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-1">
                {plan.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{plan.tagline}</p>
              <div className="text-3xl font-bold text-[#00c8ff] mb-8">{plan.price}</div>
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <CheckIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0" />
                    ) : (
                      <XMarkIcon className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 pt-0">
              <Link
                to="/contact"
                className={`block w-full text-center py-3 rounded-xl font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-[#00c8ff] text-white hover:bg-[#00a8dd]'
                    : 'border-2 border-[#00c8ff] text-[#00c8ff] hover:bg-[#00c8ff]/10'
                }`}
              >
                Offerte aanvragen
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <section className="mb-16">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-4">
          Uitbreidingen & add-ons
        </h2>
        <p className="text-gray-600 mb-8">
          Breidt u uw abonnement uit met extra modules op maat van uw noden.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {addons.map((addon) => (
            <div key={addon.name} className="p-5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="font-semibold text-gray-900 mb-1 text-sm">{addon.name}</div>
              <div className="text-xs text-gray-500">{addon.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROI section */}
      <section className="mb-16 p-8 rounded-3xl bg-gradient-to-br from-[#00c8ff]/10 to-transparent border border-[#00c8ff]/20">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-4">
          Wat kost een gemiste alarm u?
        </h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Een defecte koelcel die 's nachts niet opgemerkt wordt kan leiden tot enorme schade. IntelliFrost betaalt
          zichzelf terug bij het eerste vermeden incident.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { scenario: 'Supermarkt koelcel 1 nacht', loss: '€ 3.000 – 15.000', desc: 'Productschade, vervanging, FAVV-boete' },
            { scenario: 'Farmaceutisch – vaccins', loss: '€ 10.000 – 50.000', desc: 'Productschade + aansprakelijkheid + reputatie' },
            { scenario: 'Restaurant vriezer weekend', loss: '€ 2.000 – 8.000', desc: 'Vlees, vis, ingrediënten + noodaankopen' },
          ].map((item) => (
            <div key={item.scenario} className="p-5 rounded-xl bg-white border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">{item.scenario}</div>
              <div className="font-['Exo_2'] text-xl font-bold text-red-500 mb-1">{item.loss}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            IntelliFrost kost slechts een fractie van één vermeden incident. En het beschermt u elke nacht.
          </p>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="mb-14">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-8">
          Veelgestelde vragen over prijzen
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl bg-gray-50 border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left font-medium text-gray-900 hover:bg-gray-100/50 transition-colors text-sm"
              >
                {faq.q}
                <span className="text-[#00c8ff] flex-shrink-0 ml-4 text-lg leading-none">
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center mb-6 p-10 rounded-3xl bg-gray-50 border border-gray-200">
        <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-3">
          Persoonlijke offerte aanvragen
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Elke situatie is anders. Contacteer ons voor een offerte op maat van uw bedrijf, aantal locaties en koelcellen.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
        >
          Neem contact op
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
};

export default Prijzen;
