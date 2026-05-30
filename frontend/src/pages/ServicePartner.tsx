import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  BoltIcon,
  PhoneIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { CtaBand } from '../components/marketing/ui';
import Photo from '../components/marketing/Photo';

type Tier = 'basis' | 'comfort' | 'allin';

const contracts: {
  id: Tier;
  name: string;
  tagline: string;
  badge?: string;
  highlight: boolean;
  features: { text: string; ok: boolean }[];
}[] = [
  {
    id: 'basis',
    name: 'Basis',
    tagline: 'Jaarlijks preventief onderhoud',
    highlight: false,
    features: [
      { text: '1× preventief onderhoud per jaar', ok: true },
      { text: 'Controle & reiniging koelcircuit', ok: true },
      { text: 'Rapport na elk bezoek', ok: true },
      { text: 'Kortingstarief op interventies', ok: true },
      { text: 'Prioriteit bij storingen', ok: false },
      { text: 'Spoedinterventie < 24u', ok: false },
    ],
  },
  {
    id: 'comfort',
    name: 'Comfort',
    tagline: 'Halfjaarlijks onderhoud + prioriteit',
    badge: 'Meest gekozen',
    highlight: true,
    features: [
      { text: '2× preventief onderhoud per jaar', ok: true },
      { text: 'Controle & reiniging koelcircuit', ok: true },
      { text: 'Rapport na elk bezoek', ok: true },
      { text: 'Kortingstarief op interventies', ok: true },
      { text: 'Prioriteit bij storingen', ok: true },
      { text: 'Spoedinterventie < 24u', ok: false },
    ],
  },
  {
    id: 'allin',
    name: 'All-In',
    tagline: 'Volledige zorgeloosheid',
    badge: 'Meeste voordelen',
    highlight: false,
    features: [
      { text: '4× preventief onderhoud per jaar', ok: true },
      { text: 'Controle & reiniging koelcircuit', ok: true },
      { text: 'Rapport na elk bezoek', ok: true },
      { text: 'Kortingstarief op interventies', ok: true },
      { text: 'Prioriteit bij storingen', ok: true },
      { text: 'Spoedinterventie < 24u', ok: true },
    ],
  },
];

