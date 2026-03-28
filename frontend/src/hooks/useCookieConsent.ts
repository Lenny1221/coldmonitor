import { useState, useEffect } from 'react';

const CONSENT_KEY = 'intellifrost_cookie_consent';
const GA4_ID = 'G-2M9908VXTP';

export type ConsentStatus = 'accepted' | 'declined' | null;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function initGA4(): void {
  if (document.getElementById('ga4-script')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID, { anonymize_ip: true });

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);
}

function readStorage(): ConsentStatus {
  try {
    return (localStorage.getItem(CONSENT_KEY) as ConsentStatus) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(value: ConsentStatus): void {
  try {
    if (value === null) {
      localStorage.removeItem(CONSENT_KEY);
    } else {
      localStorage.setItem(CONSENT_KEY, value);
    }
  } catch {
    // localStorage niet beschikbaar (bv. private mode met strikte instellingen)
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(readStorage);

  // GA4 initialiseren zodra toestemming 'accepted' is (ook bij herbezoek)
  useEffect(() => {
    if (consent === 'accepted') {
      initGA4();
    }
  }, [consent]);

  const accept = () => {
    writeStorage('accepted');
    setConsent('accepted');
  };

  const decline = () => {
    writeStorage('declined');
    setConsent('declined');
  };

  /**
   * Stuur een GA4 event – wordt genegeerd als de gebruiker geen toestemming gaf.
   * Gebruik: trackEvent('demo_aangevraagd', { pagina: 'home' })
   */
  const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
    if (consent === 'accepted' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params ?? {});
    }
  };

  return { consent, accept, decline, trackEvent };
}
