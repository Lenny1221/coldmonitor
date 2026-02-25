import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const categories = [
  {
    title: 'Algemeen',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    faqs: [
      {
        q: 'Wat is IntelliFrost?',
        a: 'IntelliFrost is een cloudplatform voor het monitoren van koel- en vriescellen. Via IoT-sensoren meet u temperatuur en deurstatus in realtime, met automatische escalatie bij alarmen – van e-mail tot AI-telefoonoproep.',
      },
      {
        q: 'Voor wie is IntelliFrost bedoeld?',
        a: 'IntelliFrost is geschikt voor elke sector waar temperatuurgevoelige producten worden bewaard: supermarkten, slagerijen, restaurants, farmaceutische bedrijven, logistiek, ziekenhuizen, apotheken, koeltechnici en meer.',
      },
      {
        q: 'In welke landen is IntelliFrost beschikbaar?',
        a: 'IntelliFrost is momenteel beschikbaar in België en Nederland. Uitbreiding naar andere Europese landen is gepland. Neem contact op voor meer informatie.',
      },
      {
        q: 'Is IntelliFrost een cloud- of lokale oplossing?',
        a: 'IntelliFrost is primair een cloudoplossing. Data wordt veilig opgeslagen in de cloud. Voor Enterprise-klanten is een on-premise optie beschikbaar op aanvraag.',
      },
      {
        q: 'Hoe betrouwbaar is het systeem?',
        a: 'IntelliFrost heeft een uptime-garantie van 99,9%. Het systeem is gebouwd op schaalbare cloudinfrastructuur met redundantie. Alarmberichten worden verzonden zodra een afwijking gedetecteerd wordt, onafhankelijk van de internetverbinding van de sensor (via 4G backup).',
      },
    ],
  },
  {
    title: 'Hardware & sensoren',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    faqs: [
      {
        q: 'Welke hardware is nodig?',
        a: 'U heeft IoT-loggers nodig die temperatuur en deurstatus meten. Deze zijn verkrijgbaar via IntelliFrost. De sensoren communiceren draadloos via WiFi of 4G met het platform. Geen bekabeling vereist.',
      },
      {
        q: 'Hoe worden de sensoren geïnstalleerd?',
        a: 'Installatie duurt minder dan 5 minuten per sensor. Bevestig de sensor in of nabij de koelcel met de bijgeleverde montageclip of zelfklevende beugel. Koppel het toestel via het dashboard door het serienummer in te voeren.',
      },
      {
        q: 'Wat is de batterijduur van de sensoren?',
        a: 'Afhankelijk van het meetinterval is de batterijduur tot 2 jaar. Bij een meetinterval van 5 minuten is dit typisch 1,5 tot 2 jaar. U ontvangt een melding wanneer de batterij bijna leeg is.',
      },
      {
        q: 'Werken de sensoren zonder WiFi?',
        a: 'Ja. Sensoren met 4G LTE-module werken ook op locaties zonder WiFi, zoals magazijnen of externe depots. De 4G-variant heeft een SIM-kaart die in het abonnement is inbegrepen.',
      },
      {
        q: 'Wat is de meetnauwkeurigheid?',
        a: 'De sensoren meten temperatuur tot op ± 0,1°C nauwkeurig, over een bereik van -40°C tot +85°C. De meetfrequentie is configureerbaar van 1 tot 60 minuten.',
      },
      {
        q: 'Kan ik bestaande sensoren van een ander merk gebruiken?',
        a: 'Momenteel ondersteunt het platform enkel sensoren die gecertificeerd zijn voor IntelliFrost. Integratie met bestaande systemen is mogelijk via de API (Enterprise-plan). Neem contact op voor een compatibility-check.',
      },
      {
        q: 'Zijn de sensoren bestand tegen water en stof?',
        a: 'Ja. De sensoren hebben een IP67-classificatie, wat betekent dat ze beschermd zijn tegen stof en kortdurende onderdompeling in water. Ze zijn dus ideaal voor gebruik in koelcellen met condensvorming of natte omgevingen.',
      },
    ],
  },
  {
    title: 'Alarmen & escalatie',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    faqs: [
      {
        q: 'Hoe werkt de escalatie?',
        a: 'Bij een alarm start Laag 1: e-mail en push-notificatie naar alle geconfigureerde contacten. Als niemand reageert binnen het ingestelde tijdvenster, volgt Laag 2: SMS naar primaire en backup contacten, technicus verwittigd. Bij verdere non-respons volgt Laag 3: AI-telefoonoproep naar alle contacten en technicus dispatched.',
      },
      {
        q: 'Wat is een AI-telefoonoproep?',
        a: 'Een AI-telefoonsysteem belt automatisch naar het geconfigureerde telefoonnummer en spreekt een bericht in: de naam van de koelcel, de temperatuur, de duur van het alarm en wat er verwacht wordt. De gebelde persoon kan via een toetsdruk bevestigen dat hij het alarm behandelt.',
      },
      {
        q: 'Kan ik de reactietijden zelf configureren?',
        a: 'Ja. U kunt per alarmlaag instellen hoelang het systeem wacht voor het escaleert. Bijvoorbeeld: na 5 minuten van Laag 1 naar Laag 2, na nog eens 10 minuten naar Laag 3. Dit is per locatie en tijdslot configureerbaar.',
      },
      {
        q: 'Hoe stel ik openingstijden in?',
        a: 'Via "Instellingen" > "Openingstijden" stelt u per locatie de uren in waarop het bedrijf open is. Buiten deze uren worden alarmen direct geëscaleerd of gaan naar een andere contactpersonenlijst (bv. bewakingsdienst).',
      },
      {
        q: 'Wat als ik een alarm niet wil ontvangen tijdens een geplande onderhoudsperiode?',
        a: 'U kunt per koelcel een "onderhoudsvenster" instellen. Tijdens dit venster worden geen alarmen gestuurd. Dit is handig bij gepland onderhoud, ontdooicyclussen of tijdelijk verhoogde temperaturen.',
      },
      {
        q: 'Hoeveel backup contacten kan ik toevoegen?',
        a: 'U kunt onbeperkt contacten toevoegen per escalatielaag. Ze worden op volgorde verwittigd of tegelijkertijd, afhankelijk van uw configuratie.',
      },
    ],
  },
  {
    title: 'Dashboard & rapportage',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    faqs: [
      {
        q: 'Kan ik het dashboard op mijn smartphone gebruiken?',
        a: 'Ja. Het platform is volledig responsive en werkt op smartphone, tablet en desktop. Er zijn ook push-notificaties beschikbaar via de webbrowser.',
      },
      {
        q: 'Hoe lang wordt mijn data bewaard?',
        a: 'Afhankelijk van uw plan wordt data 6 maanden (Starter) of 2 jaar (Professional en Enterprise) bewaard. Extended dataretentie tot 5 jaar is beschikbaar als add-on.',
      },
      {
        q: 'Kan ik rapporten genereren voor de FAVV of een audit?',
        a: 'Ja. Via "Rapporten" genereert u een HACCP-compliant temperatuurrapport voor elke locatie en periode. Het rapport wordt gegenereerd als PDF met alle metingen, alarmen en escalaties.',
      },
      {
        q: 'Kan ik data exporteren naar Excel?',
        a: 'Ja (Professional en Enterprise). U kunt temperatuurdata exporteren als CSV, compatibel met Excel en andere tools. U kiest de periode, koelcel en het gewenste format.',
      },
      {
        q: 'Kan ik meerdere gebruikers toegang geven tot het dashboard?',
        a: 'Ja (Professional en Enterprise). U kunt meerdere gebruikers toevoegen met verschillende rollen: beheerder, operator, viewer of technicus. Elke rol heeft zijn eigen toegangsrechten.',
      },
    ],
  },
  {
    title: 'Technicus & koppeling',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
    faqs: [
      {
        q: 'Hoe koppel ik een technicus?',
        a: 'Een technicus kan u uitnodigen via het platform. U ontvangt een e-mail met een uitnodigingslink. Na acceptatie heeft de technicus inzage in uw alarmen en kan hij proactief ingrijpen.',
      },
      {
        q: 'Kan ik de technicus-toegang weer intrekken?',
        a: 'Ja. Via "Instellingen" > "Technici" kunt u op elk moment de koppeling met een technicus verwijderen. De toegang wordt onmiddellijk ingetrokken.',
      },
      {
        q: 'Wat ziet de technicus precies?',
        a: 'De technicus ziet de alarmen en statusoverzichten van de gelinkte klanten. Hij heeft geen toegang tot accountgegevens, facturen of persoonlijke data van de klant.',
      },
      {
        q: 'Als technicus: kan ik meerdere klanten beheren?',
        a: 'Ja. Via het technicusportal beheert u alle klanten in één overzicht. U stuurt uitnodigingen, bekijkt alarmen per klant en kunt instellingen aanpassen als de klant u daarvoor toestemming geeft.',
      },
    ],
  },
  {
    title: 'Abonnement & facturatie',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
    faqs: [
      {
        q: 'Hoe werkt de facturatie?',
        a: 'Facturatie verloopt maandelijks of jaarlijks via automatische incasso of bankoverschrijving. Bij jaarlijkse facturatie is een korting van toepassing.',
      },
      {
        q: 'Kan ik op elk moment stoppen?',
        a: 'Ja. Bij maandelijkse facturatie kunt u maandelijks opzeggen. Bij jaarlijkse facturatie loopt het contract af op de einddatum. Neem contact op voor de opzegprocedure.',
      },
      {
        q: 'Zijn de sensoren inbegrepen in het abonnement?',
        a: 'Nee. De sensoren zijn een eenmalige hardware-aankoop. Het abonnement dekt de cloudoplossing, alarmverwerking, escaltie en support.',
      },
      {
        q: 'Wat als ik meer koelcellen bijkoop?',
        a: 'Bij het Starter-plan geldt een maximum. Upgrade naar Professional voor onbeperkt aantal koelcellen. Extra koelcellen kunnen ook worden toegevoegd aan het Starter-plan tegen bijprijs – neem contact op voor de tarieven.',
      },
    ],
  },
];

