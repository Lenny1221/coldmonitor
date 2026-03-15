import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

type Billing = 'monthly' | 'yearly' | '3year' | '5year';

const starterPrices: Record<Billing, number> = {
  monthly: 35,
  yearly: 31.5,
  '3year': 28,
  '5year': 24.5,
};

const proPrices: Record<Billing, number> = {
  monthly: 49,
  yearly: 44.1,
  '3year': 39.2,
  '5year': 34.3,
};

const subLabels: Record<Billing, string> = {
  monthly: 'Maandelijks opzegbaar',
  yearly: 'Jaarlijks gefactureerd',
  '3year': 'Driejaarlijks gefactureerd',
  '5year': 'Vijfjaarlijks gefactureerd',
};

const billingOptions: { key: Billing; label: string; badge?: string }[] = [
  { key: 'monthly', label: 'Maandelijks' },
  { key: 'yearly', label: 'Jaarlijks', badge: '-10%' },
  { key: '3year', label: '3 jaar', badge: '-20%' },
  { key: '5year', label: '5 jaar', badge: '-30%' },
];

const starterFeatures = [
  { text: '1 temperatuursensor (PT1000)', included: true },
  { text: 'SMS & app alarmen', included: true },
  { text: 'HACCP rapport (exporteerbaar)', included: true },
  { text: 'Realtime temperatuurlog', included: true },
  { text: 'WiFi verbinding', included: true },
  { text: '4G backup', included: false },
  { text: 'Deursensor', included: false },
];

const proFeatures = [
  { text: '2 temperatuursensoren (PT1000)', included: true },
  { text: 'SMS & app alarmen', included: true },
  { text: 'HACCP rapport (exporteerbaar)', included: true },
  { text: 'Realtime temperatuurlog', included: true },
  { text: 'WiFi verbinding', included: true },
  { text: '4G backup (altijd online)', included: true },
  { text: 'Deursensor inbegrepen', included: true },
  { text: 'Batterijbackup bij stroomuitval', included: true },
];

const multiFeatures = [
  { text: 'Onbeperkt sensoren', included: true },
  { text: 'Alles van Pro inbegrepen', included: true },
  { text: 'Centraal dashboard alle units', included: true },
  { text: 'Prioritair support', included: true },
  { text: 'Installatie op locatie', included: true },
  { text: 'Jaarcontract met volumekorting', included: true },
  { text: 'Maatwerk rapportage', included: true },
];

const durations = [
  { period: 'Maandelijks', discount: 'Geen korting', discountClass: 'bg-gray-100 text-gray-500', price: 49, sub: 'per maand', saving: null, best: false },
  { period: 'Jaarlijks', discount: '-10%', discountClass: 'bg-green-50 text-green-700', price: 44, sub: 'per maand — €528/jaar', saving: 'Bespaar €59/jaar', best: false },
  { period: '3 jaar', discount: '-20%', discountClass: 'bg-amber-50 text-amber-700', price: 39, sub: 'per maand — €1.404/3jr', saving: 'Bespaar €360 totaal', best: false },
  { period: '5 jaar', discount: 'Beste deal -30%', discountClass: 'bg-[#00c8ff]/10 text-[#00a8dd] font-semibold', price: 34, sub: 'per maand — €2.040/5jr', saving: 'Bespaar €840 totaal', best: true },
];

const bundles = [
  { qty: '1 toestel', price: '€49', saving: '—', tag: 'Standaard', tagClass: 'bg-gray-100 text-gray-500' },
  { qty: '2 – 4 toestellen', price: '€42', saving: '-14% per toestel', tag: 'Populair', tagClass: 'bg-[#00c8ff]/10 text-[#007a99]' },
  { qty: '5 – 9 toestellen', price: '€35', saving: '-29% per toestel', tag: 'Populair', tagClass: 'bg-[#00c8ff]/10 text-[#007a99]' },
  { qty: '10+ toestellen', price: '€25+', saving: '-49% per toestel', tag: 'Beste deal', tagClass: 'bg-[#00c8ff] text-white' },
];

const faqs = [
  { q: 'Zijn er opstartkosten?', a: 'De hardware (sensoren) is een eenmalige aankoop. De abonnementsprijs dekt het cloudplatform, alarmsysteem en support.' },
  { q: 'Hoe werkt de facturatie?', a: 'Facturatie verloopt maandelijks, jaarlijks of via een 3- of 5-jarig contract. Hoe langer het contract, hoe hoger de korting.' },
  { q: 'Kan ik upgraden of downgraden?', a: 'Ja. U kunt op elk moment van abonnement wijzigen. Aanpassingen gelden vanaf de volgende factuurperiode.' },
  { q: 'Zijn de sensoren inbegrepen in het abonnement?', a: 'De sensoren worden apart aangekocht (eenmalig). De maandelijkse prijs dekt het platform, alarmen, updates en support.' },
  { q: 'Is er een proefperiode?', a: 'We installeren een pilootunit bij uw zaak zodat u Intellifrost 30 dagen gratis kunt testen. Geen risico, geen verplichtingen.' },
  { q: 'Wat als ik meer toestellen nodig heb?', a: 'Bij meerdere toestellen daalt de prijs per eenheid automatisch. Vraag een offerte aan voor een bundel op maat.' },
];

