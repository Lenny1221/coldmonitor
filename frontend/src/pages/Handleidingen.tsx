import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayCircleIcon,
  WrenchScrewdriverIcon,
  BellAlertIcon,
  ChartBarIcon,
  CubeIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const categories = [
  {
    id: 'start',
    icon: PlayCircleIcon,
    title: 'Aan de slag',
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
    guides: [
      {
        title: 'Eerste inlog en dashboard-overzicht',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Ga naar het platform via de link in uw welkomst-e-mail.',
          'Voer uw e-mailadres en wachtwoord in. Klik op "Inloggen".',
          'Stel bij eerste inlog een nieuw wachtwoord in via de wizard.',
          'Het dashboard toont een overzicht van al uw locaties en koelcellen.',
          'Groene cellen zijn OK, oranje zijn in waarschuwing, rood in alarm.',
          'Klik op een koelcel voor de realtime temperatuurgrafiek.',
        ],
      },
      {
        title: 'Account en profiel instellen',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Klik rechtsboven op uw naam of avatar om naar uw profiel te gaan.',
          'Pas uw naam, e-mailadres en telefoonnummer aan.',
          'Stel uw voorkeurstaal in (Nederlands, Frans, Engels).',
          'Activeer tweestapsverificatie via de instellingenpagina voor extra beveiliging.',
          'Sla uw wijzigingen op via de knop onderaan.',
        ],
      },
      {
        title: 'Wachtwoord wijzigen of vergeten',
        time: '3 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Via "Profiel" > "Beveiliging" kunt u uw wachtwoord wijzigen.',
          'Voer uw huidig wachtwoord in, dan het nieuwe (2x).',
          'Bij vergeten wachtwoord: klik op "Wachtwoord vergeten" op de inlogpagina.',
          'Voer uw e-mailadres in. U ontvangt een resetlink.',
          'De resetlink is 24 uur geldig.',
        ],
      },
    ],
  },
  {
    id: 'locaties',
    icon: CubeIcon,
    title: 'Locaties & koelcellen',
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    guides: [
      {
        title: 'Een nieuwe locatie aanmaken',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Ga naar "Locaties" in het zijmenu.',
          'Klik op "Nieuwe locatie toevoegen".',
          'Vul de naam, het adres en het type locatie in (winkel, depot, enz.).',
          'Sla de locatie op. Ze verschijnt nu in uw dashboard.',
          'U kunt meerdere locaties aanmaken – er is geen limiet (afhankelijk van plan).',
        ],
      },
      {
        title: 'Een koelcel configureren',
        time: '10 min.',
        difficulty: 'Gemiddeld',
        steps: [
          'Navigeer naar een locatie en klik op "Koelcel toevoegen".',
          'Geef de koelcel een naam (bv. "Vleeskoeling 1") en kies het type (koel- of vriescel).',
          'Vul het serienummer van de sensor in om hem te koppelen.',
          'Stel de minimum- en maximumtemperatuur in. Buiten dit bereik wordt een alarm geactiveerd.',
          'Configureer de deur-alarmvertraging: hoelang mag de deur open staan voor een alarm?',
          'Sla op. De sensor is nu actief en begint te meten.',
        ],
      },
      {
        title: 'Drempelwaarden aanpassen',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Open een koelcel en klik op "Instellingen".',
          'Pas de minimumtemperatuur aan (bv. -25°C voor vriescel).',
          'Pas de maximumtemperatuur aan (bv. -15°C voor vriescel).',
          'Stel eventueel een waarschuwingszone in: alarm bij bv. -18°C, waarschuwing bij -20°C.',
          'Sla op. De nieuwe drempelwaarden zijn onmiddellijk van kracht.',
        ],
      },
      {
        title: 'Een sensor koppelen of vervangen',
        time: '10 min.',
        difficulty: 'Gemiddeld',
        steps: [
          'Bevestig de nieuwe sensor in of nabij de koelcel (gebruik de bijgeleverde montageclip).',
          'Zorg dat de sensor WiFi-verbinding heeft of schakel de 4G-module in.',
          'Ga naar de koelcelinstellingen en klik op "Sensor wijzigen".',
          'Voer het serienummer van de nieuwe sensor in.',
          'Wacht 2-3 minuten tot de eerste meting binnenkomt. Controleer de grafiek.',
        ],
      },
    ],
  },
  {
    id: 'alarmen',
    icon: BellAlertIcon,
    title: 'Alarmen & escalatie',
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    guides: [
      {
        title: 'Escalatiecontacten configureren',
        time: '10 min.',
        difficulty: 'Gemiddeld',
        steps: [
          'Ga naar "Instellingen" > "Alarmen".',
          'Voeg primaire contactpersonen toe voor Laag 1 (e-mail + push).',
          'Voeg SMS-contacten toe voor Laag 2. Dit kunnen andere personen zijn.',
          'Voeg backup contacten toe die gebeld worden bij Laag 3.',
          'Stel de reactietijden in: hoelang wachten voor naar de volgende laag te gaan.',
          'Sla op en test via de testknop onderaan.',
        ],
      },
      {
        title: 'Openingstijden en nachtmodus instellen',
        time: '10 min.',
        difficulty: 'Gemiddeld',
        steps: [
          'Ga naar "Instellingen" > "Openingstijden".',
          'Stel per dag de openings- en sluitingstijden in.',
          'Activeer "nachtmodus": buiten openingsuren worden alarmen anders afgehandeld.',
          'Configureer wie buiten openingsuren verwittigd wordt (bv. bewakingsdienst of manager).',
          'Sla op. Het systeem past de escalatie automatisch aan op basis van de klok.',
        ],
      },
      {
        title: 'Een alarm bevestigen of sluiten',
        time: '3 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Open het dashboard. Actieve alarmen worden bovenaan in rood getoond.',
          'Klik op het alarm voor details: koelcel, tijdstip, temperatuur, escalatieniveau.',
          'Klik op "Bevestigen" om aan te geven dat u het alarm heeft gezien.',
          'Na correctie van het probleem klikt u op "Sluiten" en voegt een notitie toe.',
          'Het alarm verdwijnt uit de actieve lijst en wordt opgeslagen in de historiek.',
        ],
      },
      {
        title: 'Alarm-historiek raadplegen',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Ga naar "Historiek" in het zijmenu.',
          'Filter op locatie, koelcel, datumrange of alarmtype.',
          'Elke alarmrij toont: tijdstip, duur, escalatieniveau en wie reageerde.',
          'Klik op een alarm voor de volledige tijdlijn en bijgevoegde notities.',
          'Exporteer de historiek als CSV via de exportknop.',
        ],
      },
    ],
  },
  {
    id: 'rapporten',
    icon: ChartBarIcon,
    title: 'Rapporten & data',
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    guides: [
      {
        title: 'HACCP-rapport genereren',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Ga naar "Rapporten" in het zijmenu.',
          'Selecteer de locatie en koelcel(len) waarvoor u een rapport wilt.',
          'Kies de periode (bv. afgelopen maand of een specifieke datumrange).',
          'Klik op "Genereer rapport". Het systeem maakt een PDF met alle metingen en alarmen.',
          'Download het rapport. Het is klaar voor HACCP-audits en inspecties.',
        ],
      },
      {
        title: 'Temperatuurdata exporteren (CSV)',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Ga naar "Rapporten" > "Export".',
          'Selecteer koelcel en periode.',
          'Kies het formaat: CSV of Excel-compatibel.',
          'Klik op "Exporteer". Het bestand bevat alle meetpunten met tijdstempel.',
          'Importeer in Excel of uw eigen systeem voor verdere verwerking.',
        ],
      },
      {
        title: 'Live temperatuurgrafieken lezen',
        time: '3 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Klik op een koelcel in het dashboard.',
          'De grafiek toont de temperatuur over de geselecteerde periode (standaard: 24u).',
          'Gebruik de tijdsselectie om in te zoomen: 1u, 6u, 24u, 7 dagen, 30 dagen.',
          'Groene zones zijn normaal. Rode zones zijn periodes in alarm.',
          'Hover over de grafiek voor precieze temperatuur op elk tijdstip.',
        ],
      },
    ],
  },
  {
    id: 'technicus',
    icon: WrenchScrewdriverIcon,
    title: 'Technicus & koppeling',
    color: 'text-slate-500',
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    guides: [
      {
        title: 'Een technicus uitnodigingslink accepteren',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'U ontvangt een e-mail van uw technicus met een uitnodigingslink.',
          'Klik op de link. U wordt doorgestuurd naar het platform.',
          'Log in of maak een account aan als u nog geen account heeft.',
          'U ziet de uitnodiging: naam van de technicus en het bedrijf.',
          'Klik op "Accepteren" om de koppeling te bevestigen.',
          'De technicus heeft nu toegang tot uw alarmen. U kunt dit op elk moment intrekken.',
        ],
      },
      {
        title: 'Technicustoegang beheren',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Ga naar "Instellingen" > "Technici".',
          'U ziet een overzicht van alle gekoppelde technici.',
          'Klik op een technicus om de toegangsrechten te bekijken.',
          'Klik op "Koppeling verwijderen" om de toegang in te trekken.',
          'De technicus ontvangt hiervan een notificatie.',
        ],
      },
      {
        title: 'Als technicus: klanten beheren',
        time: '10 min.',
        difficulty: 'Gemiddeld',
        steps: [
          'Log in op het platform als technicus.',
          'Ga naar "Mijn klanten" in het technicusmenu.',
          'Klik op "Klant uitnodigen" en voer het e-mailadres van de klant in.',
          'De klant ontvangt een uitnodigingslink per e-mail.',
          'Na acceptatie verschijnt de klant in uw overzicht met zijn alarmen.',
          'Klik op een klant om zijn dashboard en alarmen te bekijken.',
        ],
      },
    ],
  },
  {
    id: 'compliance',
    icon: ShieldCheckIcon,
    title: 'Compliance & beveiliging',
    color: 'text-teal-500',
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    guides: [
      {
        title: 'Tweestapsverificatie inschakelen',
        time: '5 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Ga naar "Profiel" > "Beveiliging".',
          'Klik op "Tweestapsverificatie inschakelen".',
          'Scan de QR-code met uw authenticator-app (Google Authenticator, Authy, enz.).',
          'Voer de 6-cijferige code in om te bevestigen.',
          'Sla de herstelcodes op op een veilige plek.',
        ],
      },
      {
        title: 'Auditlog bekijken',
        time: '3 min.',
        difficulty: 'Gemakkelijk',
        steps: [
          'Ga naar "Instellingen" > "Auditlog".',
          'Het log toont alle acties: inlogpogingen, alarmbevestigingen, configuratiewijzigingen.',
          'Filter op gebruiker, actie of datum.',
          'Exporteer het log als CSV voor compliance-rapportage.',
        ],
      },
    ],
  },
];

