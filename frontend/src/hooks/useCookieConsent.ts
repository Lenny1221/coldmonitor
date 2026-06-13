import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const CONSENT_KEY = 'intellifrost_cookie_consent';
const GA4_ID = 'G-2M9908VXTP';

export type ConsentStatus = 'accepted' | 'declined' | null;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: unknown;
    };
    _fbq?: unknown;
  }
}

function initGA4(): void {
  if (document.getElementById('ga4-script')) return;

  window.dataLayer = window.dataLayer || [];
  // Google vereist het 'arguments'-object (geen rest-params) zodat gtag.js
  // de dataLayer-entries correct herkent en verwerkt.
  // eslint-disable-next-line prefer-rest-params
  (window as any).gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // anonymize_ip bestaat niet in GA4 (alleen UA) – weglaten
  window.gtag('config', GA4_ID);

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);
}

/**
 * Activeer Meta Pixel-tracking na cookietoestemming.
 * De bootstrap staat in index.html; hier geven we enkel consent + events vrij.
 */
function grantMetaPixelConsent(): void {
  if (Capacitor.isNativePlatform()) return;
  if (typeof window.fbq !== 'function') return;
  window.fbq('consent', 'grant');
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

  // GA4 + Meta consent zodra toestemming 'accepted' is (pixel-bootstrap staat in index.html)
  useEffect(() => {
    if (consent === 'accepted') {
      initGA4();
      grantMetaPixelConsent();
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

  /**
   * Conversie: formulier ingediend (wachtlijst of contact).
   * GA4 generate_lead + Meta Pixel Lead – enkel na cookietoestemming.
   */
  const trackLead = (params: { form: 'waitlist' | 'contact'; category?: string }) => {
    if (consent !== 'accepted') return;

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', {
        form: params.form,
        lead_type: params.category,
      });
    }

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {
        content_name: params.form === 'waitlist' ? 'Wachtlijst' : 'Contact',
        content_category: params.category,
      });
    }
  };

  return { consent, accept, decline, trackEvent, trackLead };
}
