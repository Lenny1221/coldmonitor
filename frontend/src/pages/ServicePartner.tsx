import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  SparklesIcon,
  StarIcon,
  ClockIcon,
  CubeIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const strengths = [
  {
    icon: WrenchScrewdriverIcon,
    title: 'Herstellingen & plaatsing',
    desc: 'Expertise in ijsturbines van Carpigiani, Telme en Valmar. Elke gangbaar koelinstallatie.',
  },
  {
    icon: AcademicCapIcon,
    title: 'Fabrikantopleidingen in Italië',
    desc: 'Monteurs volgen jaarlijks opleidingen bij de fabrikant – altijd up-to-date met de nieuwste technieken.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Onafhankelijk & merkvrij',
    desc: 'Niet gebonden aan één merk. Serv-Ice staat altijd aan uw kant als neutrale partner.',
  },
];

type ContractTier = 'basis' | 'comfort' | 'allin';

const contracts: {
  id: ContractTier;
  name: string;
  tagline: string;
  price: string;
  period: string;
  highlight: boolean;
  badge?: string;
  features: { text: string; included: boolean }[];
  cta: string;
}[] = [
  {
    id: 'basis',
    name: 'Basis',
    tagline: 'Jaarlijks preventief onderhoud',
    price: 'Op aanvraag',
    period: 'per installatie / jaar',
    highlight: false,
    features: [
      { text: '1× preventief onderhoud per jaar', included: true },
      { text: 'Controle & reiniging koelcircuit', included: true },
      { text: 'Rapport na elk bezoek', included: true },
      { text: 'Kortingstarieven voor interventies', included: true },
      { text: 'Prioriteitstoegang bij storingen', included: false },
      { text: 'Spoedinterventie < 24u', included: false },
      { text: 'Onderdelen met korting inbegrepen', included: false },
    ],
    cta: 'Offerte aanvragen',
  },
  {
    id: 'comfort',
    name: 'Comfort',
    tagline: 'Halfjaaarlijks onderhoud + prioriteit',
    price: 'Op aanvraag',
    period: 'per installatie / jaar',
    highlight: true,
    badge: 'Meest gekozen',
    features: [
      { text: '2× preventief onderhoud per jaar', included: true },
      { text: 'Controle & reiniging koelcircuit', included: true },
      { text: 'Rapport na elk bezoek', included: true },
      { text: 'Kortingstarieven voor interventies', included: true },
      { text: 'Prioriteitstoegang bij storingen', included: true },
      { text: 'Spoedinterventie < 24u', included: false },
      { text: 'Onderdelen met korting inbegrepen', included: false },
    ],
    cta: 'Offerte aanvragen',
  },
  {
    id: 'allin',
    name: 'All-In',
    tagline: 'Volledige zorgeloosheid',
    price: 'Op aanvraag',
    period: 'per installatie / jaar',
    highlight: false,
    badge: 'Meeste voordelen',
    features: [
      { text: '4× preventief onderhoud per jaar', included: true },
      { text: 'Controle & reiniging koelcircuit', included: true },
      { text: 'Rapport na elk bezoek', included: true },
      { text: 'Kortingstarieven voor interventies', included: true },
      { text: 'Prioriteitstoegang bij storingen', included: true },
      { text: 'Spoedinterventie < 24u', included: true },
      { text: 'Onderdelen met korting inbegrepen', included: true },
    ],
    cta: 'Offerte aanvragen',
  },
];

/* ─── Component ─────────────────────────────────────────────────────────────── */

