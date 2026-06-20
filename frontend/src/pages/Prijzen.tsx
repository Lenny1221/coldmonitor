import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PageHeader, CtaBand } from '../components/marketing/ui';
import {
  billingOptions,
  starterPrices,
  proPrices,
  subLabels,
  type Billing,
} from '../components/marketing/pricing';

const starterFeatures = [
  { text: '1 temperatuursensor (PT1000)', ok: true },
  { text: 'SMS & app alarmen', ok: true },
  { text: 'HACCP-rapport (exporteerbaar)', ok: true },
  { text: 'Realtime temperatuurlog', ok: true },
  { text: 'WiFi-verbinding', ok: true },
  { text: '4G backup', ok: false },
  { text: 'Deursensor', ok: false },
];

const proFeatures = [
  { text: '2 temperatuursensoren (PT1000)', ok: true },
  { text: 'SMS & app alarmen', ok: true },
  { text: 'HACCP-rapport (exporteerbaar)', ok: true },
  { text: 'Realtime temperatuurlog', ok: true },
  { text: '4G backup (altijd online)', ok: true },
  { text: 'Deursensor inbegrepen', ok: true },
  { text: 'Batterijbackup bij stroomuitval', ok: true },
];

const multiFeatures = [
  { text: 'Onbeperkt sensoren', ok: true },
  { text: 'Alles van Pro inbegrepen', ok: true },
  { text: 'Centraal dashboard alle units', ok: true },
  { text: 'Prioritair support', ok: true },
  { text: 'Installatie op locatie', ok: true },
];

const bundles = [
  { qty: '1 toestel', price: '€39', saving: '—' },
  { qty: '2 – 4 toestellen', price: '€35', saving: '-10% per toestel' },
  { qty: '5 – 9 toestellen', price: '€29', saving: '-26% per toestel' },
  { qty: '10+ toestellen', price: '€25+', saving: '-36% per toestel' },
];

const faqs = [
  { q: 'Zijn de sensoren inbegrepen?', a: 'De hardware is een eenmalige aankoop. Het abonnement dekt het platform, alarmen en support.' },
  { q: 'Is er een proefperiode?', a: 'Ja, we installeren een pilootunit en u test 30 dagen gratis. Geen risico, geen verplichtingen.' },
  { q: 'Kan ik upgraden of stoppen?', a: 'U wijzigt op elk moment. Maandelijks opzegbaar, of langere contracten met korting.' },
];

function FeatureList({ features, dark = false }: { features: { text: string; ok: boolean }[]; dark?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {features.map((f) => (
        <li key={f.text} className="flex gap-2.5 items-center text-sm">
          {f.ok ? (
            <span className="w-[18px] h-[18px] rounded-full bg-brand/15 flex items-center justify-center shrink-0">
              <CheckIcon className="w-3 h-3 text-brand" strokeWidth={3} />
            </span>
          ) : (
            <span className="w-[18px] h-[18px] rounded-full bg-gray-200/40 flex items-center justify-center shrink-0">
              <XMarkIcon className="w-3 h-3 text-gray-400" strokeWidth={3} />
            </span>
          )}
          <span className={f.ok ? (dark ? 'text-white/85' : 'text-gray-700') : 'text-gray-400'}>{f.text}</span>
        </li>
      ))}
    </ul>
  );
}

