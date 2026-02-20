import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
  return transporter;
}

/**
 * Verstuur verificatie-e-mail via Resend HTTP API (aanbevolen) of SMTP.
 * Resend API heeft geen SMTP-configuratie nodig en werkt betrouwbaarder.
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  role: 'customer' | 'technician'
): Promise<boolean> {
  const verifyUrl = `${config.apiUrl}/api/auth/verify-email?token=${token}`;
  const subject = 'Bevestig je ColdMonitor-account';
  const html = `
    <h2>Welkom bij ColdMonitor</h2>
    <p>Klik op de onderstaande link om je e-mailadres te bevestigen:</p>
    <p><a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a></p>
    <p>Deze link is 24 uur geldig.</p>
    <p>Als je geen account hebt aangemaakt, negeer dan deze e-mail.</p>
  `;

  // 1. Resend HTTP API (aanbevolen – geen SMTP/poort nodig)
  if (config.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `ColdMonitor <${config.emailFrom}>`,
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

      const data = (await res.json()) as { id?: string };
      logger.info('Verificatie-e-mail verzonden (Resend)', { to, emailId: data.id });
      return true;
    } catch (err) {
      logger.error('Fout bij verzenden via Resend API', err as Error, { to });
      return false;
    }
  }

  // 2. SMTP fallback
  const transport = getTransporter();
  if (transport) {
    try {
      await transport.sendMail({
        from: `ColdMonitor <${config.emailFrom}>`,
        to,
        subject,
        html,
      });
      logger.info('Verificatie-e-mail verzonden (SMTP)', { to });
      return true;
    } catch (err) {
      logger.error('Fout bij verzenden verificatie-e-mail', err as Error, { to });
      return false;
    }
  }

  // 3. Geen e-mail geconfigureerd – log voor development
  logger.warn('SMTP niet geconfigureerd – verificatie-e-mails worden gelogd maar niet verzonden');
  logger.info('Verificatie-e-mail (uit):', { to, verifyUrl });
  return true;
}
