import { config } from '../../config/env';
import { logger } from '../../utils/logger';

export async function sendAlertEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!config.resendApiKey) {
    logger.warn('Resend API niet geconfigureerd – e-mail wordt gelogd maar niet verzonden');
    logger.info('Alert e-mail (uit):', { to, subject });
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `IntelliFrost <${config.resendFromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      logger.error('Resend API fout', new Error(errBody), { to, status: res.status });
      return false;
    }

    logger.info('Alert e-mail verzonden', { to, subject });
    return true;
  } catch (err) {
    logger.error('Fout bij verzenden alert e-mail', err as Error, { to });
    return false;
  }
}
