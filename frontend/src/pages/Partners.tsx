import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  BanknotesIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Check, CtaBand } from '../components/marketing/ui';

const flowSteps = [
  { n: '1', title: 'Klant ontdekt IntelliFrost', desc: 'Via Meta Ads, LinkedIn of de website. Demo of contactformulier.' },
  { n: '2', title: 'Lead bij IntelliFrost', desc: 'Wij ontvangen naam, bedrijf, regio en type koelruimte.' },
  { n: '3', title: 'Koppeling aan partner', desc: 'Op regio en tier: Platinum eerst, dan Gold, dan Silver. U krijgt een notificatie.' },
  { n: '4', title: 'U neemt contact op', desc: 'Demo, plaatsbezoek en deal sluiten — binnen 48 uur.' },
  { n: '5', title: 'Verkoop & installatie', desc: 'Hardware inkoop aan partnerprijs, verkoop aan eigen marge.' },
  { n: '6', title: 'Abonnement via IntelliFrost', desc: 'Klant betaalt maandelijks (vanaf €29/mnd) rechtstreeks aan ons.' },
  { n: '7', title: 'Recurring commissie', desc: 'Maandelijks 10–15% op het abonnement, zolang de klant actief blijft.' },
];

const tierRows: { label: string; silver: string; gold: string; platinum: string }[] = [
  { label: 'Instapdrempel', silver: '1 actieve klant', gold: '5 actieve klanten', platinum: '15 actieve klanten' },
  { label: 'Commissie maandabonnement', silver: '10%', gold: '12%', platinum: '15%' },
  { label: 'Marge op hardware', silver: 'Vrij te bepalen', gold: 'Vrij te bepalen', platinum: 'Vrij te bepalen' },
  { label: 'Prioriteit bij leads', silver: 'Laag', gold: 'Gemiddeld', platinum: 'Hoog — eerste keus' },
  { label: 'Korting hardwareaankoop', silver: '—', gold: '+5%', platinum: '+10%' },
  { label: 'Support van IntelliFrost', silver: 'Standaard', gold: 'Prioriteit', platinum: 'Dedicated contact' },
  { label: 'Vermelding op website', silver: 'Nee', gold: 'Ja', platinum: 'Ja — uitgelicht' },
  { label: 'Co-marketing materiaal', silver: 'Basis', gold: 'Uitgebreid', platinum: 'Op maat' },
];

const earningsRows: { clients: number; silver: string; gold: string; platinum: string }[] = [
  { clients: 5, silver: '€14,50/mnd', gold: '€17,40/mnd', platinum: '€21,75/mnd' },
  { clients: 10, silver: '€29,00/mnd', gold: '€34,80/mnd', platinum: '€43,50/mnd' },
  { clients: 20, silver: '€58,00/mnd', gold: '€69,60/mnd', platinum: '€87,00/mnd' },
  { clients: 30, silver: '€87,00/mnd', gold: '€104,40/mnd', platinum: '€130,50/mnd' },
  { clients: 50, silver: '€145,00/mnd', gold: '€174,00/mnd', platinum: '€217,50/mnd' },
];

const onboardingSteps = [
  'Contact opnemen via intellifrost.be/partners',
  'Kennismakingsgesprek: regio, klantenbestand, ervaring',
  'Ondertekening partnerovereenkomst',
  'Onboarding: technicus-dashboard, producttraining, verkoopmateriaal',
  'Eerste lead of eigen klant activeren',
  'Automatische tier-stijging naarmate u groeit',
];

const expectations = [
  'Actief IntelliFrost promoten bij eigen klanten en netwerk',
  'Leads binnen 48 uur opvolgen',
  'Kwalitatieve installatie en nazorg bij de eindklant',
  'Terugkoppeling aan IntelliFrost over leadstatus',
  'Gebruik van het officiële IntelliFrost partnerlogo',
];

