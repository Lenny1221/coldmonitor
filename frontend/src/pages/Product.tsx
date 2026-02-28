import React, { useState } from 'react';
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

const tabs = ['Hardware', 'Dashboard', 'Escalatie', 'Compliance'];

const hardwareSpecs = [
  { label: 'Meetbereik temperatuur', value: '-40°C tot +85°C' },
  { label: 'Nauwkeurigheid', value: '± 0,1°C' },
  { label: 'Meetinterval', value: 'Configureerbaar (1 – 60 min.)' },
  { label: 'Verbinding', value: 'WiFi 2.4GHz / 4G LTE' },
  { label: 'Batterijduur', value: 'Tot 2 jaar (afhankelijk van interval)' },
  { label: 'Beschermingsgraad', value: 'IP67 (stof- en waterdicht)' },
  { label: 'Deurstatus', value: 'Reed-schakelaar, detectie < 1 seconde' },
  { label: 'Montage', value: 'Zelfklevend of schroefbevestiging' },
];

const dashboardFeatures = [
  { icon: ChartBarIcon, title: 'Realtime grafieken', desc: 'Bekijk de temperatuurcurve per koelcel live. Zoom in op elk tijdsvenster van de afgelopen 2 jaar.' },
  { icon: SignalIcon, title: 'Live statusoverzicht', desc: 'In één oogopslag de status van alle koelcellen: OK, Waarschuwing of Alarm. Met kleurcodering.' },
  { icon: MagnifyingGlassIcon, title: 'Alarm-historiek', desc: 'Volledig logboek van alle alarmen: tijdstip, duur, escalatieniveau en wie reageerde.' },
  { icon: DocumentCheckIcon, title: 'HACCP-rapporten', desc: 'Genereer automatisch temperatuurrapportages voor voedselveiligheidsaudits. Exporteer als PDF of CSV.' },
  { icon: UserGroupIcon, title: 'Gebruikersbeheer', desc: 'Voeg medewerkers, managers en technici toe met verschillende toegangsrechten.' },
  { icon: CloudArrowUpIcon, title: 'Cloudopslag', desc: 'Al uw data wordt veilig opgeslagen in de cloud. Geen lokale server nodig.' },
];

const escalationLayers = [
  {
    layer: 'Laag 1 – Direct alarm',
    color: 'border-green-400 bg-green-50 dark:bg-green-900/10',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    trigger: 'Onmiddellijk bij overschrijding drempelwaarde',
    actions: [
      'E-mail naar alle geconfigureerde contacten',
      'Push-notificatie via webbrowser',
      'Alarm zichtbaar in dashboard',
    ],
    config: 'Drempelwaarden per koelcel instelbaar. Separate alarm voor hoog/laag en voor deuren.',
  },
  {
    layer: 'Laag 2 – Escalatie',
    color: 'border-orange-400 bg-orange-50 dark:bg-orange-900/10',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    trigger: 'Geen reactie na X minuten (configureerbaar)',
    actions: [
      'SMS naar primaire contacten',
      'SMS naar backup contacten',
      'Technicus automatisch verwittigd',
    ],
    config: 'Reactietijdvenster en backup contacten volledig configureerbaar per locatie.',
  },
  {
    layer: 'Laag 3 – AI-telefoon',
    color: 'border-red-400 bg-red-50 dark:bg-red-900/10',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    trigger: 'Na verdere non-respons op laag 2',
    actions: [
      'AI-telefoonoproep naar primaire contacten',
      'AI-oproep naar backup contacten',
      'Technicus wordt gedispatcht',
    ],
    config: 'AI-stem meldt koelcel, temperatuur en alarmduur. Wacht op bevestiging van de gebelde persoon.',
  },
];

const complianceItems = [
  { icon: ShieldCheckIcon, title: 'HACCP', desc: 'Automatische temperatuurregistratie voldoet aan HACCP-vereisten. Exporteerbaar auditlogboek per locatie en periode.' },
  { icon: DocumentCheckIcon, title: 'GDP / GMP (farmaceutisch)', desc: 'Gecertificeerde datalogging met tijdstempel voor farmaceutische distributie en bewaring.' },
  { icon: ClockIcon, title: '2 jaar dataretentie', desc: 'Alle temperatuurmetingen worden minimaal 2 jaar bewaard voor traceerbaarheid en audits.' },
  { icon: CpuChipIcon, title: 'Gesensorde alertketen', desc: 'Volledige audit trail: welk alarm, wanneer, wie verwittigd, wie reageerde en hoelang.' },
];

