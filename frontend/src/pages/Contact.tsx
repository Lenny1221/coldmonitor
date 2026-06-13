import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { contactApi, getErrorMessage } from '../services/api';
import { useCookieConsent } from '../hooks/useCookieConsent';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components/marketing/ui';
import Photo from '../components/marketing/Photo';

type ContactType = 'vraag' | 'offerte' | 'demo' | 'technicus' | 'support';

const contactTypes: { id: ContactType; label: string }[] = [
  { id: 'demo', label: 'Demo aanvragen' },
  { id: 'offerte', label: 'Offerte' },
  { id: 'vraag', label: 'Algemene vraag' },
  { id: 'technicus', label: 'Technicus-partnerschap' },
  { id: 'support', label: 'Support' },
];

const sectors = [
  'Slagerij / beenhouwerij',
  'IJsbereider / ijssalon',
  'Restaurant / horeca / catering',
  'Retail / supermarkt',
  'Groothandel / distributie',
  'Farmaceutisch',
  'Logistiek / transport',
  'Ziekenhuis / apotheek',
  'Koeltechnicus / installateur',
  'Andere',
];

const Contact: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ContactType>('demo');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    sector: '',
    locations: '',
    coldrooms: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { trackLead } = useCookieConsent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await contactApi.submit({
        type: selectedType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        sector: formData.sector || undefined,
        locations: formData.locations || undefined,
        coldrooms: formData.coldrooms || undefined,
        message: formData.message,
      });
      setSubmitted(true);
      trackLead({ form: 'contact', category: selectedType });
    } catch (err) {
      setError(getErrorMessage(err, 'Er ging iets mis. Probeer het later opnieuw of mail direct naar info@intellifrost.be.'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-5 text-center py-28">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy mb-3">Bedankt voor uw bericht!</h2>
        <p className="text-gray-600 mb-8">
          Uw aanvraag is doorgestuurd. We nemen zo snel mogelijk contact met u op — normaal binnen 1 werkdag.
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
      <Helmet>
        <title>Contact – IntelliFrost | Demo aanvragen of offerte opvragen</title>
        <meta name="description" content="Neem contact op met IntelliFrost voor een demo, offerte of technische vragen over koelcelmonitoring. Antwoord binnen 1 werkdag." />
        <meta name="keywords" content="IntelliFrost contact, demo koelcelmonitoring, offerte temperatuurmonitoring, koelcel bewaking aanvragen" />
        <link rel="canonical" href="https://intellifrost.be/contact" />
        <meta property="og:title" content="Contact – IntelliFrost" />
        <meta property="og:description" content="Vraag een demo of offerte aan voor koelcelmonitoring. Ons team antwoordt binnen 1 werkdag." />
        <meta property="og:url" content="https://intellifrost.be/contact" />
      </Helmet>

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
              <div className="mt-4 p-4 rounded-xl bg-brand/10 border border-brand/20">
                <p className="text-xs text-gray-600">
                  <strong>Technische support</strong> voor actieve abonnees is beschikbaar via het platform, ook buiten kantooruren.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Waarvoor neemt u contact op?</label>
              <div className="flex flex-wrap gap-2">
                {contactTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedType === t.id ? 'border-brand bg-brand/10 text-brand' : 'border-gray-200 text-gray-600 hover:border-brand/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Naam <span className="text-red-400">*</span></label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Uw voor- en achternaam"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail <span className="text-red-400">*</span></label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="naam@bedrijf.be"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefoon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+32 470 12 34 56"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrijf</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Uw bedrijfsnaam"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sector</label>
                <select
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm bg-white text-gray-900"
                >
                  <option value="">Selecteer uw sector...</option>
                  {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {(selectedType === 'offerte' || selectedType === 'demo') && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Aantal locaties</label>
                    <select
                      value={formData.locations}
                      onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm bg-white text-gray-900"
                    >
                      <option value="">Selecteer...</option>
                      <option>1 locatie</option>
                      <option>2-5 locaties</option>
                      <option>6-20 locaties</option>
                      <option>Meer dan 20 locaties</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Aantal koelcellen</label>
                    <select
                      value={formData.coldrooms}
                      onChange={(e) => setFormData({ ...formData, coldrooms: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand text-sm bg-white text-gray-900"
                    >
                      <option value="">Selecteer...</option>
                      <option>1-5 koelcellen</option>
                      <option>6-20 koelcellen</option>
                      <option>21-50 koelcellen</option>
                      <option>Meer dan 50 koelcellen</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Uw bericht <span className="text-red-400">*</span></label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Vertel ons over uw situatie: hoeveel koelcellen, welke sector, en uw grootste uitdaging?"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm resize-none"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-navy bg-brand hover:bg-brand-dark disabled:opacity-70 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? 'Bezig met versturen...' : 'Versturen'}
              </button>
              <p className="text-xs text-gray-400 text-center">We antwoorden normaal binnen 1 werkdag.</p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