const ServicePartner: React.FC = () => {
  const [activeContract, setActiveContract] = useState<ContractTier>('comfort');
  const active = contracts.find((c) => c.id === activeContract)!;

  return (
    <div className="overflow-x-hidden">
      <Helmet>
        <title>Serv-Ice – Officiële Servicepartner & Servicecontracten | IntelliFrost</title>
        <meta
          name="description"
          content="Serv-Ice is de officiële servicepartner van IntelliFrost. Sluit een servicecontract af voor preventief onderhoud van uw koelinstallaties. Combo-korting bij aankoop van IntelliFrost monitoring."
        />
        <meta
          name="keywords"
          content="Serv-Ice servicecontract, koelinstallatie onderhoud, servicepartner IntelliFrost, combo korting monitoring service, preventief onderhoud koelcel"
        />
        <link rel="canonical" href="https://intellifrost.be/servicepartner" />
        <meta property="og:title" content="Serv-Ice Servicepartner & Servicecontracten | IntelliFrost" />
        <meta property="og:description" content="Servicecontracten voor koelinstallaties via Serv-Ice. Combo-korting bij IntelliFrost monitoring." />
        <meta property="og:url" content="https://intellifrost.be/servicepartner" />
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden mb-0">
        <div className="relative h-[420px] sm:h-[480px]">
          <img
            src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1600&q=90"
            alt="Koeltechnicus aan het werk"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050f1a]/95 via-[#0D1B2E]/75 to-[#0D1B2E]/30" />
          {/* grid overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,200,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-5xl mx-auto px-6 sm:px-10 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00c8ff]/20 border border-[#00c8ff]/40 text-[#00c8ff] text-xs font-semibold mb-5 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c8ff] animate-pulse" />
                Officiële servicepartner van IntelliFrost
              </div>
              <h1 className="font-['Exo_2'] text-4xl sm:text-5xl font-bold mb-4 leading-tight" style={{ color: '#ffffff' }}>
                <span style={{ color: '#ffffff' }}>Serv-Ice</span><br />
                <span style={{ color: '#ffffff' }}>
                  Diepgevroren expertise
                </span>
              </h1>
              <p className="text-white/75 text-lg max-w-xl leading-relaxed mb-8">
                Meer dan 8 jaar ervaring in herstelling, plaatsing en onderhoud van koelinstallaties en ijsturbines. Uw onafhankelijke partner in de koeltechniek.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#servicecontracten"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00e5ff] transition-colors shadow-lg shadow-[#00c8ff]/25"
                >
                  Bekijk servicecontracten
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://www.serv-ice.be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                  serv-ice.be
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact strip ──────────────────────────────────────────────────── */}
      <div className="bg-[#0D1B2E] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center gap-6 text-sm text-white/70">
          <a href="tel:+3233024310" className="flex items-center gap-2 hover:text-[#00c8ff] transition-colors">
            <PhoneIcon className="h-4 w-4 text-[#00c8ff]" />
            +32 3 302 43 10
          </a>
          <a href="mailto:service@serv-ice.be" className="flex items-center gap-2 hover:text-[#00c8ff] transition-colors">
            <EnvelopeIcon className="h-4 w-4 text-[#00c8ff]" />
            service@serv-ice.be
          </a>
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-[#00c8ff]" />
            Kerkevelden 25, 2560 Nijlen
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">

        {/* ── Combo deal ─────────────────────────────────────────────────── */}
        <section className="py-14">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Dark gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#050f1a] via-[#0a1e35] to-[#050f1a]" />
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#00c8ff]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-[#0080ff]/10 blur-3xl pointer-events-none" />

            <div className="relative p-8 sm:p-12">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-semibold mb-5">
                    <TagIcon className="h-3.5 w-3.5" />
                    Exclusieve combodeal
                  </div>
                  <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold mb-4 leading-tight" style={{ color: '#ffffff' }}>
                    <span style={{ color: '#ffffff' }}>IntelliFrost monitoring</span><br />
                    <span style={{ color: '#ffffff' }}>+ Serv-Ice servicecontract</span><br />
                    <span style={{ color: '#ffffff' }}>= dubbele voordelen</span>
                  </h2>
                  <p className="text-white/65 leading-relaxed mb-6">
                    Neem u tegelijk een IntelliFrost monitoringabonnement én een Serv-Ice servicecontract?
                    Dan geniet u van een <strong className="text-white">exclusieve combinatiekorting</strong> op beide — want monitoring en onderhoud horen samen.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      { icon: CubeIcon, text: '1 maand IntelliFrost gratis bij jaarcontract (t.w.v. tot €49)' },
                      { icon: WrenchScrewdriverIcon, text: 'Korting op uw Serv-Ice servicecontract' },
                      { icon: BoltIcon, text: 'Automatische koppeling monitoring → technicus bij alarm' },
                      { icon: ShieldCheckIcon, text: 'Één aanspreekpunt voor monitoring én interventie' },
                    ].map((item) => (
                      <li key={item.text} className="flex items-start gap-3 text-sm text-white/80">
                        <div className="w-7 h-7 rounded-lg bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <item.icon className="h-3.5 w-3.5 text-[#00c8ff]" />
                        </div>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00e5ff] transition-colors text-sm"
                    >
                      Combodeal aanvragen
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                    <a
                      href="#servicecontracten"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors text-sm"
                    >
                      Bekijk contracten
                    </a>
                  </div>
                </div>

                {/* Visual combo card */}
                <div className="flex flex-col gap-4">
                  {/* IntelliFrost card */}
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-[#00c8ff]/30">
                    <div className="w-12 h-12 rounded-xl bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
                      <CubeIcon className="h-6 w-6 text-[#00c8ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">IntelliFrost Monitoring</div>
                      <div className="text-white/50 text-xs">24/7 temperatuurbewaking · HACCP · escalatie</div>
                    </div>
                    <div className="text-[#00c8ff] font-bold text-sm whitespace-nowrap">vanaf €35/m</div>
                  </div>

                  {/* Plus */}
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/50 font-bold">+</div>
                  </div>

                  {/* Serv-Ice card */}
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-[#00c8ff]/30">
                    <div className="w-12 h-12 rounded-xl bg-[#00c8ff]/20 flex items-center justify-center flex-shrink-0">
                      <WrenchScrewdriverIcon className="h-6 w-6 text-[#00c8ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">Serv-Ice Servicecontract</div>
                      <div className="text-white/50 text-xs">Preventief onderhoud · interventie · expertise</div>
                    </div>
                    <div className="text-[#00c8ff] font-bold text-sm whitespace-nowrap">op aanvraag</div>
                  </div>

                  {/* Equals combo */}
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold">=</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-400/15 to-[#00c8ff]/10 border border-amber-400/30">
                    <div className="flex items-center gap-3 mb-2">
                      <SparklesIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
                      <div className="font-bold text-white">Combodeal voordelen</div>
                    </div>
                    <div className="text-white/65 text-xs leading-relaxed">
                      1 maand IntelliFrost gratis + korting op servicecontract + automatische technicuskoppeling
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Serv-Ice ───────────────────────────────────────────────── */}
        <section className="mb-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-4">
                Waarom Serv-Ice?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Met meer dan <strong>8 jaar ervaring</strong> in de sector van koeltechnieken is Serv-Ice dé specialist voor ijsturbines en koelinstallaties. Ze zijn niet gebonden aan één merk en verkopen zelf geen machines — waardoor ze altijd uw belang vooropstellen.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Als officiële servicepartner van IntelliFrost combineert Serv-Ice hun hands-on vakkennis met onze slimme monitoring. Detecteert IntelliFrost een probleem? Dan staat Serv-Ice klaar voor een snelle interventie.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {strengths.map((s) => (
                  <div key={s.title} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#00c8ff]/40 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center mb-3">
                      <s.icon className="h-4 w-4 text-[#00c8ff]" />
                    </div>
                    <div className="font-semibold text-gray-900 text-xs mb-1">{s.title}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Foto */}
            <div className="relative rounded-3xl overflow-hidden h-72 sm:h-80 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=85"
                alt="Koeltechnicus Serv-Ice aan het werk"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2E]/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00c8ff]/30 flex items-center justify-center flex-shrink-0">
                    <StarIcon className="h-4 w-4 text-[#00c8ff]" />
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">+8 jaar ervaring</div>
                    <div className="text-white/60 text-xs">Koeltechnieken & servicemontage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Flow: monitoring + service ────────────────────────────────── */}
        <section className="mb-16 p-8 rounded-3xl bg-gray-50 border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c8ff]/10 border border-[#00c8ff]/30 text-[#00c8ff] text-xs font-medium mb-3">
              IntelliFrost × Serv-Ice
            </div>
            <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-2">
              Monitoring & service, hand in hand
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              IntelliFrost detecteert – Serv-Ice reageert. Samen zorgen we dat uw installatie nooit stilstaat.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { step: '1', icon: BoltIcon, title: 'Alarm gedetecteerd', desc: 'IntelliFrost merkt een temperatuurafwijking en start escalatie.' },
              { step: '2', icon: PhoneIcon, title: 'Technicus gewaarschuwd', desc: 'Serv-Ice wordt automatisch ingelicht via het platform.' },
              { step: '3', icon: WrenchScrewdriverIcon, title: 'Snelle interventie', desc: 'Een servicemonteur komt ter plaatse – met prioriteit bij een servicecontract.' },
              { step: '4', icon: ShieldCheckIcon, title: 'Terug operationeel', desc: 'Installatie hersteld. IntelliFrost bewaakt verder en registreert het event.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-[#00c8ff] flex items-center justify-center text-white text-sm font-bold mb-3">
                  {item.step}
                </div>
                <item.icon className="h-5 w-5 text-[#00c8ff] mb-2" />
                <div className="font-semibold text-gray-900 text-sm mb-1">{item.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Servicecontracten ─────────────────────────────────────────── */}
        <section id="servicecontracten" className="mb-16 scroll-mt-24">
          <div className="text-center mb-10">
            <h2 className="font-['Exo_2'] text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Servicecontracten Serv-Ice
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Kies het contract dat bij uw installatie en noden past. Prijs op aanvraag – afhankelijk van type, aantal installaties en locatie.
            </p>
          </div>

          {/* Mobile: tab selector */}
          <div className="flex sm:hidden gap-2 mb-6">
            {contracts.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveContract(c.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeContract === c.id
                    ? 'bg-[#00c8ff] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Desktop: side-by-side cards */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-5">
            {contracts.map((c) => (
              <div
                key={c.id}
                className={`relative rounded-3xl border-2 transition-all flex flex-col ${
                  c.highlight
                    ? 'border-[#00c8ff] bg-gradient-to-b from-[#00c8ff]/5 to-white shadow-lg shadow-[#00c8ff]/10'
                    : 'border-gray-200 bg-white hover:border-[#00c8ff]/40'
                }`}
              >
                {c.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-[#00c8ff] text-white shadow">
                    {c.badge}
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-5">
                    <div className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-1">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.tagline}</div>
                  </div>
                  <div className="mb-5 pb-5 border-b border-gray-100">
                    <div className="font-['Exo_2'] text-2xl font-bold text-gray-900">{c.price}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.period}</div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {c.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2 text-sm">
                        {f.included ? (
                          <CheckCircleIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0 mt-0.5" />
                        ) : (
                          <XMarkIcon className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="https://www.serv-ice.be/contact/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
                      c.highlight
                        ? 'bg-[#00c8ff] text-white hover:bg-[#00a8dd]'
                        : 'border-2 border-[#00c8ff] text-[#00c8ff] hover:bg-[#00c8ff]/10'
                    }`}
                  >
                    {c.cta}
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: single card display */}
          <div className="sm:hidden">
            <div className={`relative rounded-3xl border-2 flex flex-col ${
              active.highlight ? 'border-[#00c8ff] shadow-lg' : 'border-gray-200'
            }`}>
              {active.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-[#00c8ff] text-white shadow">
                  {active.badge}
                </div>
              )}
              <div className="p-6">
                <div className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-1">{active.name}</div>
                <div className="text-xs text-gray-500 mb-4">{active.tagline}</div>
                <ul className="space-y-2.5 mb-6">
                  {active.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <CheckCircleIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0 mt-0.5" />
                      ) : (
                        <XMarkIcon className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://www.serv-ice.be/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#00c8ff] text-white hover:bg-[#00a8dd] transition-colors"
                >
                  Offerte aanvragen
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-5 flex items-start gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <SparklesIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Combodeal:</strong> combineer een servicecontract met een IntelliFrost monitoringabonnement en geniet van een exclusieve korting op beide.{' '}
              <Link to="/contact" className="underline font-medium">Vraag de combodeal aan →</Link>
            </span>
          </div>
        </section>

        {/* ── Services list ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 mb-5">
            Alle diensten van Serv-Ice
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: WrenchScrewdriverIcon, text: 'Plaatsing van koelinstallaties en ijsturbines' },
              { icon: BoltIcon, text: 'Herstelling bij storingen en defecten' },
              { icon: ClockIcon, text: 'Preventief en curatief onderhoud' },
              { icon: ShieldCheckIcon, text: 'Onderhoud van waterkoelingssystemen' },
              { icon: AcademicCapIcon, text: 'Interventie op alle gangbare merken' },
              { icon: StarIcon, text: 'Advies en ondersteuning voor leveranciers' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#00c8ff]/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-[#00c8ff]" />
                </div>
                <span className="text-sm text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Serv-Ice CTA */}
            <div className="p-7 rounded-3xl bg-gray-50 border border-gray-200 text-center">
              <WrenchScrewdriverIcon className="h-8 w-8 text-[#00c8ff] mx-auto mb-3" />
              <h3 className="font-['Exo_2'] font-bold text-gray-900 mb-2">Servicecontract aanvragen</h3>
              <p className="text-sm text-gray-500 mb-4">Vraag een offerte aan bij Serv-Ice voor onderhoud van uw koelinstallaties.</p>
              <a
                href="https://www.serv-ice.be/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors text-sm w-full"
              >
                Contacteer Serv-Ice
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            </div>
            {/* Combo CTA */}
            <div className="relative p-7 rounded-3xl overflow-hidden text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#050f1a] to-[#0a1e35]" />
              <div className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,200,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.6) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />
              <div className="relative">
                <SparklesIcon className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <h3 className="font-['Exo_2'] font-bold text-white mb-2">Combodeal aanvragen</h3>
                <p className="text-sm text-white/55 mb-4">IntelliFrost monitoring + Serv-Ice servicecontract = exclusieve korting.</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00e5ff] transition-colors text-sm w-full"
                >
                  Combodeal aanvragen
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ServicePartner;
