import React from 'react';
import { Capacitor } from '@capacitor/core';
import { useCookieConsent } from '../hooks/useCookieConsent';

/**
 * GDPR-conforme cookiebanner voor Google Analytics 4.
 * Verschijnt enkel op web (niet in de native Capacitor-app).
 * Verdwijnt na keuze en keert niet terug bij volgend bezoek.
 */
const CookieBanner: React.FC = () => {
  const { consent, accept, decline } = useCookieConsent();

  // Nooit tonen in de native app
  if (Capacitor.isNativePlatform()) return null;

  // Keuze is al gemaakt – banner blijft verborgen
  if (consent !== null) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-white/10 shadow-2xl"
      style={{ backgroundColor: '#0A1628' }}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie-toestemming"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Tekst */}
          <p className="text-white/90 text-sm leading-relaxed flex-1">
            Wij gebruiken Google Analytics om anoniem bij te houden hoe bezoekers onze website
            gebruiken. Hiervoor worden cookies geplaatst. Uw gegevens worden verwerkt door Google LLC.
            Accepteert u dit?{' '}
            <a
              href="/privacy"
              className="text-[#00c8ff] underline underline-offset-2 hover:text-white transition-colors"
            >
              Privacybeleid
            </a>
          </p>

          {/* Knoppen */}
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white border border-white/40 hover:border-white hover:bg-white/10 transition-all"
            >
              Weigeren
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ backgroundColor: '#00c8ff', color: '#0A1628' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#00a8dd')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00c8ff')}
            >
              Accepteren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