const Handleidingen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [openGuide, setOpenGuide] = useState<number | null>(0);

  const cat = categories[activeCategory];

  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="mb-14">
        <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-gray-900 dark:text-frost-100 mb-4">
          Handleidingen
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Stapsgewijze handleidingen voor alle functies van IntelliFrost. Van eerste inlog tot geavanceerde
          configuratie – hier vindt u alles.
        </p>
      </div>

      {/* Category selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-12">
        {categories.map((c, i) => (
          <button
            key={c.id}
            onClick={() => { setActiveCategory(i); setOpenGuide(0); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
              activeCategory === i
                ? 'border-[#00c8ff] bg-[#00c8ff]/10'
                : 'border-gray-200 dark:border-frost-800 bg-gray-50 dark:bg-frost-900 hover:border-[#00c8ff]/40'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <span className={`text-xs font-medium leading-tight ${
              activeCategory === i ? 'text-[#00c8ff]' : 'text-gray-700 dark:text-slate-300'
            }`}>
              {c.title}
            </span>
          </button>
        ))}
      </div>

      {/* Guides */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center`}>
            <cat.icon className={`h-4 w-4 ${cat.color}`} />
          </div>
          <h2 className="font-['Exo_2'] text-xl font-bold text-gray-900 dark:text-frost-100">{cat.title}</h2>
          <span className="text-sm text-gray-400 dark:text-slate-500">{cat.guides.length} handleidingen</span>
        </div>

        <div className="space-y-3">
          {cat.guides.map((guide, i) => (
            <div
              key={guide.title}
              className="rounded-2xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 overflow-hidden"
            >
              <button
                onClick={() => setOpenGuide(openGuide === i ? null : i)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-100/50 dark:hover:bg-frost-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5 text-[#00c8ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-frost-100 text-sm mb-1">{guide.title}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-slate-500">{guide.time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      guide.difficulty === 'Gemakkelijk'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {guide.difficulty}
                    </span>
                  </div>
                </div>
                {openGuide === i ? (
                  <ChevronUpIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {openGuide === i && (
                <div className="px-5 pb-5 border-t border-gray-200 dark:border-frost-800 pt-5">
                  <ol className="space-y-3">
                    {guide.steps.map((step, si) => (
                      <li key={si} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#00c8ff] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {si + 1}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hulp nodig? */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="p-6 rounded-2xl bg-[#00c8ff]/10 border border-[#00c8ff]/30">
          <div className="flex items-center gap-3 mb-3">
            <QuestionMarkCircleIcon className="h-6 w-6 text-[#00c8ff]" />
            <h3 className="font-semibold text-gray-900 dark:text-frost-100">Hulp nodig?</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Staat uw vraag er niet bij? Bekijk de FAQ of neem rechtstreeks contact op.
          </p>
          <div className="flex gap-3">
            <Link to="/faq" className="text-sm text-[#00c8ff] font-medium hover:underline">Naar de FAQ →</Link>
            <Link to="/contact" className="text-sm text-[#00c8ff] font-medium hover:underline">Contact →</Link>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800">
          <div className="flex items-center gap-3 mb-3">
            <ArrowRightOnRectangleIcon className="h-6 w-6 text-[#00c8ff]" />
            <h3 className="font-semibold text-gray-900 dark:text-frost-100">Ingelogd bekijken</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Log in op het platform voor contextgevoelige helpknopjes en video-tutorials bij elke stap.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Inloggen
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Handleidingen;