const Partners: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Partnerprogramma – IntelliFrost | Verkoop, installatie & recurring commissie</title>
        <meta
          name="description"
          content="Word IntelliFrost-partner als koeltechnisch bedrijf. Verkoop hardware met eigen marge, verdien 10–15% recurring commissie op abonnementen en ontvang leads op basis van tier en regio."
        />
        <link rel="canonical" href="https://intellifrost.be/partners" />
        <meta property="og:title" content="IntelliFrost Partnerprogramma" />
        <meta
          property="og:description"
          content="Koeltechnische servicebedrijven als verkoopnetwerk: marge op hardware + maandelijkse commissie + leads van IntelliFrost."
        />
        <meta property="og:url" content="https://intellifrost.be/partners" />
      </Helmet>

      {/* Hero */}
      <section className="bg-navy text-white px-5 pt-28 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/20 border border-brand/40 text-brand text-xs font-semibold mb-5">
            <UserGroupIcon className="h-4 w-4" />
            Partner Channel Model
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-4 text-white">
            Word IntelliFrost-partner
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Koeltechnische servicebedrijven en technici zijn ons verkoopnetwerk. U verkoopt en installeert,
            maakt marge op hardware en verdient recurring commissie op elk actief abonnement — plus leads van ons.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/contact?type=technicus"
              className="bg-brand text-navy font-bold px-7 py-3 rounded-xl hover:bg-brand-dark transition-colors"
            >
              Partner worden
            </Link>
            <a href="#tiers" className="border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Bekijk tiers
            </a>
          </div>
        </div>
      </section>

      {/* Voordelen */}
      <section className="px-5 py-14 border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
            <h2 className="font-display text-xl font-bold text-navy mb-3 flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-brand" />
              Voor IntelliFrost
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Geen groot verkoopteam nodig. Partners bereiken klanten die we zelf moeilijk bereiken — via
              bestaande relaties en lokale aanwezigheid in de regio.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-brand/5 border border-brand/20">
            <h2 className="font-display text-xl font-bold text-navy mb-3 flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-6 w-6 text-brand" />
              Voor u als partner
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Extra inkomsten bovenop uw servicediensten: marge op hardware én recurring commissie zolang de klant
              blijft. Meer klanten = betere tier = meer leads en betere voorwaarden.
            </p>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="px-5 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy text-center mb-3">
            Hoe werkt het?
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10 max-w-xl mx-auto">
            Leads komen binnen via advertenties of de website. IntelliFrost koppelt ze aan de juiste partner.
            Facturatie abonnement loopt altijd via ons.
          </p>
          <div className="space-y-4">
            {flowSteps.map((s) => (
              <div key={s.n} className="flex gap-4 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                <span className="w-10 h-10 rounded-full bg-brand text-navy font-bold flex items-center justify-center shrink-0">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-semibold text-navy">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section id="tiers" className="px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy text-center mb-3">
            Partner tiers: Silver, Gold & Platinum
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10 max-w-2xl mx-auto">
            Tiers worden automatisch toegekend op basis van actieve abonnementen. Maandelijks geëvalueerd —
            u kan gedurende het lopende kwartaal niet in tier zakken.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="text-left p-4 font-semibold">Voordeel</th>
                  <th className="p-4 font-semibold text-center">Silver</th>
                  <th className="p-4 font-semibold text-center bg-brand/20">Gold</th>
                  <th className="p-4 font-semibold text-center">Platinum</th>
                </tr>
              </thead>
              <tbody>
                {tierRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-4 font-medium text-navy border-t border-gray-100">{row.label}</td>
                    <td className="p-4 text-center text-gray-600 border-t border-gray-100">{row.silver}</td>
                    <td className="p-4 text-center text-gray-700 border-t border-gray-100 bg-brand/5 font-medium">{row.gold}</td>
                    <td className="p-4 text-center text-gray-600 border-t border-gray-100">{row.platinum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Verdiensten */}
      <section className="px-5 py-16 bg-navy text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-3 text-white">
            Wat verdient u concreet?
          </h2>
          <p className="text-white/60 text-center text-sm mb-10 max-w-2xl mx-auto">
            Recurring commissie op het maandabonnement (excl. hardwaremarge). Gebaseerd op starttarief €29/mnd —
            hogere formules geven proportioneel meer commissie.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-white/10">
                  <th className="p-4 text-left font-semibold">Actieve klanten</th>
                  <th className="p-4 text-center font-semibold">Silver (10%)</th>
                  <th className="p-4 text-center font-semibold">Gold (12%)</th>
                  <th className="p-4 text-center font-semibold">Platinum (15%)</th>
                </tr>
              </thead>
              <tbody>
                {earningsRows.map((row) => (
                  <tr key={row.clients} className="border-t border-white/10">
                    <td className="p-4 font-medium">{row.clients} klanten</td>
                    <td className="p-4 text-center text-white/80">{row.silver}</td>
                    <td className="p-4 text-center text-brand font-medium">{row.gold}</td>
                    <td className="p-4 text-center text-white/80">{row.platinum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-white/50 text-xs mt-6 text-center max-w-xl mx-auto">
            Hardware: u koopt in aan partnerprijs en verkoopt door aan eigen prijs — geen minimum of maximum.
            Platinum-partners profiteren van extra hardwarekorting.
          </p>
        </div>
      </section>

      {/* Facturatie + leads */}
      <section className="px-5 py-16">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy mb-4 flex items-center gap-2">
              <BanknotesIcon className="h-6 w-6 text-brand" />
              Facturatie
            </h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <Check />
                <span><strong className="text-navy">Klant</strong> betaalt maandelijks abonnement rechtstreeks aan IntelliFrost.</span>
              </li>
              <li className="flex gap-2">
                <Check />
                <span><strong className="text-navy">IntelliFrost</strong> berekent uw commissie en betaalt maandelijks uit met overzicht.</span>
              </li>
              <li className="flex gap-2">
                <Check />
                <span><strong className="text-navy">Hardware</strong>: wij factureren partnerprijs aan u; u factureert uw prijs aan de eindklant.</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-navy mb-4 flex items-center gap-2">
              <MapPinIcon className="h-6 w-6 text-brand" />
              Lead-verdeling
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Wij verkopen niet rechtstreeks aan eindklanten — leads gaan naar partners. Zo blijft u gemotiveerd
              en bouwen we samen het netwerk uit.
            </p>
            <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
              <li>Filter op regio (postcode / provincie)</li>
              <li>Platinum krijgt eerste keus, dan Gold, dan Silver</li>
              <li>Automatische notificatie met leadgegevens</li>
              <li>48 uur opvolgtermijn — anders door naar volgende partner</li>
              <li>Terugkoppeling over conversie houdt kwaliteit hoog</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Lead schema visueel */}
      <section className="px-5 py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-lg font-bold text-navy mb-6">Lead doorstroom</h2>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
            <span className="px-4 py-2 rounded-lg bg-white border border-gray-200">Klant vraagt demo aan</span>
            <span className="text-brand hidden sm:inline">→</span>
            <span className="px-4 py-2 rounded-lg bg-white border border-gray-200">Match op regio & tier</span>
            <span className="text-brand hidden sm:inline">→</span>
            <span className="px-4 py-2 rounded-lg bg-brand/10 border border-brand/30 text-navy">Platinum → Gold → Silver</span>
          </div>
          <p className="text-xs text-gray-500 mt-4">Geen partner in regio? Wij zoeken de dichtstbijzijnde partner.</p>
        </div>
      </section>

      {/* Onboarding + verwachtingen */}
      <section className="px-5 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-xl font-bold text-navy mb-6">Partner worden in 6 stappen</h2>
            <ol className="space-y-4">
              {onboardingSteps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-navy mb-6">Wat wij van u verwachten</h2>
            <ul className="space-y-3">
              {expectations.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-brand shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Samenvatting */}
      <section className="px-5 py-12 bg-brand/5 border-t border-brand/20">
        <blockquote className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-navy font-medium leading-relaxed italic">
            Koeltechnische servicebedrijven verkopen IntelliFrost bij hun klanten, maken marge op de hardware,
            verdienen recurring commissie op het abonnement, en krijgen extra leads van IntelliFrost naarmate ze meer verkopen.
          </p>
        </blockquote>
      </section>

      <CtaBand
        title="Klaar om partner te worden?"
        text="Neem contact op voor een kennismakingsgesprek. Wij bespreken uw regio, ervaring en de volgende stappen."
        primaryTo="/contact?type=technicus"
        primaryLabel="Partner worden"
        secondaryTo="/prijzen"
        secondaryLabel="Bekijk prijzen"
      />
    </>
  );
};

export default Partners;
