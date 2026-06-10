import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  BoltIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  PhoneIcon,
  ArrowRightIcon,
  SignalIcon,
  CpuChipIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { Check } from '../components/marketing/ui';
import Photo from '../components/marketing/Photo';
import AppStoreBadge from '../components/marketing/AppStoreBadge';
import { starterPrices, proPrices } from '../components/marketing/pricing';

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>IntelliFrost – Slimme koelcelbewaking die problemen herkent én oplost</title>
        <meta name="description" content="IntelliFrost bewaakt uw koelcellen 24/7 op temperatuur, deur en stroom. Bij een probleem wordt ook servicepartner Serv-Ice verwittigd, zodat het ook effectief hersteld wordt. HACCP-klaar, zelflerend en met mobiele app." />
        <meta name="keywords" content="koelcelmonitoring, temperatuurbewaking, HACCP, koelcel alarm, Serv-Ice servicepartner, zelflerend koelcel, koelcel app" />
        <link rel="canonical" href="https://intellifrost.be/" />
        <meta property="og:title" content="IntelliFrost – Koelcelbewaking die problemen herkent én oplost" />
        <meta property="og:description" content="24/7 bewaking van temperatuur, deur en stroom. Detecteren én oplossen via servicepartner Serv-Ice. HACCP-klaar en zelflerend." />
        <meta property="og:url" content="https://intellifrost.be/" />
      </Helmet>

      {/* Hero */}
      <section className="bg-navy text-white px-5 pt-28 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-brand text-sm font-semibold uppercase tracking-wider mb-4">
            HACCP koelcelmonitoring · België &amp; Nederland
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight mb-5 text-white">
            Koelcel in de fout?
            <br />
            <span className="text-brand">Wij weten het — en lossen het op.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto mb-8">
            IntelliFrost bewaakt temperatuur, deur en stroom 24/7. Bij een probleem krijgt niet alleen ú een alarm —
            ook onze vaste servicepartner <strong className="text-white">Serv-Ice</strong> wordt verwittigd en komt herstellen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              className="bg-brand text-navy font-bold px-8 py-3.5 rounded-xl hover:bg-brand-dark transition-colors"
            >
              Gratis demo aanvragen
            </Link>
            <Link
              to="/prijzen"
              className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              Bekijk prijzen
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/40">30 dagen gratis testen · installatie binnen 1 werkdag · geen IT-kennis nodig</p>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="px-5 -mt-12">
        <div className="max-w-4xl mx-auto">
          <Photo
            src="home-hero-devices.png"
            alt="IntelliFrost op laptop en smartphone: koelcel-monitoring overal bij de hand"
            placeholder="Mockup: dashboard op laptop + app op smartphone"
            ratio="video"
            className=""
          />
        </div>
      </section>

      {/* 3 voordelen */}
      <section className="px-5 py-14 border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: SignalIcon, title: 'Altijd online', desc: 'WiFi + 4G backup. Blijft bewaken, ook bij stroomuitval.' },
            { icon: BellAlertIcon, title: 'Direct alarm', desc: 'SMS, app en telefoon zodra temperatuur of deur afwijkt.' },
            { icon: ShieldCheckIcon, title: 'HACCP-klaar', desc: 'Rapporten met één klik, exporteerbaar voor de controle.' },
          ].map((item) => (
            <div key={item.title}>
              <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-6 w-6 text-brand" />
              </div>
              <h3 className="font-display font-bold text-navy text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KERN: detecteren én oplossen */}
      <section className="px-5 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block bg-brand/15 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
              Wat ons uniek maakt
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mb-4">
              Monitoring alleen lost niets op.
              <br />
              <span className="text-brand">Wij sturen ook de hersteller.</span>
            </h2>
            <p className="text-gray-600">
              Andere systemen sturen u een melding en laten u in de kou staan. Bij IntelliFrost krijgt onze vaste
              servicepartner <strong>Serv-Ice</strong> exact dezelfde melding — zo staat er een koeltechnicus klaar
              nog voor uw producten in gevaar komen.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { step: '1', icon: BoltIcon, title: 'Probleem herkend', desc: 'IntelliFrost merkt een afwijking in temperatuur, deur of stroom en start het alarm.' },
              { step: '2', icon: PhoneIcon, title: 'Serv-Ice verwittigd', desc: 'Onze servicepartner krijgt automatisch dezelfde melding via het platform.' },
              { step: '3', icon: WrenchScrewdriverIcon, title: 'Snelle interventie', desc: 'Een koeltechnicus komt ter plaatse — met prioriteit bij een servicecontract.' },
              { step: '4', icon: ShieldCheckIcon, title: 'Opgelost & gelogd', desc: 'Installatie hersteld, het event netjes geregistreerd voor uw HACCP-dossier.' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                <div className="w-9 h-9 rounded-full bg-brand text-navy font-display font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <item.icon className="h-5 w-5 text-brand mx-auto mb-2" />
                <h3 className="font-semibold text-navy text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/servicepartner"
              className="inline-flex items-center gap-2 text-brand font-semibold hover:underline"
            >
              Ontdek onze servicepartner Serv-Ice
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Zelflerend / baseline */}
      <section className="px-5 py-16">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-brand/15 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
              Zelflerend &amp; preventief
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mb-4">
              Uw koelcel leert zichzelf kennen
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Geen twee koelcellen zijn gelijk. Daarom meet IntelliFrost na de installatie <strong>7 dagen lang</strong>
              de ruimtevoeler, de verdampervoeler én de delta daartussen, om een persoonlijke <strong>baseline</strong>
              van uw cel op te bouwen.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Gaat de cel zich daarna anders gedragen dan normaal? Dan krijgt u <strong>preventief</strong> een melding —
              nog vóór de temperatuur ontspoort. Vaak wijst dat op een beginnend koeltechnisch of elektrisch probleem.
            </p>
            <ul className="space-y-2.5">
              {[
                { icon: AcademicCapIcon, t: '7 dagen leren: ruimte- + verdampervoeler en hun delta' },
                { icon: CpuChipIcon, t: 'Eigen baseline per cel — geen ruwe vaste drempel' },
                { icon: BoltIcon, t: 'Preventieve melding bij afwijkend gedrag' },
              ].map((it) => (
                <li key={it.t} className="flex gap-3 items-start text-sm text-gray-700">
                  <span className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                    <it.icon className="h-4 w-4 text-brand" />
                  </span>
                  {it.t}
                </li>
              ))}
            </ul>
            <Link
              to="/servicepartner"
              className="inline-flex items-center gap-2 text-brand font-semibold hover:underline mt-6"
            >
              Ideaal als service-tool voor technici
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <Photo
            src="baseline-learning.png"
            alt="Grafiek met aangeleerde baseline en gedetecteerde afwijking"
            placeholder="Screenshot: temperatuurgrafiek met baseline + afwijking/findings-paneel"
            ratio="square"
            className="shadow-xl ring-1 ring-black/5"
          />
        </div>
      </section>

      {/* Mobiele app */}
      <section className="px-5 py-16 bg-navy text-white overflow-hidden">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="flex justify-center lg:justify-start">
            <Photo
              src="app-smartphone.png"
              alt="IntelliFrost-app geopend op een smartphone"
              placeholder="Foto: smartphone met de IntelliFrost-app open"
              ratio="tall"
              className="max-w-[280px] shadow-2xl shadow-black/40 ring-1 ring-white/10"
            />
          </div>
          <div>
            <span className="inline-block bg-brand/20 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
              Beschikbaar in de App Store
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-white">
              Uw koelcellen in uw broekzak
            </h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Speciaal voor de eindklant: een verzorgde mobiele app waarmee u overal uw koelcellen volgt, alarmen meteen
              binnenkrijgt en met één tik bevestigt. Of u nu thuis bent, op de baan of op vakantie — u hebt altijd controle.
            </p>
            <ul className="space-y-2.5 mb-8">
              {[
                'Push-melding zodra er een alarm is',
                'Live temperatuur van elke cel',
                'Alarm bevestigen met één tik',
              ].map((t) => (
                <li key={t} className="flex gap-3 items-start text-sm text-white/85">
                  <span className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-brand" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-4">
              <AppStoreBadge href="#" />
              <Link to="/app" className="inline-flex items-center gap-2 text-brand font-semibold hover:underline">
                Meer over de app
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Prijs-teaser */}
      <section className="px-5 py-16 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy text-center mb-2">
            Eén systeem, eerlijke prijs
          </h2>
          <p className="text-gray-500 text-center mb-10 text-sm">
            Hardware eenmalig, abonnement per maand. 30 dagen gratis test.
          </p>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <div className="rounded-2xl border-2 border-gray-200 p-6">
              <h3 className="font-display font-bold text-navy">Starter</h3>
              <p className="text-xs text-gray-500 mb-3">1 koelcel · WiFi</p>
              <p className="text-3xl font-bold text-brand">
                €{starterPrices.monthly}<span className="text-base font-normal text-gray-400">/mnd</span>
              </p>
              <p className="text-xs text-gray-400">+ hardware €299 eenmalig</p>
            </div>
            <div className="rounded-2xl border-2 border-brand bg-navy text-white p-6">
              <h3 className="font-display font-bold text-white">Pro</h3>
              <p className="text-xs text-white/50 mb-3">4G · deursensor · batterij</p>
              <p className="text-3xl font-bold text-brand">
                €{proPrices.monthly}<span className="text-base font-normal text-white/40">/mnd</span>
              </p>
              <p className="text-xs text-white/40">+ hardware €399 eenmalig</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/prijzen" className="inline-flex items-center gap-2 text-brand font-semibold hover:underline">
              Bekijk alle prijzen &amp; bundels
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Voor wie + social proof */}
      <section className="px-5 py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-xl font-bold text-navy mb-6">Vertrouwd in elke koude sector</h2>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['Slagers', 'Horeca', 'IJssalons', 'Supermarkten', 'Apotheken', 'Ziekenhuizen', 'Logistiek'].map((s) => (
              <span key={s} className="bg-white border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            {[
              'Geen handmatige HACCP-registratie meer',
              'Nooit meer een nachtelijk alarm missen',
              'Eén aanspreekpunt voor bewaking én herstel',
            ].map((t) => (
              <div key={t} className="flex gap-2 items-start text-sm text-gray-700">
                <Check />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-16 bg-brand/10">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-navy mb-3">
            Klaar om uw koelcel te bewaken?
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            We plaatsen een pilootunit en u test 30 dagen gratis. Geen verplichtingen.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-brand text-navy font-bold px-10 py-3.5 rounded-xl hover:bg-brand-dark transition-colors"
          >
            Gratis demo aanvragen
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