const Product: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="mb-14">
        <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-gray-900 dark:text-frost-100 mb-4">
          Wat is IntelliFrost?
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          IntelliFrost is een end-to-end bewakingsplatform voor koel- en vriescellen. Het combineert
          IoT-sensoren, een krachtige cloud-backend en een slimme escalatie-engine in één gebruiksvriendelijk product.
        </p>
      </div>

      {/* Quick value props */}
      <div className="grid sm:grid-cols-3 gap-4 mb-14">
        {[
          { icon: WifiIcon, text: 'Draadloze sensoren, eenvoudig te installeren' },
          { icon: BellAlertIcon, text: '3-laagse escalatie – tot AI-telefoon' },
          { icon: ShieldCheckIcon, text: 'HACCP & GDP compliant' },
        ].map((vp) => (
          <div key={vp.text} className="flex items-center gap-3 p-4 rounded-xl bg-[#00c8ff]/8 border border-[#00c8ff]/20">
            <vp.icon className="h-5 w-5 text-[#00c8ff] flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{vp.text}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-10">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 w-fit">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === i
                  ? 'bg-white dark:bg-frost-800 text-[#00c8ff] shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
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
            IoT-sensoren & hardware
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            De IntelliFrost-sensor meet zowel temperatuur als deurstatus en stuurt data continu naar het cloudplatform.
            Installatie duurt minder dan 5 minuten per cel. Geen bekabeling, geen speciale gereedschappen.
          </p>

          {/* Hardware foto + specs naast elkaar */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="relative rounded-2xl overflow-hidden h-64 lg:h-auto shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
                alt="IoT sensor hardware"
                className="w-full h-full object-cover"
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
                <strong>Meerdere connectiviteitsopties:</strong> De sensoren ondersteunen WiFi 2.4GHz voor vaste installaties
                en 4G LTE voor locaties zonder WiFi-dekking. Data wordt versleuteld verstuurd (TLS 1.3).
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="mb-14">
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-3">
            Dashboard & rapportage
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
            Het webdashboard geeft u op elk moment een volledig overzicht van al uw locaties en koelcellen.
            Alle data is live en historisch raadpleegbaar – van elk toestel, altijd.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {dashboardFeatures.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
                <div className="w-10 h-10 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-5 w-5 text-[#00c8ff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-frost-100 mb-1 text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="mb-14">
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-3">
            Escalatie in 3 lagen
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
            Het escalatiesysteem is volledig configureerbaar en zorgt ervoor dat alarmen altijd de juiste persoon bereiken –
            ook midden in de nacht of in het weekend.
          </p>
          <div className="space-y-5">
            {escalationLayers.map((layer) => (
              <div key={layer.layer} className={`p-6 rounded-2xl border-2 ${layer.color}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${layer.badge}`}>
                    {layer.layer}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-500">{layer.trigger}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-2">Acties</div>
                    <ul className="space-y-1.5">
                      {layer.actions.map((a) => (
                        <li key={a} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                          <CheckCircleIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-2">Configuratie</div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{layer.config}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="mb-14">
          <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-3">
            Compliance & wetgeving
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
            IntelliFrost helpt u voldoen aan voedselveiligheids- en farmaceutische regelgeving.
            Auditklare rapporten zijn met één klik beschikbaar.
          </p>
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {complianceItems.map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
                <div className="w-10 h-10 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-[#00c8ff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-frost-100 mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-xl bg-[#00c8ff]/8 border border-[#00c8ff]/20">
            <p className="text-sm text-gray-700 dark:text-slate-300">
              <strong>Tip:</strong> Bij een voedselinspectie kunt u direct een rapport downloaden met alle
              temperatuurmetingen van de geselecteerde periode. Geen handmatige registratie meer nodig.
            </p>
          </div>
        </div>
      )}

      {/* Voor wie */}
      <section className="mb-14">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-4">
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
            <div key={sector} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 text-sm text-gray-700 dark:text-slate-300">
              <CheckCircleIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0" />
              {sector}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center p-10 rounded-3xl bg-gradient-to-br from-[#00c8ff]/15 to-transparent border border-[#00c8ff]/20">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-3">
          Overtuigd? Vraag een demo aan.
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mb-6">
          Onze experts tonen u het platform en bespreken de beste configuratie voor uw situatie.
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
