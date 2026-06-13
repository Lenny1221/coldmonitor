import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircleIcon,
  BoltIcon,
  BellAlertIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { waitlistApi, getErrorMessage } from '../services/api';
import { useCookieConsent } from '../hooks/useCookieConsent';

const EARLY_BIRD_LIMIT = 25;
const EARLY_BIRD_OFFER = '3 maanden gratis + gratis installatie';

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

const benefits = [
  { icon: BellAlertIcon, text: 'Direct alarm via app, SMS én telefoon' },
  { icon: BoltIcon, text: 'Realtime temperatuur- en deurbewaking' },
  { icon: SparklesIcon, text: 'Zelflerende detectie: preventief verwittigd' },
  { icon: DevicePhoneMobileIcon, text: 'Je koelcellen in je broekzak' },
];

const Waitlist: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', sector: '' });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ position: number; earlyBird: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { trackLead } = useCookieConsent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await waitlistApi.submit({
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
        sector: form.sector || undefined,
      });
      setResult({ position: res.position, earlyBird: res.earlyBird });
      setSubmitted(true);
      trackLead({
        form: 'waitlist',
        category: res.earlyBird ? 'early_bird' : 'wachtlijst',
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Er ging iets mis. Probeer het later opnieuw of mail naar info@intellifrost.be.'));
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
        <h2 className="font-display text-2xl font-bold text-navy mb-3">Je staat op de wachtlijst!</h2>
        {result?.earlyBird ? (
          <p className="text-gray-600 mb-2">
            Goed nieuws: je bent <strong>#{result.position}</strong> en hoort bij de eerste {EARLY_BIRD_LIMIT} —
            je krijgt als early-bird <strong>{EARLY_BIRD_OFFER}</strong> bij de start.
          </p>
        ) : (
          <p className="text-gray-600 mb-2">
            Bedankt voor je inschrijving{result ? <> — je bent <strong>#{result.position}</strong></> : ''}.
          </p>
        )}
        <p className="text-gray-500 text-sm">
          We sturen je een bevestiging per e-mail en nemen persoonlijk contact op zodra we van start gaan.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Wachtlijst – IntelliFrost | Slimme koelcelbewaking</title>
        <meta
          name="description"
          content="Schrijf je in op de IntelliFrost-wachtlijst. De eerste 25 aanmeldingen krijgen een exclusieve early-bird-korting bij de lancering."
        />
        <link rel="canonical" href="https://intellifrost.be/wachtlijst" />
        <meta property="og:title" content="Wachtlijst – IntelliFrost" />
        <meta property="og:description" content="Wees er als eerste bij. Schrijf je in op de wachtlijst en krijg early-bird-voordeel." />
        <meta property="og:url" content="https://intellifrost.be/wachtlijst" />
      </Helmet>

      <section className="px-5 pt-28 pb-6 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-semibold uppercase tracking-wider mb-5">
          <SparklesIcon className="h-4 w-4" /> Binnenkort beschikbaar
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-navy max-w-2xl mx-auto mb-4">
          Wees er als eerste bij met IntelliFrost
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Slimme, realtime bewaking van je koel- en vriescellen. Laat je gegevens achter en we nemen contact op zodra we starten.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-5 pb-20 grid md:grid-cols-2 gap-10 items-start">
        {/* Voordelen + early-bird */}
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-navy text-white">
            <p className="text-brand text-xs font-semibold uppercase tracking-wider mb-1">Early-bird</p>
            <p className="text-white font-display text-xl font-bold leading-snug">
              Eerste {EARLY_BIRD_LIMIT} aanmeldingen: {EARLY_BIRD_OFFER}
            </p>
          </div>
          <ul className="space-y-3">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-brand" />
                </span>
                <span className="text-sm text-gray-700 pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Formulier (kort) */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-2xl border border-gray-200 shadow-sm bg-white">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Naam <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Uw voor- en achternaam"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              E-mail <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="naam@bedrijf.be"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bedrijf <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Uw bedrijfsnaam"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefoon <span className="text-red-400">*</span>
              </label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+32 470 12 34 56"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sector</label>
            <select
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand text-sm"
            >
              <option value="">Selecteer uw sector... (optioneel)</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-navy bg-brand hover:bg-brand-dark disabled:opacity-70 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? 'Bezig met versturen...' : 'Zet mij op de wachtlijst'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Geen verplichtingen. We gebruiken je gegevens enkel om contact op te nemen bij de lancering.
          </p>
        </form>
      </div>
    </>
  );
};

export default Waitlist;
