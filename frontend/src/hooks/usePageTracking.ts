import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCookieConsent } from './useCookieConsent';

/**
 * Stuurt automatisch een GA4 page_view event bij elke route-wijziging.
 * Werkt alleen als de gebruiker cookietoestemming heeft gegeven.
 * Moet gebruikt worden in een component die binnen <Router> leeft.
 */
export function usePageTracking(): void {
  const location = useLocation();
  const { consent } = useCookieConsent();

  useEffect(() => {
    if (consent !== 'accepted') return;
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location, consent]);
}
