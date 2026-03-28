import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  CubeIcon,
  BellAlertIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  WifiIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SignalIcon,
  CpuChipIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const tabs = ['De sensor', 'Dashboard', 'Alarmsysteem', 'Certificeringen'];

const hardwareSpecs = [
  { label: 'Temperatuurbereik', value: '-40°C tot +85°C' },
  { label: 'Nauwkeurigheid', value: '± 0,1°C' },
  { label: 'Hoe vaak meten?', value: 'Elke 1 tot 60 minuten (naar keuze)' },
  { label: 'Verbinding', value: 'WiFi of 4G mobiel netwerk' },
  { label: 'Batterijduur', value: 'Tot 2 jaar zonder vervangen' },
  { label: 'Weerbestendig', value: 'Stof- en waterdicht (IP67)' },
  { label: 'Detecteert open deur', value: 'Ja, binnen 1 seconde' },
  { label: 'Installatie', value: 'Zelfklevend of met schroeven' },
];

const dashboardFeatures = [
  { icon: ChartBarIcon, title: 'Live temperatuurgrafieken', desc: 'Zie de temperatuur van elke koelcel in real-time. Zoom terug tot 2 jaar geschiedenis om trends of problemen te spotten.' },
  { icon: SignalIcon, title: 'Alles in één overzicht', desc: 'Groen = alles OK. Oranje = let op. Rood = actie nodig. U ziet in één blik hoe al uw koelcellen het doen.' },
  { icon: MagnifyingGlassIcon, title: 'Historiek van alle alarmen', desc: 'Bekijk wanneer een alarm inging, hoe lang het duurde en wie er op reageerde. Niets gaat verloren.' },
  { icon: DocumentCheckIcon, title: 'Rapporten met één klik', desc: 'Bij een voedselveiligheidscontrole download u direct een volledig rapport. Geen papieren registratie meer nodig.' },
  { icon: UserGroupIcon, title: 'Meerdere gebruikers', desc: 'Voeg uw collega\'s, managers of technici toe. U bepaalt wie wat mag zien en doen.' },
  { icon: CloudArrowUpIcon, title: 'Alles online bewaard', desc: 'Uw gegevens staan veilig online opgeslagen. Geen lokale server, geen backups — wij regelen dat voor u.' },
];

const escalationLayers = [
  {
    layer: 'Stap 1 – Onmiddellijk alarm',
    color: 'border-green-400 bg-green-50',
    badge: 'bg-green-100 text-green-700',
    trigger: 'Zodra de temperatuur de grens overschrijdt',
    actions: [
      'E-mail naar uw contacten',
      'Melding op uw smartphone of computer',
      'Alarm zichtbaar in het dashboard',
    ],
    config: 'U stelt zelf de temperatuurgrens in per koelcel — apart voor te hoog, te laag of een deur die te lang openstaat.',
  },
  {
    layer: 'Stap 2 – Verdere verwittinging',
    color: 'border-orange-400 bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    trigger: 'Als niemand reageert na een instelbaar aantal minuten',
    actions: [
      'SMS naar uw hoofdcontact',
      'SMS naar een reserve-contact',
      'Technicus wordt automatisch verwittigd',
    ],
    config: 'U bepaalt zelf hoe lang het systeem wacht en wie het reserve-contact is.',
  },
  {
    layer: 'Stap 3 – Automatische telefoonoproep',
    color: 'border-red-400 bg-red-50',
    badge: 'bg-red-100 text-red-700',
    trigger: 'Als ook de SMS geen reactie opleverde',
    actions: [
      'Automatische telefoonoproep naar uw contacten',
      'Oproep naar uw reserve-contact',
      'Technicus grijpt in',
    ],
    config: 'Een automatische stem belt u op en vertelt welke koelcel een probleem heeft en hoe lang al. U bevestigt dat u het gehoord heeft.',
  },
];

const complianceItems = [
  { icon: ShieldCheckIcon, title: 'Voedselveiligheid (HACCP)', desc: 'IntelliFrost registreert automatisch alle temperaturen. Bij een inspectie download u met één klik een volledig rapport. Geen handmatige boekhouding meer.' },
  { icon: DocumentCheckIcon, title: 'Farmacie & medische sector', desc: 'Ook geschikt voor apotheken, ziekenhuizen en farmaceutische distributeurs met strenge bewaarregels voor geneesmiddelen.' },
  { icon: ClockIcon, title: '2 jaar bewaard', desc: 'Elke meting wordt minstens 2 jaar bijgehouden. Zo bent u altijd gedekt bij een controle, discussie of klacht.' },
  { icon: CpuChipIcon, title: 'Volledig traceerbaar', desc: 'U ziet precies: welk alarm, wanneer het inging, wie verwittigd werd en wie er op reageerde. Niets gaat verloren.' },
];

