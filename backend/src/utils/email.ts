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

/** Haal voornaam uit contactName of name (eerste woord) */
function getFirstName(contactName?: string): string {
  if (!contactName?.trim()) return 'daar';
  const first = contactName.trim().split(/\s+/)[0];
  return first || 'daar';
}

/**
 * Verstuur verificatie-e-mail via Resend HTTP API (aanbevolen) of SMTP.
 * Resend API heeft geen SMTP-configuratie nodig en werkt betrouwbaarder.
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  role: 'customer' | 'technician',
  contactName?: string
): Promise<boolean> {
  const verifyUrl = `${config.apiUrl}/api/auth/verify-email?token=${token}`;
  const voornaam = getFirstName(contactName);
  const subject = 'Bevestig je IntelliFrost-account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
      <p>Beste ${voornaam},</p>
      <p>Welkom bij <strong>IntelliFrost</strong> — je account is bijna klaar om te gebruiken.</p>
      <p>Om je registratie te voltooien en je account te activeren, vragen we je om eerst je e-mailadres te bevestigen via onderstaande knop:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Account bevestigen</a>
      </p>
      <p>Na activatie krijg je meteen toegang tot je dashboard waar je:</p>
      <ul>
        <li>je koel- en vriescellen kan beheren</li>
        <li>meldingen en alarmen kan opvolgen</li>
        <li>realtime data en historiek kan bekijken</li>
      </ul>
      <p><strong>Belangrijk:</strong> Deze bevestigingslink is tijdelijk geldig om de veiligheid van je account te garanderen.</p>
      <p>Heb je zelf geen account aangemaakt? Dan mag je deze mail gewoon negeren — er worden geen gegevens opgeslagen zonder bevestiging.</p>
      <p>Heb je vragen of hulp nodig bij de opstart?<br>Contacteer ons gerust via <a href="mailto:support@intellifrost.be">support@intellifrost.be</a>.</p>
      <p>Met vriendelijke groeten,<br><strong>Team IntelliFrost</strong><br>Realtime monitoring voor koel- en vriesinstallaties</p>
    </div>
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
          from: `IntelliFrost <${config.emailFrom}>`,
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
        from: `IntelliFrost <${config.emailFrom}>`,
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