const Prijzen: React.FC = () => {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const starterPrice = starterPrices[billing];
  const proPrice = proPrices[billing];
  const subLabel = subLabels[billing];

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20">
      <Helmet>
        <title>Prijzen – IntelliFrost | Transparante abonnementen voor koelcelmonitoring</title>
        <meta name="description" content="Bekijk de abonnementen van IntelliFrost: Starter, Pro en Multi. Koelcelmonitoring op maat van uw bedrijf. Eerste maand gratis." />
        <meta name="keywords" content="prijs koelcelmonitoring, abonnement temperatuurmonitoring, offerte koelcel bewaking, kosten HACCP monitoring" />
        <link rel="canonical" href="https://intellifrost.be/prijzen" />
        <meta property="og:title" content="Prijzen – IntelliFrost | Abonnementen op maat" />
        <meta property="og:description" content="Transparante abonnementen voor koelcelmonitoring. Starter, Pro en Multi. Eerste maand gratis." />
        <meta property="og:url" content="https://intellifrost.be/prijzen" />
      </Helmet>

      {/* Header */}
      <div className="text-center mb-12 pt-4">
        <div className="inline-flex items-center gap-1.5 bg-[#00c8ff]/10 border border-[#00c8ff]/30 text-[#007a99] text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#00c8ff] inline-block"></span>
          Transparante prijzen, geen verborgen kosten
        </div>
        <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Slimme koelmonitoring,<br className="hidden sm:block" />
          <span className="text-[#00c8ff]">betaalbaar voor elke zaak</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 font-light">
          Kies het pakket dat past bij jouw situatie. Geen lange contracten verplicht, altijd opzegbaar.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex bg-gray-100 border border-gray-200 rounded-full p-1 gap-1">
          {billingOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setBilling(opt.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billing === opt.key
                  ? 'bg-[#00c8ff] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
              {opt.badge && (
                <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  billing === opt.key ? 'bg-white/20 text-white' : 'bg-[#00c8ff]/15 text-[#007a99]'
                }`}>
                  {opt.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {/* Starter */}
        <div className="flex flex-col rounded-3xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
          <div className="p-8 flex-1">
            <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-1">Starter</h2>
            <p className="text-sm text-gray-500 mb-6 leading-snug">Voor kleine zaken met 1 koelcel of vriezer. Snel geïnstalleerd, direct HACCP-klaar.</p>
            <div className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Hardware eenmalig</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">€399 <span className="text-sm font-normal text-gray-400">excl. BTW</span></div>
            <div className="h-px bg-gray-200 my-5"></div>
            <div className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Abonnement</div>
            <div className="text-3xl font-bold text-[#00c8ff] mb-1">
              €{Math.round(starterPrice)}<span className="text-base font-normal text-gray-400">/maand</span>
            </div>
            <div className="text-sm text-gray-400 mb-6">{subLabel}</div>
            <ul className="space-y-2.5">
              {starterFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-2.5 text-sm">
                  {f.included ? (
                    <span className="w-[18px] h-[18px] rounded-full bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="h-3 w-3 text-[#007a99]" />
                    </span>
                  ) : (
                    <span className="w-[18px] h-[18px] rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 opacity-50">
                      <XMarkIcon className="h-3 w-3 text-gray-400" />
                    </span>
                  )}
                  <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 pt-0">
            <Link to="/contact" className="block w-full text-center py-3 rounded-xl font-semibold border-2 border-[#00c8ff] text-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors text-sm">
              Aan de slag
            </Link>
          </div>
        </div>

        {/* Pro – featured */}
        <div className="flex flex-col rounded-3xl border-2 border-[#00c8ff] bg-gradient-to-b from-[#00c8ff]/8 to-transparent overflow-hidden relative -translate-y-2 shadow-[0_20px_40px_rgba(0,200,255,0.15)]">
          <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2">
            <span className="bg-[#00c8ff] text-white text-[11px] font-bold px-4 py-1 rounded-full tracking-widest uppercase">
              Meest gekozen
            </span>
          </div>
          <div className="p-8 pt-10 flex-1">
            <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-1">Pro</h2>
            <p className="text-sm text-gray-500 mb-6 leading-snug">Voor professionele keukens en koelcellen. Volledig autonoom met 4G backup.</p>
            <div className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Hardware eenmalig</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">€499 <span className="text-sm font-normal text-gray-400">excl. BTW</span></div>
            <div className="h-px bg-[#00c8ff]/20 my-5"></div>
            <div className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Abonnement</div>
            <div className="text-3xl font-bold text-[#00c8ff] mb-1">
              €{Math.round(proPrice)}<span className="text-base font-normal text-gray-400">/maand</span>
            </div>
            <div className="text-sm text-gray-400 mb-6">{subLabel}</div>
            <ul className="space-y-2.5">
              {proFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-2.5 text-sm">
                  <span className="w-[18px] h-[18px] rounded-full bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="h-3 w-3 text-[#007a99]" />
                  </span>
                  <span className="text-gray-700">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 pt-0">
            <Link to="/contact" className="block w-full text-center py-3 rounded-xl font-semibold bg-[#00c8ff] text-white hover:bg-[#00a8dd] transition-colors text-sm">
              Aan de slag
            </Link>
          </div>
        </div>

        {/* Multi */}
        <div className="flex flex-col rounded-3xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
          <div className="p-8 flex-1">
            <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-1">Multi</h2>
            <p className="text-sm text-gray-500 mb-6 leading-snug">Voor grootkeukens, slagerijen en bedrijven met meerdere koelunits. Volumekorting inbegrepen.</p>
            <div className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Hardware eenmalig</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">Op maat</div>
            <div className="h-px bg-gray-200 my-5"></div>
            <div className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Abonnement</div>
            <div className="text-3xl font-bold text-gray-700 mb-1">
              Offerte<span className="text-base font-normal text-gray-400"> op aanvraag</span>
            </div>
            <div className="text-sm text-gray-400 mb-6">Vanaf €25/toestel/maand</div>
            <ul className="space-y-2.5">
              {multiFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-2.5 text-sm">
                  <span className="w-[18px] h-[18px] rounded-full bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="h-3 w-3 text-[#007a99]" />
                  </span>
                  <span className="text-gray-700">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 pt-0">
            <Link to="/contact" className="block w-full text-center py-3 rounded-xl font-semibold border-2 border-[#00c8ff] text-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors text-sm">
              Offerte aanvragen
            </Link>
          </div>
        </div>
      </div>

      {/* Duration discounts */}
      <section className="mb-14">
        <div className="mb-6">
          <span className="inline-block bg-[#00c8ff]/10 text-[#007a99] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Looptijdkorting</span>
          <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-1">Langer contract,<br />meer besparen</h2>
          <p className="text-gray-500 font-light">Gebaseerd op het Pro abonnement (€49/maand)</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {durations.map((d) => (
            <div key={d.period} className={`bg-white rounded-2xl border-2 p-5 text-center transition-all hover:shadow-md ${d.best ? 'border-[#00c8ff]' : 'border-gray-200 hover:border-[#00c8ff]/40'}`}>
              <div className="font-['Exo_2'] text-base font-bold text-gray-900 mb-2">{d.period}</div>
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${d.discountClass}`}>{d.discount}</span>
              <div className="font-['Exo_2'] text-3xl font-bold text-gray-900">
                <sup className="text-base">€</sup>{d.price}
              </div>
              <div className="text-xs text-gray-400 mt-1">{d.sub}</div>
              {d.saving ? (
                <div className="text-xs text-[#00c8ff] font-semibold mt-2">{d.saving}</div>
              ) : (
                <div className="mt-2 h-4"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bundle table */}
      <section className="mb-14">
        <div className="mb-6">
          <span className="inline-block bg-[#00c8ff]/10 text-[#007a99] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Bundels</span>
          <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-1">Meerdere toestellen?<br />Meer korting</h2>
          <p className="text-gray-500 font-light">Per extra toestel daalt de maandelijkse kost automatisch</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 bg-gray-900 px-6 py-4">
            {['Aantal toestellen', 'Prijs/toestel/mnd', 'Besparing', ''].map((h) => (
              <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{h}</span>
            ))}
          </div>
          {bundles.map((b, i) => (
            <div key={i} className="grid grid-cols-4 items-center px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              <div className="font-['Exo_2'] text-sm font-bold text-gray-900">{b.qty}</div>
              <div className="font-['Exo_2'] text-lg font-bold text-[#00c8ff]">{b.price}</div>
              <div className="text-sm font-semibold text-gray-500">{b.saving}</div>
              <div>
                <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${b.tagClass}`}>{b.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-8">Veelgestelde vragen over prijzen</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl bg-gray-50 border border-gray-200 overflow-hidden">
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
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center p-10 rounded-3xl bg-gradient-to-br from-[#00c8ff]/10 to-transparent border border-[#00c8ff]/20">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-3">
          Klaar om te starten?<br />
          <span className="text-[#00c8ff]">Eerste maand gratis.</span>
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto font-light">
          Installeer een pilootunit bij jouw zaak en test Intellifrost 30 dagen zonder risico.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            Demo aanvragen
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold border-2 border-[#00c8ff] text-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
          >
            Neem contact op
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Prijzen;