const ServicePartner: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Serv-Ice – Officiële servicepartner & servicecontracten | IntelliFrost</title>
        <meta name="description" content="Serv-Ice is de vaste servicepartner van IntelliFrost. Detecteert IntelliFrost een probleem, dan komt Serv-Ice het ook effectief herstellen. Sluit een servicecontract af of vraag de combodeal aan." />
        <meta name="keywords" content="Serv-Ice servicecontract, koelinstallatie onderhoud, servicepartner IntelliFrost, combo korting monitoring service, preventief onderhoud koelcel" />
        <link rel="canonical" href="https://intellifrost.be/servicepartner" />
        <meta property="og:title" content="Serv-Ice servicepartner & servicecontracten | IntelliFrost" />
        <meta property="og:description" content="Detecteren én oplossen: IntelliFrost monitoring + Serv-Ice servicecontracten. Combo-korting bij beide." />
        <meta property="og:url" content="https://intellifrost.be/servicepartner" />
      </Helmet>

      {/* Hero */}
      <section className="bg-navy text-white px-5 pt-28 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/20 border border-brand/40 text-brand text-xs font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            Onze vaste servicepartner
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-4">Serv-Ice</h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto mb-8">
            Meer dan 8 jaar ervaring in herstelling, plaatsing en onderhoud van koelinstallaties. Detecteert IntelliFrost
            een probleem? Dan staat Serv-Ice klaar om het ook effectief op te lossen.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#contracten" className="bg-brand text-navy font-bold px-7 py-3 rounded-xl hover:bg-brand-dark transition-colors">
              Bekijk servicecontracten
            </a>
            <a
              href="https://www.serv-ice.be"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              serv-ice.be
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <div className="bg-[#0a1626] text-white/70 text-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-5 py-3 flex flex-wrap items-center gap-6">
          <a href="tel:+3233024310" className="flex items-center gap-2 hover:text-brand">
            <PhoneIcon className="h-4 w-4 text-brand" /> +32 3 302 43 10
          </a>
          <a href="mailto:service@serv-ice.be" className="flex items-center gap-2 hover:text-brand">
            <EnvelopeIcon className="h-4 w-4 text-brand" /> service@serv-ice.be
          </a>
          <span className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-brand" /> Kerkevelden 25, 2560 Nijlen
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5">
        {/* Waarom dit ons sterk maakt */}
        <section className="py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block bg-brand/15 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
              Waarom dit ons systeem zo sterk maakt
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mb-4">
              Detecteren én oplossen, hand in hand
            </h2>
            <p className="text-gray-600">
              IntelliFrost stuurt het alarm — Serv-Ice krijgt diezelfde melding en komt herstellen. Geen losse leveranciers,
              geen tijdverlies: één geïntegreerd systeem dat een probleem niet alleen meldt, maar ook oplost.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { step: '1', icon: BoltIcon, title: 'Alarm gedetecteerd', desc: 'IntelliFrost merkt een afwijking en start de escalatie.' },
              { step: '2', icon: PhoneIcon, title: 'Serv-Ice verwittigd', desc: 'De servicepartner krijgt automatisch dezelfde melding.' },
              { step: '3', icon: WrenchScrewdriverIcon, title: 'Snelle interventie', desc: 'Een monteur komt ter plaatse, met prioriteit bij een contract.' },
              { step: '4', icon: ShieldCheckIcon, title: 'Terug operationeel', desc: 'Hersteld en gelogd — IntelliFrost bewaakt verder.' },
            ].map((item) => (
              <div key={item.step} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <div className="w-9 h-9 rounded-full bg-brand text-navy font-display font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <item.icon className="h-5 w-5 text-brand mx-auto mb-2" />
                <h3 className="font-semibold text-navy text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sterktes */}
        <section className="mb-16 grid sm:grid-cols-3 gap-4">
          {[
            { icon: WrenchScrewdriverIcon, title: 'Herstelling & plaatsing', desc: 'Expertise in ijsturbines en alle gangbare koelinstallaties.' },
            { icon: AcademicCapIcon, title: 'Fabrikantopleidingen', desc: 'Monteurs volgen jaarlijks opleiding bij de fabrikant in Italië.' },
            { icon: ShieldCheckIcon, title: 'Onafhankelijk', desc: 'Niet aan één merk gebonden — altijd aan uw kant.' },
          ].map((s) => (
            <div key={s.title} className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center mb-3">
                <s.icon className="h-4 w-4 text-brand" />
              </div>
              <div className="font-semibold text-navy text-sm mb-1">{s.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </section>

        {/* Service-tool voor technici */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <Photo
              src="technician-working.jpg"
              alt="Koeltechnicus voert onderhoud uit aan een koelinstallatie"
              placeholder="Foto: technieker aan het werk op een koelinstallatie"
              ratio="video"
              className="shadow-xl ring-1 ring-black/5"
            />
            <div>
              <span className="inline-block bg-brand/15 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
                Service-tool voor technici
              </span>
              <h2 className="font-display text-2xl font-bold text-navy mb-4">
                Zelflerend systeem, proactief onderhoud
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                IntelliFrost leert elke koelcel kennen: na installatie meet het <strong>7 dagen lang</strong> de
                ruimtevoeler, de verdampervoeler en de delta ertussen, en bouwt zo een <strong>baseline</strong> op.
                Omdat geen enkele cel exact hetzelfde reageert, is dat veel betrouwbaarder dan één vaste drempel.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Gaat een cel zich anders gedragen dan normaal, dan volgt een <strong>preventieve melding</strong> — vaak
                het eerste teken van een koeltechnisch of elektrisch probleem. Zo gebruikt een technieker IntelliFrost als
                échte service-tool naar zijn eindklant: ingrijpen vóór er een storing is.
              </p>
              <ul className="space-y-2.5">
                {[
                  { icon: AcademicCapIcon, t: '7 dagen leerperiode per cel (ruimte + verdamper + delta)' },
                  { icon: CpuChipIcon, t: 'Baseline op maat in plaats van een ruwe vaste grens' },
                  { icon: BoltIcon, t: 'Preventieve melding bij beginnende koel- of elektrische problemen' },
                ].map((it) => (
                  <li key={it.t} className="flex gap-3 items-start text-sm text-gray-700">
                    <span className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                      <it.icon className="h-4 w-4 text-brand" />
                    </span>
                    {it.t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Combodeal */}
        <section className="mb-16">
          <div className="rounded-3xl bg-navy text-white p-8 sm:p-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-semibold mb-5">
              <SparklesIcon className="h-3.5 w-3.5" /> Exclusieve combodeal
            </span>
            <h2 className="font-display text-2xl font-bold mb-4">
              Monitoring + servicecontract = dubbel voordeel
            </h2>
            <p className="text-white/65 mb-6 leading-relaxed max-w-2xl">
              Neemt u tegelijk een IntelliFrost-abonnement én een Serv-Ice servicecontract? Dan geniet u van een
              combinatiekorting op beide — want bewaken en onderhouden horen samen.
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-8">
              {[
                '1 maand IntelliFrost gratis bij jaarcontract',
                'Korting op uw Serv-Ice servicecontract',
                'Automatische koppeling monitoring → technicus',
                'Eén aanspreekpunt voor bewaking én interventie',
              ].map((t) => (
                <li key={t} className="flex gap-2.5 items-start text-sm text-white/80">
                  <CheckCircleIcon className="h-5 w-5 text-brand shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/contact" className="inline-block bg-brand text-navy font-bold px-7 py-3 rounded-xl hover:bg-brand-dark transition-colors">
              Combodeal aanvragen
            </Link>
          </div>
        </section>

        {/* Contracten */}
        <section id="contracten" className="mb-16 scroll-mt-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mb-3">Servicecontracten</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Kies wat past bij uw installatie. Prijs op aanvraag, afhankelijk van type, aantal en locatie.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {contracts.map((c) => (
              <div
                key={c.id}
                className={`relative rounded-3xl border-2 p-6 flex flex-col ${
                  c.highlight ? 'border-brand shadow-lg shadow-brand/10' : 'border-gray-200'
                }`}
              >
                {c.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-navy text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                    {c.badge}
                  </span>
                )}
                <div className="mb-4 mt-1">
                  <div className="font-display text-lg font-bold text-navy">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.tagline}</div>
                </div>
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="font-display text-xl font-bold text-navy">Op aanvraag</div>
                  <div className="text-xs text-gray-400">per installatie / jaar</div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {c.features.map((f) => (
                    <li key={f.text} className="flex gap-2 items-start text-sm">
                      {f.ok ? (
                        <CheckCircleIcon className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                      ) : (
                        <XMarkIcon className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://www.serv-ice.be/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
                    c.highlight ? 'bg-brand text-navy hover:bg-brand-dark' : 'border-2 border-brand text-brand hover:bg-brand/10'
                  }`}
                >
                  Offerte aanvragen
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CtaBand
        title="Bewaking én herstel in één?"
        text="Vraag de combodeal aan: IntelliFrost monitoring + Serv-Ice servicecontract met exclusieve korting."
        primaryLabel="Combodeal aanvragen"
      />
    </>
  );
};

export default ServicePartner;