const Prijzen: React.FC = () => {
  const [billing, setBilling] = useState<Billing>('monthly');
  const starter = Math.round(starterPrices[billing]);
  const pro = Math.round(proPrices[billing]);

  return (
    <>
      <Helmet>
        <title>Prijzen – IntelliFrost | Transparante abonnementen voor koelcelmonitoring</title>
        <meta name="description" content="Bekijk de abonnementen van IntelliFrost: Starter, Pro en Multi. Koelcelmonitoring op maat van uw bedrijf. 30 dagen gratis test." />
        <meta name="keywords" content="prijs koelcelmonitoring, abonnement temperatuurmonitoring, offerte koelcel bewaking, kosten HACCP monitoring" />
        <link rel="canonical" href="https://intellifrost.be/prijzen" />
        <meta property="og:title" content="Prijzen – IntelliFrost | Abonnementen op maat" />
        <meta property="og:description" content="Transparante abonnementen voor koelcelmonitoring. Starter, Pro en Multi. 30 dagen gratis test." />
        <meta property="og:url" content="https://intellifrost.be/prijzen" />
      </Helmet>

      <PageHeader
        kicker="Transparante prijzen"
        title="Betaalbaar voor elke zaak"
        subtitle="Hardware eenmalig, abonnement per maand. Geen verborgen kosten, altijd opzegbaar."
      />

      <div className="max-w-5xl mx-auto px-5">
        {/* Billing toggle */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {billingOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setBilling(opt.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billing === opt.key ? 'bg-brand text-navy shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
              {opt.badge && <span className="ml-1.5 text-xs opacity-80">{opt.badge}</span>}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 items-stretch mb-20">
          {/* Starter */}
          <div className="rounded-3xl border-2 border-gray-200 p-7 flex flex-col h-full">
            <h2 className="font-display text-xl font-bold text-navy mb-1">Starter</h2>
            <p className="text-sm text-gray-500 mb-5">Voor kleine zaken met 1 koelcel.</p>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Hardware eenmalig</div>
            <div className="text-xl font-bold text-navy mb-2">Op offerte</div>
            <a
              href="#contact"
              className="block text-center py-2.5 rounded-xl border-2 border-brand text-brand font-semibold text-sm hover:bg-brand/10 mb-4"
            >
              Offerte aanvragen
            </a>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Abonnement</div>
            <div className="text-4xl font-bold text-brand">€{starter}<span className="text-lg font-normal text-gray-400">/mnd</span></div>
            <div className="text-sm text-gray-400 mb-6">{subLabels[billing]}</div>
            <div className="flex-1"><FeatureList features={starterFeatures} /></div>
            <Link to="/contact" className="mt-6 block text-center py-3 rounded-xl border-2 border-brand text-brand font-semibold text-sm hover:bg-brand/10">
              Aan de slag
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-3xl border-2 border-brand bg-navy text-white p-7 flex flex-col h-full shadow-xl shadow-brand/20">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand text-navy text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
              Meest gekozen
            </span>
            <h2 className="font-display text-xl font-bold mb-1 mt-1 text-white">Pro</h2>
            <p className="text-sm text-white/55 mb-5">Volledig autonoom, met 4G backup.</p>
            <div className="text-xs font-semibold text-white/45 uppercase tracking-widest">Hardware eenmalig</div>
            <div className="text-xl font-bold mb-2">Op offerte</div>
            <a
              href="#contact"
              className="block text-center py-2.5 rounded-xl border-2 border-brand text-brand font-semibold text-sm hover:bg-brand/10 mb-4"
            >
              Offerte aanvragen
            </a>
            <div className="text-xs font-semibold text-white/45 uppercase tracking-widest">Abonnement</div>
            <div className="text-4xl font-bold text-brand">€{pro}<span className="text-lg font-normal text-white/45">/mnd</span></div>
            <div className="text-sm text-white/45 mb-6">{subLabels[billing]}</div>
            <div className="flex-1"><FeatureList features={proFeatures} dark /></div>
            <Link to="/contact" className="mt-6 block text-center py-3 rounded-xl bg-brand text-navy font-bold text-sm hover:bg-brand-dark">
              Demo aanvragen
            </Link>
          </div>

          {/* Multi */}
          <div className="rounded-3xl border-2 border-gray-200 p-7 flex flex-col h-full">
            <h2 className="font-display text-xl font-bold text-navy mb-1">Multi</h2>
            <p className="text-sm text-gray-500 mb-5">Voor meerdere toestellen of locaties.</p>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Hardware eenmalig</div>
            <div className="text-xl font-bold text-navy mb-2">Op offerte</div>
            <a
              href="#contact"
              className="block text-center py-2.5 rounded-xl border-2 border-brand text-brand font-semibold text-sm hover:bg-brand/10 mb-4"
            >
              Offerte aanvragen
            </a>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Abonnement</div>
            <div className="text-4xl font-bold text-brand">vanaf €25<span className="text-lg font-normal text-gray-400">/toestel</span></div>
            <div className="text-sm text-gray-400 mb-6">Volumekorting bij 2+ units</div>
            <div className="flex-1"><FeatureList features={multiFeatures} /></div>
            <Link to="/contact" className="mt-6 block text-center py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:border-brand hover:text-brand">
              Offerte vragen
            </Link>
          </div>
        </div>

        {/* Bundels */}
        <section className="mb-20">
          <h2 className="font-display text-2xl font-bold text-navy text-center mb-2">Bundelkorting</h2>
          <p className="text-gray-500 text-center text-sm mb-8">Meer toestellen, lagere prijs per eenheid (Pro-niveau, per maand).</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {bundles.map((b) => (
              <div key={b.qty} className="rounded-2xl border border-gray-200 p-5 text-center">
                <div className="text-sm font-semibold text-gray-600 mb-2">{b.qty}</div>
                <div className="text-3xl font-bold text-brand mb-1">{b.price}</div>
                <div className="text-xs text-gray-400">{b.saving}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16 max-w-xl mx-auto space-y-5">
          <h2 className="font-display text-xl font-bold text-navy text-center mb-2">Veelgesteld</h2>
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold text-navy text-sm">{f.q}</h3>
              <p className="text-gray-500 text-sm mt-1">{f.a}</p>
            </div>
          ))}
        </section>
      </div>

      <CtaBand
        title="Eerst 30 dagen gratis testen?"
        text="We plaatsen een pilootunit bij u op locatie. Geen verplichtingen."
        secondaryTo="/servicepartner"
        secondaryLabel="Combineer met service"
      />
    </>
  );
};

export default Prijzen;