const Product: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="max-w-5xl mx-auto px-6">
      <Helmet>
        <title>Wat is IntelliFrost? – Slimme bewaking van uw koelcellen</title>
        <meta name="description" content="IntelliFrost bewaakt uw koelcellen dag en nacht. Ontvang automatisch een melding als de temperatuur afwijkt — via e-mail, SMS of telefoon. Klaar voor voedselveiligheidscontroles." />
        <meta name="keywords" content="koelcel bewaking, temperatuur alarm, voedselveiligheid koelcel, HACCP rapport, koelcel sensor, temperatuurregistratie automatisch" />
        <link rel="canonical" href="https://intellifrost.be/product" />
        <meta property="og:title" content="Wat is IntelliFrost? – Nooit meer zorgen over uw koelcellen" />
        <meta property="og:description" content="Kleine sensor, groot gemak. IntelliFrost bewaakt uw koelcellen en waarschuwt u meteen als er iets mis gaat." />
        <meta property="og:url" content="https://intellifrost.be/product" />
      </Helmet>

      {/* Header */}
      <div className="mb-14">
        <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Wat is IntelliFrost?
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
          IntelliFrost bewaakt uw koelcellen dag en nacht — ook als u er niet bij bent. Loopt de temperatuur op
          of staat er een deur te lang open? Dan krijgt u automatisch een melding, zodat u altijd op tijd kunt ingrijpen en voedselverspilling voorkomt.
        </p>
      </div>

      {/* Quick value props */}
      <div className="grid sm:grid-cols-3 gap-4 mb-14">
        {[
          { icon: WifiIcon, text: 'Klaar in 5 minuten – geen elektricien nodig' },
          { icon: BellAlertIcon, text: 'Altijd verwittigd – ook \'s nachts en in het weekend' },
          { icon: ShieldCheckIcon, text: 'Klaar voor voedselveiligheidscontroles' },
        ].map((vp) => (
          <div key={vp.text} className="flex items-center gap-3 p-4 rounded-xl bg-[#00c8ff]/8 border border-[#00c8ff]/20">
            <vp.icon className="h-5 w-5 text-[#00c8ff] flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">{vp.text}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-10">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 w-fit">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === i
                  ? 'bg-white text-[#00c8ff] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 0 && (
        <div className="mb-14">
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 mb-3">
            De sensor – klein, discreet en betrouwbaar
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            U hangt of plakt de sensor in uw koelcel. Dat is alles. Geen kabels, geen technici, geen gedoe.
            De sensor meet continu de temperatuur en detecteert of een deur te lang openstaat. Alles wordt automatisch doorgestuurd naar uw persoonlijk dashboard.
          </p>

          {/* Hardware foto + specs naast elkaar */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="relative rounded-2xl overflow-hidden h-64 lg:h-auto shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
                alt="IoT sensor hardware voor koelcelmonitoring"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2E]/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
                  <div className="w-2 h-2 rounded-full bg-[#00c8ff] animate-pulse flex-shrink-0" />
                  <span className="text-white text-xs font-medium">Sensor actief · Data wordt verstuurd</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {hardwareSpecs.map((spec) => (
                <div key={spec.label} className="flex justify-between items-center p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-sm text-gray-600">{spec.label}</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#00c8ff]/8 border border-[#00c8ff]/20">
            <div className="flex items-start gap-3">
              <CubeIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                <strong>Geen WiFi in uw koelruimte?</strong> Geen probleem. De sensor werkt ook via het 4G mobiel netwerk —
                zo bent u overal gedekt, ook in kelders of grote opslagplaatsen.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="mb-14">
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 mb-3">
            Uw dashboard – altijd en overal
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Op uw computer, tablet of smartphone ziet u in één oogopslag hoe al uw koelcellen het doen.
            Of u nu thuis bent, op de baan of op vakantie — u hebt altijd controle.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {dashboardFeatures.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-5 w-5 text-[#00c8ff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="mb-14">
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 mb-3">
            Het alarmsysteem – niemand wordt vergeten
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Als er iets misgaat, stuurt IntelliFrost automatisch een alarm. Reageert niemand? Dan escaleert het systeem stap voor stap,
            tot iemand ingrijpt — ook 's nachts en in het weekend.
          </p>
          <div className="space-y-5">
            {escalationLayers.map((layer) => (
              <div key={layer.layer} className={`p-6 rounded-2xl border-2 ${layer.color}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${layer.badge}`}>
                    {layer.layer}
                  </span>
                  <span className="text-xs text-gray-500">{layer.trigger}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Acties</div>
                    <ul className="space-y-1.5">
                      {layer.actions.map((a) => (
                        <li key={a} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircleIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Configuratie</div>
                    <p className="text-sm text-gray-600">{layer.config}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="mb-14">
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 mb-3">
            Automatisch voldoen aan de regels
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            IntelliFrost regelt de temperatuurregistratie volledig automatisch voor u. Bij een controle heeft u alles bij de hand
            — zonder extra moeite of papierwerk.
          </p>
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {complianceItems.map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-[#00c8ff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-xl bg-[#00c8ff]/8 border border-[#00c8ff]/20">
            <p className="text-sm text-gray-700">
              <strong>Bij een inspectie?</strong> Download in enkele seconden een volledig rapport met alle temperatuurmetingen van de gewenste periode.
              De inspecteur heeft alles wat hij nodig heeft — en u hoeft er niets extra voor te doen.
            </p>
          </div>
        </div>
      )}

      {/* Voor wie */}
      <section className="mb-14">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 mb-4">
          Voor wie is IntelliFrost?
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            'Supermarkten & retailers',
            'Slagerijen & bakkers',
            'Restaurants & catering',
            'Groothandels & distributeurs',
            'Farmaceutische bedrijven',
            'Logistiek & transport',
            'Ziekenhuizen & apotheken',
            'Productiebedrijven',
            'Technici & servicebedrijven',
          ].map((sector) => (
            <div key={sector} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">
              <CheckCircleIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0" />
              {sector}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center p-10 rounded-3xl bg-gradient-to-br from-[#00c8ff]/15 to-transparent border border-[#00c8ff]/20">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 mb-3">
          Zelf zien hoe het werkt?
        </h2>
        <p className="text-gray-600 mb-6">
          We tonen u het systeem live en bekijken samen wat de beste oplossing is voor uw situatie. Vrijblijvend en op maat.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            Demo aanvragen
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/prijzen"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
          >
            Bekijk de prijzen
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Product;
