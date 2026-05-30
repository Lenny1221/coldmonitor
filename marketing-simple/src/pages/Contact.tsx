import { useState } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components/ui';
import Photo from '../components/Photo';

const types = [
  { id: 'demo', label: 'Demo aanvragen' },
  { id: 'offerte', label: 'Offerte' },
  { id: 'vraag', label: 'Algemene vraag' },
  { id: 'technicus', label: 'Technicus-partnerschap' },
  { id: 'support', label: 'Support' },
];

const sectors = [
  'Slagerij / beenhouwerij',
  'IJsbereider / ijssalon',
  'Restaurant / horeca',
  'Retail / supermarkt',
  'Groothandel / distributie',
  'Farmaceutisch',
  'Logistiek / transport',
  'Ziekenhuis / apotheek',
  'Koeltechnicus / installateur',
  'Andere',
];

export default function Contact() {
  const [type, setType] = useState('demo');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-5 text-center py-24">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy mb-3">Bedankt voor uw bericht!</h2>
        <p className="text-gray-600 mb-8">
          We nemen zo snel mogelijk contact met u op — normaal binnen 1 werkdag.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-3 rounded-xl border-2 border-brand text-brand font-semibold hover:bg-brand/10 transition-colors"
        >
          Nieuw bericht sturen
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Contact"
        title="Vraag een gratis demo aan"
        subtitle="We installeren een testunit, 30 dagen gratis. Geen verplichtingen, geen technische kennis nodig."
      />

      <div className="max-w-5xl mx-auto px-5 pb-16">
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {['Installatie binnen 1 werkdag', '30 dagen gratis testen', 'Geen IT-kennis nodig'].map((t) => (
            <span key={t} className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <CheckCircleIcon className="h-4 w-4 text-brand" /> {t}
            </span>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Info */}
          <div className="space-y-8">
            <Photo
              src="installation.jpg"
              alt="IntelliFrost installatie bij een klant"
              placeholder="Foto: installatie/onboarding bij een klant"
              ratio="video"
              className="shadow-lg ring-1 ring-black/5"
            />
            <div>
              <h2 className="font-semibold text-navy mb-4">Contactgegevens</h2>
              <div className="space-y-4">
                <a href="mailto:info@intellifrost.be" className="flex items-center gap-3 text-gray-600 hover:text-brand">
                  <span className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                    <EnvelopeIcon className="h-4 w-4 text-brand" />
                  </span>
                  <span>
                    <span className="block text-xs text-gray-400">E-mail</span>
                    <span className="text-sm font-medium">info@intellifrost.be</span>
                  </span>
                </a>
                <a href="tel:+32468429719" className="flex items-center gap-3 text-gray-600 hover:text-brand">
                  <span className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                    <PhoneIcon className="h-4 w-4 text-brand" />
                  </span>
                  <span>
                    <span className="block text-xs text-gray-400">Telefoon</span>
                    <span className="text-sm font-medium">+32 468 42 97 19</span>
                  </span>
                </a>
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                    <MapPinIcon className="h-4 w-4 text-brand" />
                  </span>
                  <span>
                    <span className="block text-xs text-gray-400">Regio</span>
                    <span className="text-sm font-medium">België &amp; Nederland</span>
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-navy mb-4">Bereikbaarheid</h2>
              <div className="space-y-3">
                {[
                  { day: 'Ma – vr', hours: '9:00 – 18:00' },
                  { day: 'Zaterdag', hours: '10:00 – 13:00' },
                  { day: 'Zondag', hours: 'Gesloten' },
                ].map((it) => (
                  <div key={it.day} className="flex items-center gap-3 text-sm">
                    <ClockIcon className="h-4 w-4 text-brand shrink-0" />
                    <span className="flex justify-between flex-1">
                      <span className="text-gray-600">{it.day}</span>
                      <span className="font-medium text-navy">{it.hours}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Waarvoor neemt u contact op?</label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        type === t.id ? 'border-brand bg-brand/10 text-brand' : 'border-gray-200 text-gray-600 hover:border-brand/40'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Naam <span className="text-red-400">*</span></label>
                  <input required type="text" placeholder="Uw voor- en achternaam" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail <span className="text-red-400">*</span></label>
                  <input required type="email" placeholder="naam@bedrijf.be" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefoon</label>
                  <input type="tel" placeholder="+32 470 12 34 56" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrijf</label>
                  <input type="text" placeholder="Uw bedrijfsnaam" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sector</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm bg-white">
                  <option value="">Selecteer uw sector...</option>
                  {sectors.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Uw bericht</label>
                <textarea rows={5} placeholder="Vertel ons over uw situatie: hoeveel koelcellen, welke sector, en uw grootste uitdaging?" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm resize-none" />
              </div>

              <button type="submit" className="w-full py-3.5 rounded-xl font-semibold text-navy bg-brand hover:bg-brand-dark transition-colors text-sm">
                Versturen
              </button>
              <p className="text-xs text-gray-400 text-center">We antwoorden normaal binnen 1 werkdag.</p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
