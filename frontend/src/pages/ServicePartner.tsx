import React from 'react';
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
} from '@heroicons/react/24/outline';

const strengths = [
  {
    icon: WrenchScrewdriverIcon,
    title: 'Herstellingen & plaatsing',
    desc: 'Expertise in ijsturbines van topmerken als Carpigiani, Telme en Valmar. Plaatsing, herstelling en onderhoud door ervaren servicemonteurs.',
  },
  {
    icon: AcademicCapIcon,
    title: 'Jaarlijkse fabrikantopleidingen',
    desc: 'Servicemonteurs volgen regelmatig opleidingen in Italië bij de fabrikanten zelf – altijd up-to-date met de nieuwste technieken.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Onafhankelijk & merkvrij',
    desc: 'Niet gebonden aan één merk. Serv-Ice is uw onafhankelijke partner die alle gangbare koelinstallaties en ijsturbines kan onderhouden.',
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'Storing of onderhoud nodig?',
    desc: 'U merkt een probleem via IntelliFrost of wilt preventief onderhoud plannen.',
  },
  {
    step: '2',
    title: 'Neem contact op met Serv-Ice',
    desc: 'Via telefoon, e-mail of het contactformulier op serv-ice.be.',
  },
  {
    step: '3',
    title: 'Snelle interventie',
    desc: 'Een ervaren servicemonteur komt ter plaatse voor herstelling of onderhoud.',
  },
  {
    step: '4',
    title: 'Terug operationeel',
    desc: 'Uw installatie draait weer optimaal – IntelliFrost bewaakt continu verder.',
  },
];

const ServicePartner: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <Helmet>
        <title>Serv-Ice – Officiële Servicepartner | IntelliFrost</title>
        <meta
          name="description"
          content="Serv-Ice is de officiële servicepartner van IntelliFrost. Meer dan 8 jaar ervaring in herstelling, plaatsing en onderhoud van koelinstallaties en ijsturbines."
        />
        <meta
          name="keywords"
          content="Serv-Ice, koeltechnicus, servicepartner IntelliFrost, herstelling koelinstallatie, onderhoud ijsturbine, koeltechniek België"
        />
        <link rel="canonical" href="https://intellifrost.be/servicepartner" />
        <meta property="og:title" content="Serv-Ice – Officiële Servicepartner | IntelliFrost" />
        <meta
          property="og:description"
          content="Serv-Ice is de officiële servicepartner van IntelliFrost voor herstelling en onderhoud van koelinstallaties."
        />
        <meta property="og:url" content="https://intellifrost.be/servicepartner" />
      </Helmet>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-12 h-64 shadow-lg">
        <img
          src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1400&q=85"
          alt="Koeltechnicus aan het werk – Serv-Ice servicepartner"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2E]/80 via-[#0D1B2E]/50 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8 sm:px-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c8ff]/20 border border-[#00c8ff]/40 text-[#00c8ff] text-xs font-semibold mb-4 backdrop-blur-sm">
              Officiële servicepartner
            </div>
            <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-white mb-2">
              Serv-Ice
            </h1>
            <p className="text-white/80 text-base sm:text-lg max-w-lg">
              Diepgevroren expertise in koeltechnieken – uw partner voor herstelling, plaatsing en onderhoud.
            </p>
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="grid md:grid-cols-2 gap-10 mb-16 items-start">
        <div>
          <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-4">
            Waarom Serv-Ice?
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Met meer dan <strong>8 jaar ervaring</strong> in de sector van koeltechnieken is Serv-Ice
            dé specialist voor het plaatsen, herstellen en onderhouden van koelinstallaties en
            ijsturbines.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Als officiële servicepartner van IntelliFrost combineert Serv-Ice hun
            hands-on vakkennis met onze slimme monitoring. Detecteert IntelliFrost een
            probleem? Dan staat Serv-Ice klaar voor een snelle interventie.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Serv-Ice is onafhankelijk en niet merkgebonden. Ze verkopen zelf geen
            koelinstallaties, waardoor ze als neutrale partner altijd uw belang
            vooropstellen.
          </p>
        </div>

        {/* Contact card */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
              <WrenchScrewdriverIcon className="h-6 w-6 text-[#00c8ff]" />
            </div>
            <div>
              <div className="font-['Exo_2'] font-bold text-gray-900 text-lg">Serv-Ice</div>
              <div className="text-xs text-gray-500">Officiële servicepartner</div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="tel:+3233024310"
              className="flex items-center gap-3 text-gray-600 hover:text-[#00c8ff] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="h-4 w-4 text-[#00c8ff]" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Telefoon</div>
                <div className="text-sm font-medium">+32 3 302 43 10</div>
              </div>
            </a>
            <a
              href="mailto:service@serv-ice.be"
              className="flex items-center gap-3 text-gray-600 hover:text-[#00c8ff] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                <EnvelopeIcon className="h-4 w-4 text-[#00c8ff]" />
              </div>
              <div>
                <div className="text-xs text-gray-400">E-mail</div>
                <div className="text-sm font-medium">service@serv-ice.be</div>
              </div>
            </a>
            <div className="flex items-start gap-3 text-gray-600">
              <div className="w-9 h-9 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="h-4 w-4 text-[#00c8ff]" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Adres</div>
                <div className="text-sm font-medium">Kerkevelden 25, 2560 Nijlen</div>
                <div className="text-xs text-gray-500">België</div>
              </div>
            </div>
          </div>

          <a
            href="https://www.serv-ice.be"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors text-sm mt-4"
          >
            Bezoek serv-ice.be
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Strengths */}
      <div className="mb-16">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-8">
          Wat Serv-Ice onderscheidt
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {strengths.map((s) => (
            <div
              key={s.title}
              className="p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#00c8ff]/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-[#00c8ff]/15 flex items-center justify-center mb-4">
                <s.icon className="h-5 w-5 text-[#00c8ff]" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">{s.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* IntelliFrost + Serv-Ice */}
      <div className="mb-16 p-8 rounded-3xl bg-gray-50 border border-gray-200">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c8ff]/10 border border-[#00c8ff]/30 text-[#00c8ff] text-xs font-medium mb-4">
            IntelliFrost × Serv-Ice
          </div>
          <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-3">
            Monitoring & service, hand in hand
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            IntelliFrost detecteert problemen automatisch. Serv-Ice lost ze op. Samen garanderen
            we dat uw koelinstallatie altijd optimaal draait.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {howItWorks.map((item) => (
            <div
              key={item.step}
              className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-gray-200"
            >
              <div className="w-10 h-10 rounded-full bg-[#00c8ff] flex items-center justify-center text-white text-sm font-bold mb-3">
                {item.step}
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="mb-16">
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 mb-6">
          Diensten van Serv-Ice
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            'Plaatsing van koelinstallaties en ijsturbines',
            'Herstelling bij storingen en defecten',
            'Preventief en curatief onderhoud',
            'Onderhoud van waterkoelingssystemen',
            'Interventie op alle gangbare merken',
            'Advies en ondersteuning voor leveranciers',
          ].map((service) => (
            <div key={service} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <CheckCircleIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{service}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="text-center mb-6">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 mb-3">
          Hulp nodig bij uw koelinstallatie?
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Neem contact op met Serv-Ice voor herstelling of onderhoud, of ontdek hoe
          IntelliFrost uw installatie 24/7 bewaakt.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://www.serv-ice.be/contact/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            Contacteer Serv-Ice
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
          >
            Contacteer IntelliFrost
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ServicePartner;
