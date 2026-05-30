import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  CubeIcon,
  ChartBarIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  WifiIcon,
  CpuChipIcon,
  AcademicCapIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, Check, CtaBand } from '../components/marketing/ui';
import Photo from '../components/marketing/Photo';

const specs = [
  { label: 'Temperatuurbereik', value: '-40°C tot +85°C' },
  { label: 'Nauwkeurigheid', value: '± 0,1°C' },
  { label: 'Meetinterval', value: 'Elke 1 tot 60 min.' },
  { label: 'Verbinding', value: 'WiFi of 4G' },
  { label: 'Batterijduur', value: 'Tot 2 jaar' },
  { label: 'Behuizing', value: 'Stof- & waterdicht (IP67)' },
  { label: 'Deurdetectie', value: 'Binnen 1 seconde' },
  { label: 'Installatie', value: 'Plakken of schroeven, < 5 min.' },
];

const escalation = [
  { stap: 'Stap 1', title: 'Onmiddellijk alarm', desc: 'E-mail + melding op telefoon/computer zodra de grens wordt overschreden.', color: 'border-green-300 bg-green-50', dot: 'bg-green-500' },
  { stap: 'Stap 2', title: 'SMS + servicepartner', desc: 'Reageert niemand? SMS naar uw contacten én Serv-Ice wordt verwittigd.', color: 'border-amber-300 bg-amber-50', dot: 'bg-amber-500' },
  { stap: 'Stap 3', title: 'Automatische telefoonoproep', desc: 'Nog geen reactie? Een stem belt u op met de details en de technicus grijpt in.', color: 'border-red-300 bg-red-50', dot: 'bg-red-500' },
];

const dashboard = [
  { icon: ChartBarIcon, title: 'Live grafieken', desc: 'Realtime temperatuur per koelcel, tot 2 jaar terugkijken.' },
  { icon: ShieldCheckIcon, title: 'Eén overzicht', desc: 'Groen = ok, oranje = let op, rood = actie nodig.' },
  { icon: BellAlertIcon, title: 'Alarm-historiek', desc: 'Wanneer, hoe lang en wie reageerde — niets gaat verloren.' },
  { icon: CubeIcon, title: 'Rapport met één klik', desc: 'Volledig HACCP-rapport klaar voor de inspectie.' },
];