const FAQ: React.FC = () => {
  const [activeCat, setActiveCat] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Header */}
      <div className="mb-14">
        <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-gray-900 dark:text-frost-100 mb-4">
          Veelgestelde vragen
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Antwoorden op de meest gestelde vragen over IntelliFrost. Staat uw vraag er niet bij?
          Neem dan contact met ons op.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((cat, i) => (
          <button
            key={cat.title}
            onClick={() => { setActiveCat(i); setOpenIndex(0); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCat === i
                ? 'bg-[#00c8ff] text-white shadow-md shadow-[#00c8ff]/20'
                : 'bg-gray-100 dark:bg-frost-900 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-frost-800 border border-gray-200 dark:border-frost-800'
            }`}
          >
            {cat.title}
            <span className={`ml-2 text-xs ${activeCat === i ? 'text-white/70' : 'text-gray-400 dark:text-slate-600'}`}>
              {categories[i].faqs.length}
            </span>
          </button>
        ))}
      </div>

      {/* Active category header */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categories[activeCat].color}`}>
          {categories[activeCat].title}
        </span>
        <span className="text-sm text-gray-400 dark:text-slate-500">
          {categories[activeCat].faqs.length} vragen
        </span>
      </div>

      {/* FAQs */}
      <div className="space-y-2 mb-14">
        {categories[activeCat].faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-2xl bg-gray-50 dark:bg-frost-900 border border-gray-200 dark:border-frost-800 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-start justify-between p-6 text-left hover:bg-gray-100/50 dark:hover:bg-frost-800/50 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-frost-100 pr-4 leading-snug">{faq.q}</span>
              {openIndex === i ? (
                <ChevronUpIcon className="h-5 w-5 text-[#00c8ff] flex-shrink-0 mt-0.5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
            </button>
            {openIndex === i && (
              <div className="px-6 pb-6 text-gray-600 dark:text-slate-400 leading-relaxed border-t border-gray-200 dark:border-frost-800 pt-4">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Geen antwoord gevonden */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#00c8ff]/10 to-transparent border border-[#00c8ff]/20 text-center">
        <h2 className="font-['Exo_2'] text-xl font-semibold text-gray-900 dark:text-frost-100 mb-3">
          Staat uw vraag er niet bij?
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Ons team helpt u graag verder. Stuur een bericht of plan een vrijblijvende demo in.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors"
          >
            Stel uw vraag
          </Link>
          <Link
            to="/handleidingen"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
          >
            Bekijk de handleidingen
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
