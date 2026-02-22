import twilio from 'twilio';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    return null;
  }
  twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
  return twilioClient;
}

export async function sendSms(to: string, body: string): Promise<boolean> {
  const client = getTwilioClient();
  if (!client || !config.twilioPhoneNumber) {
    logger.warn('Twilio niet geconfigureerd – SMS wordt gelogd maar niet verzonden');
    logger.info('SMS (uit):', { to, body: body.substring(0, 50) + '...' });
    return true;
  }

  try {
    await client.messages.create({
      body,
      from: config.twilioPhoneNumber,
      to: to.replace(/\s/g, '').startsWith('+') ? to : `+32${to.replace(/^0/, '')}`,
    });
    logger.info('SMS verzonden', { to });
    return true;
  } catch (err) {
    logger.error('Fout bij verzenden SMS', err as Error, { to });
    return false;
  }
}