const Product: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Wat is IntelliFrost? – Slimme bewaking van uw koelcellen</title>
        <meta name="description" content="IntelliFrost bewaakt uw koelcellen dag en nacht. Ontvang automatisch een melding als de temperatuur afwijkt — via e-mail, SMS of telefoon. Zelflerend, HACCP-klaar en met mobiele app." />
        <meta name="keywords" content="koelcel bewaking, temperatuur alarm, voedselveiligheid koelcel, HACCP rapport, koelcel sensor, zelflerend baseline" />
        <link rel="canonical" href="https://intellifrost.be/product" />
        <meta property="og:title" content="Wat is IntelliFrost? – Nooit meer zorgen over uw koelcellen" />
        <meta property="og:description" content="Kleine sensor, groot gemak. IntelliFrost bewaakt uw koelcellen en waarschuwt u meteen als er iets mis gaat." />
        <meta property="og:url" content="https://intellifrost.be/product" />
      </Helmet>

      <PageHeader
        kicker="Het product"
        title="Wat is IntelliFrost?"
        subtitle="Een kleine sensor bewaakt uw koelcel dag en nacht. Loopt de temperatuur op of staat een deur te lang open? Dan grijpen u én onze servicepartner op tijd in."
      />

      <div className="max-w-4xl mx-auto px-5">
        {/* Value props */}
        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          {[
            { icon: WifiIcon, text: 'Klaar in 5 minuten, geen elektricien' },
            { icon: BellAlertIcon, text: 'Altijd verwittigd, ook \u2019s nachts' },
            { icon: ShieldCheckIcon, text: 'Klaar voor elke HACCP-controle' },
          ].map((vp) => (
            <div key={vp.text} className="flex items-center gap-3 p-4 rounded-xl bg-brand/10 border border-brand/20">
              <vp.icon className="h-5 w-5 text-brand shrink-0" />
              <span className="text-sm font-medium text-gray-700">{vp.text}</span>
            </div>
          ))}
        </div>

        {/* De sensor */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-navy mb-2">De sensor</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Hangen of plakken in de koelcel — dat is alles. Geen kabels, geen gedoe. De sensor meet continu en stuurt
            alles automatisch naar uw dashboard. Geen WiFi in de koelruimte? Dan werkt hij via 4G.
          </p>
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <Photo
              src="hardware-device.jpg"
              alt="IntelliFrost meetunit met PT1000-voelers"
              placeholder="Foto: de meetunit + PT1000-voelers (ruimte & verdamper)"
              ratio="square"
              className="shadow-lg ring-1 ring-black/5"
            />
            <div className="grid gap-3">
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between items-center p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <span className="text-sm font-semibold text-navy text-right">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-navy mb-2">Uw dashboard</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Op computer, tablet of smartphone ziet u in één oogopslag hoe al uw koelcellen het doen — waar u ook bent.
          </p>
          <Photo
            src="cell-detail-graph.png"
            alt="Detailweergave van een koelcel met live temperatuurgrafiek"
            placeholder="Screenshot: koelcel-detail met live temperatuurgrafiek"
            ratio="video"
            className="mb-6 shadow-lg ring-1 ring-black/5"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {dashboard.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alarmsysteem */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-navy mb-2">Het alarmsysteem</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Gaat er iets mis, dan escaleert IntelliFrost stap voor stap tot iemand ingrijpt. En anders dan bij andere
            systemen wordt ook onze servicepartner <strong>Serv-Ice</strong> mee verwittigd.
          </p>
          <div className="space-y-3">
            {escalation.map((l) => (
              <div key={l.stap} className={`flex gap-4 items-start p-5 rounded-2xl border ${l.color}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${l.dot} mt-1.5 shrink-0`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{l.stap}</span>
                    <span className="font-semibold text-navy text-sm">{l.title}</span>
                  </div>
                  <p className="text-sm text-gray-600">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Zelflerend */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-navy mb-2">Zelflerend &amp; preventief</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Na de installatie meet IntelliFrost <strong>7 dagen lang</strong> de ruimtevoeler, de verdampervoeler en de
            delta ertussen om een <strong>baseline</strong> van uw specifieke cel op te bouwen. Geen enkele cel reageert
            exact hetzelfde — daarom werkt een vaste drempel niet goed. Wijkt de cel daarna af van haar geleerde gedrag,
            dan krijgt u <strong>preventief</strong> een melding, vaak nog voor de temperatuur ontspoort.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: AcademicCapIcon, title: '7 dagen leren', desc: 'Ruimte- en verdampervoeler + hun delta worden volledig in kaart gebracht.' },
              { icon: CpuChipIcon, title: 'Eigen baseline', desc: 'Een profiel op maat van uw cel — slimmer dan één vaste grens.' },
              { icon: BoltIcon, title: 'Preventief alarm', desc: 'Afwijkend gedrag wijst vaak op een koeltechnisch of elektrisch probleem.' },
            ].map((c) => (
              <div key={c.title} className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center mb-3">
                  <c.icon className="h-4 w-4 text-brand" />
                </div>
                <div className="font-semibold text-navy text-sm mb-1">{c.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{c.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-brand/10 border border-brand/20 text-sm text-gray-700">
            <strong>Ook een service-tool:</strong> dankzij dit zelflerende proces kan een technieker IntelliFrost gebruiken
            om proactief onderhoud te plannen bij zijn eindklanten — ingrijpen vóór er een storing is.
          </div>
        </section>

        {/* Compliance */}
        <section className="mb-16 p-6 rounded-2xl bg-navy text-white">
          <h2 className="font-display text-xl font-bold mb-4">Automatisch in regel</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              'Automatische HACCP-registratie van elke meting',
              'Rapport downloaden bij inspectie, in seconden',
              'Minstens 2 jaar bewaard — altijd gedekt',
              'Geschikt voor farmacie & zorg (GDP/GMP)',
            ].map((t) => (
              <div key={t} className="flex gap-2 items-start text-sm text-white/80">
                <Check />
                {t}
              </div>
            ))}
          </div>
        </section>
      </div>

      <CtaBand
        title="Zelf zien hoe het werkt?"
        text="We tonen het systeem live en bekijken samen wat het beste past bij uw situatie."
        secondaryTo="/prijzen"
        secondaryLabel="Bekijk de prijzen"
      />
    </>
  );
};

export default Product;
