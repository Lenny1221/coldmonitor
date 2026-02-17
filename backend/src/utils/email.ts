import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    logger.warn('SMTP niet geconfigureerd – verificatie-e-mails worden gelogd maar niet verzonden');
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

  const transport = getTransporter();
  if (transport) {
    try {
      await transport.sendMail({
        from: config.emailFrom,
        to,
        subject,
        html,
      });
      logger.info('Verificatie-e-mail verzonden', { to });
      return true;
    } catch (err) {
      logger.error('Fout bij verzenden verificatie-e-mail', err as Error, { to });
      return false;
    }
  }

  // Geen SMTP: log de link (voor development)
  logger.info('Verificatie-e-mail (SMTP uit):', { to, verifyUrl });
  return true;
}
