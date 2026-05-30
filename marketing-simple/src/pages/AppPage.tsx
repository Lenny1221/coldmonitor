import {
  BellAlertIcon,
  ChartBarIcon,
  CheckCircleIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import Photo from '../components/Photo';
import AppStoreBadge from '../components/AppStoreBadge';
import { CtaBand } from '../components/ui';

const features = [
  { icon: BellAlertIcon, title: 'Push bij alarm', desc: 'Een melding op uw scherm zodra temperatuur, deur of stroom afwijkt — dag en nacht.' },
  { icon: ChartBarIcon, title: 'Live temperatuur', desc: 'De actuele temperatuur en grafiek van elke koelcel, altijd bij de hand.' },
  { icon: CheckCircleIcon, title: 'Bevestig met één tik', desc: 'Een alarm gezien? Bevestig direct in de app dat u het opvolgt.' },
  { icon: BoltIcon, title: 'Preventieve seintjes', desc: 'Dankzij het zelflerende systeem krijgt u afwijkend gedrag vroeg te zien.' },
  { icon: DevicePhoneMobileIcon, title: 'Overal toegang', desc: 'Thuis, op de baan of op vakantie — uw koelcellen reizen mee.' },
  { icon: LockClosedIcon, title: 'Veilig inloggen', desc: 'Beveiligde toegang met optionele tweestapsverificatie.' },
];

export default function AppPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white px-5 pt-16 pb-20 overflow-hidden">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-brand/20 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
              Beschikbaar in de App Store
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
              De IntelliFrost-app
              <br />
              <span className="text-brand">voor de eindklant</span>
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-md">
              Al uw koelcellen in uw broekzak. Een verzorgde, overzichtelijke app waarmee u alarmen meteen binnenkrijgt
              en met één tik opvolgt — waar u ook bent.
            </p>
            <AppStoreBadge href="#" />
          </div>
          <div className="flex justify-center">
            <Photo
              src="app-smartphone.png"
              alt="IntelliFrost-app geopend op een smartphone"
              placeholder="Foto: smartphone met de IntelliFrost-app open"
              ratio="tall"
              className="max-w-[300px] shadow-2xl shadow-black/40 ring-1 ring-white/10"
            />
          </div>
        </div>
      </section>

      {/* Functies */}
      <section className="px-5 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy text-center mb-3">
            Alles wat u nodig heeft, in één app
          </h2>
          <p className="text-gray-500 text-center mb-10 text-sm max-w-xl mx-auto">
            Gebouwd voor wie geen tijd heeft om constant het dashboard in de gaten te houden. De app doet dat voor u.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-brand/15 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-semibold text-navy text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Photo
              src="app-screen-overzicht.png"
              alt="App-scherm: overzicht van koelcellen"
              placeholder="App-screen: overzicht koelcellen"
              ratio="tall"
              className="shadow-lg ring-1 ring-black/5"
            />
            <Photo
              src="app-screen-grafiek.png"
              alt="App-scherm: temperatuurgrafiek"
              placeholder="App-screen: temperatuurgrafiek"
              ratio="tall"
              className="shadow-lg ring-1 ring-black/5"
            />
            <Photo
              src="app-screen-alarm.png"
              alt="App-scherm: alarmmelding"
              placeholder="App-screen: alarmmelding"
              ratio="tall"
              className="shadow-lg ring-1 ring-black/5"
            />
          </div>
        </div>
      </section>

      {/* Download band */}
      <section className="px-5 py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-navy mb-3">Download de app</h2>
          <p className="text-gray-600 text-sm mb-6">
            Gratis voor elke actieve IntelliFrost-klant. Log in met uw bestaande account.
          </p>
          <div className="flex justify-center">
            <AppStoreBadge href="#" />
          </div>
        </div>
      </section>

      <CtaBand
        title="Nog geen IntelliFrost?"
        text="Vraag een gratis demo aan — dan krijgt u meteen toegang tot het dashboard én de app."
        secondaryTo="/prijzen"
        secondaryLabel="Bekijk de prijzen"
      />
    </>
  );
}
