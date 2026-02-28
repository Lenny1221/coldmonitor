import React, { useState } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type ContactType = 'vraag' | 'offerte' | 'demo' | 'technicus' | 'support';

const contactTypes: { id: ContactType; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'demo', label: 'Demo aanvragen', desc: 'Ontdek het platform in een persoonlijke demo', icon: CalendarDaysIcon },
  { id: 'offerte', label: 'Offerte aanvragen', desc: 'Prijsvoorstel op maat voor uw situatie', icon: DocumentTextIcon },
  { id: 'vraag', label: 'Algemene vraag', desc: 'Meer info over functies of het platform', icon: ChatBubbleLeftRightIcon },
  { id: 'technicus', label: 'Technicus-partnerschap', desc: 'Samenwerken als koeltechnicus of installateur', icon: CheckCircleIcon },
  { id: 'support', label: 'Technische support', desc: 'Hulp bij een bestaand account of installatie', icon: PhoneIcon },
];

const sectors = [
  'Retail / supermarkt',
  'Slagerij / bakkerij',
  'Restaurant / catering',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const body = [
      `Type aanvraag: ${contactTypes.find(t => t.id === selectedType)?.label}`,
      `Naam: ${formData.name}`,
      `E-mail: ${formData.email}`,
      `Telefoon: ${formData.phone}`,
      `Bedrijf: ${formData.company}`,
      `Sector: ${formData.sector}`,
      `Aantal locaties: ${formData.locations}`,
      `Aantal koelcellen: ${formData.coldrooms}`,
      ``,
      `Bericht:`,
      formData.message,
    ].join('%0D%0A');

    window.location.href = `mailto:info@intellifrost.be?subject=${encodeURIComponent(contactTypes.find(t => t.id === selectedType)?.label ?? 'Contact via website')}&body=${body}`;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-6 text-center py-20">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="font-['Exo_2'] text-2xl font-bold text-gray-900 dark:text-frost-100 mb-3">
          Bedankt voor uw bericht!
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mb-8">
          Uw aanvraag is doorgestuurd. We nemen zo snel mogelijk contact met u op – normaal gezien binnen 1 werkdag.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-3 rounded-lg font-medium text-[#00c8ff] border-2 border-[#00c8ff] hover:bg-[#00c8ff]/10 transition-colors"
        >
          Nieuw bericht sturen
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Header */}
      <div className="mb-14">
        <h1 className="font-['Exo_2'] text-3xl sm:text-4xl font-bold text-gray-900 dark:text-frost-100 mb-4">
          Neem contact op
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Heeft u vragen, wilt u een demo aanvragen of een offerte ontvangen? Vul het formulier in
          en ons team contacteert u binnen 1 werkdag.
        </p>
      </div>

      {/* Hero-foto boven de content */}
      <div className="relative rounded-3xl overflow-hidden mb-10 h-52 shadow-lg">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=85"
          alt="Kantoor sfeer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#00c8ff]/60 to-[#0D1B2E]/70" />
        <div className="absolute inset-0 flex items-center px-10">
          <div>
            <div className="text-white/80 text-sm mb-1">Antwoord binnen 1 werkdag</div>
            <div className="font-['Exo_2'] text-2xl font-bold text-white">Wij helpen u graag verder</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left: contact info */}
        <div className="space-y-8">
          {/* Contactgegevens */}
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-frost-100 mb-5">Contactgegevens</h2>
            <div className="space-y-4">
              <a
                href="mailto:info@intellifrost.be"
                className="flex items-center gap-3 text-gray-600 dark:text-slate-400 hover:text-[#00c8ff] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <EnvelopeIcon className="h-4 w-4 text-[#00c8ff]" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 dark:text-slate-600">E-mail</div>
                  <div className="text-sm font-medium">info@intellifrost.be</div>
                </div>
              </a>
              <a
                href="tel:+32123456789"
                className="flex items-center gap-3 text-gray-600 dark:text-slate-400 hover:text-[#00c8ff] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <PhoneIcon className="h-4 w-4 text-[#00c8ff]" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 dark:text-slate-600">Telefoon</div>
                  <div className="text-sm font-medium">+32 123 45 67 89</div>
                </div>
              </a>
              <div className="flex items-start gap-3 text-gray-600 dark:text-slate-400">
                <div className="w-9 h-9 rounded-lg bg-[#00c8ff]/15 flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="h-4 w-4 text-[#00c8ff]" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 dark:text-slate-600">Adres</div>
                  <div className="text-sm font-medium">België</div>
                </div>
              </div>
            </div>
          </div>

          {/* Beschikbaarheid */}
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-frost-100 mb-5">Bereikbaarheid</h2>
            <div className="space-y-3">
              {[
                { day: 'Maandag – vrijdag', hours: '9:00 – 18:00' },
                { day: 'Zaterdag', hours: '10:00 – 13:00' },
                { day: 'Zondag', hours: 'Gesloten' },
              ].map((item) => (
                <div key={item.day} className="flex items-center gap-3">
                  <ClockIcon className="h-4 w-4 text-[#00c8ff] flex-shrink-0" />
                  <div className="flex justify-between flex-1 text-sm">
                    <span className="text-gray-600 dark:text-slate-400">{item.day}</span>
                    <span className="font-medium text-gray-900 dark:text-frost-100">{item.hours}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-[#00c8ff]/8 border border-[#00c8ff]/20">
              <p className="text-xs text-gray-600 dark:text-slate-400">
                <strong>Technische support</strong> voor actieve abonnees is beschikbaar via het platform, ook buiten kantooruren.
              </p>
            </div>
          </div>

          {/* Wat te verwachten */}
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-frost-100 mb-4">Wat kunt u verwachten?</h2>
            <div className="space-y-3">
              {[
                { step: '1', text: 'We nemen contact op binnen 1 werkdag' },
                { step: '2', text: 'Korte intake om uw situatie te begrijpen' },
                { step: '3', text: 'Demo of offerte op maat' },
                { step: '4', text: 'Installatie en onboarding indien gewenst' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00c8ff] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-slate-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-2">
          {/* Type selector */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
              Waarvoor wenst u contact op te nemen?
            </label>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {contactTypes.map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setSelectedType(ct.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                    selectedType === ct.id
                      ? 'border-[#00c8ff] bg-[#00c8ff]/8'
                      : 'border-gray-200 dark:border-frost-800 bg-gray-50 dark:bg-frost-900 hover:border-[#00c8ff]/40'
                  }`}
                >
                  <ct.icon className={`h-5 w-5 mb-2 ${selectedType === ct.id ? 'text-[#00c8ff]' : 'text-gray-400'}`} />
                  <div className={`text-sm font-semibold mb-0.5 ${selectedType === ct.id ? 'text-[#00c8ff]' : 'text-gray-900 dark:text-frost-100'}`}>
                    {ct.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-500 leading-tight">{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Naam <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100 focus:outline-none focus:border-[#00c8ff] transition-colors text-sm"
                  placeholder="Uw voor- en achternaam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  E-mailadres <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100 focus:outline-none focus:border-[#00c8ff] transition-colors text-sm"
                  placeholder="naam@bedrijf.be"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Telefoonnummer
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100 focus:outline-none focus:border-[#00c8ff] transition-colors text-sm"
                  placeholder="+32 470 12 34 56"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Bedrijfsnaam
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100 focus:outline-none focus:border-[#00c8ff] transition-colors text-sm"
                  placeholder="Uw bedrijfsnaam"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Sector
              </label>
              <select
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100 focus:outline-none focus:border-[#00c8ff] transition-colors text-sm"
              >
                <option value="">Selecteer uw sector...</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {(selectedType === 'offerte' || selectedType === 'demo') && (
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Aantal locaties
                  </label>
                  <select
                    value={formData.locations}
                    onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100 focus:outline-none focus:border-[#00c8ff] transition-colors text-sm"
                  >
                    <option value="">Selecteer...</option>
                    <option>1 locatie</option>
                    <option>2-5 locaties</option>
                    <option>6-20 locaties</option>
                    <option>Meer dan 20 locaties</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Aantal koelcellen
                  </label>
                  <select
                    value={formData.coldrooms}
                    onChange={(e) => setFormData({ ...formData, coldrooms: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100 focus:outline-none focus:border-[#00c8ff] transition-colors text-sm"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Uw bericht <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-frost-800 bg-white dark:bg-frost-900 text-gray-900 dark:text-frost-100 focus:outline-none focus:border-[#00c8ff] transition-colors text-sm resize-none"
                placeholder={
                  selectedType === 'demo'
                    ? 'Vertel ons kort over uw situatie: sector, aantal koelcellen, huidige monitoring...'
                    : selectedType === 'offerte'
                    ? 'Beschrijf wat u zoekt. Hoe meer informatie, hoe gerichter onze offerte.'
                    : selectedType === 'technicus'
                    ? 'Vertel ons over uw bedrijf en hoe een partnerschap eruit zou kunnen zien.'
                    : 'Uw vraag of opmerking...'
                }
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-[#00c8ff] hover:bg-[#00a8dd] transition-colors text-sm"
              >
                {selectedType === 'demo' && 'Demo aanvragen'}
                {selectedType === 'offerte' && 'Offerte aanvragen'}
                {selectedType === 'vraag' && 'Vraag versturen'}
                {selectedType === 'technicus' && 'Aanvraag versturen'}
                {selectedType === 'support' && 'Supportverzoek versturen'}
              </button>
              <p className="text-xs text-gray-400 dark:text-slate-600 text-center mt-3">
                We antwoorden normaal gezien binnen 1 werkdag.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
