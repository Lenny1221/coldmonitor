import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const CONSENT_KEY = 'intellifrost_cookie_consent';
const GA4_ID = 'G-2M9908VXTP';
const META_PIXEL_ID = '1484537073422370';

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
 * Meta (Facebook) Pixel laden – enkel op web en pas na cookietoestemming.
 * De PageView-events worden bij elke route-wissel verstuurd via usePageTracking,
 * dus de bootstrap doet hier bewust géén initiële 'PageView' (voorkomt dubbeltelling).
 */
function initMetaPixel(): void {
  // Nooit in de native Capacitor-app (Meta Pixel hoort enkel op de website).
  if (Capacitor.isNativePlatform()) return;
  if (typeof window.fbq === 'function') return;

  // Officiële Meta Pixel-bootstrap (queue tot fbevents.js geladen is).
  const n = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue!.push(args);
  } as Window['fbq'];
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  window.fbq = n;
  if (!window._fbq) window._fbq = n;

  const t = document.createElement('script');
  t.id = 'meta-pixel-script';
  t.async = true;
  t.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const s = document.getElementsByTagName('script')[0];
  s.parentNode?.insertBefore(t, s);

  window.fbq('init', META_PIXEL_ID);
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

  // GA4 + Meta Pixel initialiseren zodra toestemming 'accepted' is (ook bij herbezoek)
  useEffect(() => {
    if (consent === 'accepted') {
      initGA4();
      initMetaPixel();
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
