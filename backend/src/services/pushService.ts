/**
 * Push notification service – FCM (Firebase Cloud Messaging)
 * Verstuurt push notificaties naar de app wanneer o.a. een ticket wordt geaccepteerd/ingepland.
 */
import { config } from '../config/env';
import { logger } from '../utils/logger';

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  if (!token || token.trim().length === 0) {
    logger.debug('Push: geen token, overslaan');
    return false;
  }

  if (!config.fcmServerKey) {
    logger.debug('Push: FCM_SERVER_KEY niet geconfigureerd, overslaan');
    return false;
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${config.fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          sound: 'default',
        },
        data: data || {},
        priority: 'high',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.warn('Push FCM fout', { status: response.status, body: text });
      return false;
    }

    const result = (await response.json()) as { failure?: number };
    if (result.failure === 1) {
      logger.warn('Push FCM: verzenden mislukt', { result });
      return false;
    }

    logger.info('Push verzonden', { title });
    return true;
  } catch (error) {
    logger.error('Push FCM error', error as Error);
    return false;
  }
}

/**
 * Verstuur push naar klant wanneer ticket wordt geaccepteerd of ingepland
 */
export async function sendTicketAcceptedPush(
  customerUserId: string | null,
  ticketType: string,
  scheduledAt?: Date
): Promise<void> {
  if (!customerUserId) return;

  const { prisma } = await import('../config/database');
  const user = await prisma.user.findUnique({
    where: { id: customerUserId },
    select: { pushToken: true },
  });

  if (!user?.pushToken) {
    logger.debug('Push ticket: klant heeft geen push token');
    return;
  }

  const scheduledStr = scheduledAt
    ? ` op ${scheduledAt.toLocaleDateString('nl-BE')} om ${scheduledAt.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  await sendPushNotification(
    user.pushToken,
    'Onderhoudsaanvraag geaccepteerd',
    `Uw ${ticketType} is geaccepteerd en ingepland${scheduledStr}. Bekijk de status in de app.`,
    { type: 'TICKET_ACCEPTED' }
  );
}
