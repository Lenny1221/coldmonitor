import { logEscalation } from '../escalationService';
import { sendSms } from './smsChannel';
import { initiatePhoneCall } from './phoneChannel';
import { EscalationChannel, EscalationRecipient } from '@prisma/client';
import type { AlertWithRelations } from '../escalationService';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { sendPushNotification } from '../pushService';
import { shouldSendAlertNotification } from './notificationCooldown';

/**
 * Layer 3: AI-telefoonbot (Twilio + ElevenLabs TTS)
 * - Klant: telefoon
 * - Backup contacten: telefoon
 * - Technicus: alleen SMS (geen telefoon)
 */
export async function sendLayer3Notifications(alert: AlertWithRelations): Promise<void> {
  if (!alert) return;

  if (!(await shouldSendAlertNotification(alert.id, 'LAYER_3'))) {
    logger.debug('Layer 3 overgeslagen: cooldown actief', { alertId: alert.id });
    return;
  }

  const customer = alert.coldCell?.location?.customer;
  const technician = customer?.linkedTechnician;
  const coldCellName = alert.coldCell?.name ?? 'Onbekende cel';
  const temp = alert.value ?? 0;

  const apiUrl = config.apiUrl.replace(/\/$/, '');
  const voiceUrl = `${apiUrl}/api/twilio/voice/${alert.id}`;

  const isConnectionAlert = alert.type === 'WIFI_LOSS' || alert.type === 'POWER_LOSS';
  const alertTypeText =
    alert.type === 'HIGH_TEMP'
      ? 'te hoog'
      : alert.type === 'LOW_TEMP'
        ? 'te laag'
        : alert.type === 'WIFI_LOSS'
          ? 'WiFi-verbinding verloren'
          : alert.type === 'POWER_LOSS'
            ? 'Stroomuitval'
            : String(alert.type);

  // Klant: push naar app (laag 3 = dringend) – zelfde token-flow als laag 1/2
  if (customer?.id) {
    const custRow = await prisma.customer.findUnique({
      where: { id: customer.id },
      select: { user: { select: { pushToken: true } } },
    });
    if (custRow?.user?.pushToken) {
      const pushBody = isConnectionAlert
        ? `${coldCellName}: ${alertTypeText}. Open de app onmiddellijk.`
        : `${coldCellName}: temperatuur ${alertTypeText} (${temp}°C). Open de app onmiddellijk.`;
      const sent = await sendPushNotification(
        custRow.user.pushToken,
        'IntelliFrost – DRINGEND alarm',
        pushBody,
        { type: 'ALARM_LAYER3', alertId: alert.id }
      );
      if (sent) {
        await logEscalation(alert.id, 'LAYER_3', 'Push naar klant (app)', 'CLIENT', 'PUSH');
      }
    } else {
      logger.debug('Layer 3: klant heeft geen push token', { alertId: alert.id, customerId: customer.id });
    }
  }

  // Technicus: push naar app
  if (technician?.id) {
    const techRow = await prisma.technician.findUnique({
      where: { id: technician.id },
      select: { user: { select: { pushToken: true } } },
    });
    if (techRow?.user?.pushToken) {
      const sent = await sendPushNotification(
        techRow.user.pushToken,
        'IntelliFrost – DRINGEND alarm',
        `${customer?.companyName ?? 'Klant'} – ${coldCellName}: ${alertTypeText}${isConnectionAlert ? '' : ` (${temp}°C)`}`,
        { type: 'ALARM_LAYER3_TECH', alertId: alert.id }
      );
      if (sent) {
        await logEscalation(alert.id, 'LAYER_3', 'Push naar technicus (app)', 'TECHNICIAN', 'PUSH');
      }
    }
  }

  // AI-telefoonbot naar klant
  if (customer?.phone) {
    const callSid = await initiatePhoneCall(customer.phone, voiceUrl);
    if (callSid) {
      await logEscalation(alert.id, 'LAYER_3', 'AI-telefoon naar klant', 'CLIENT', 'PHONE');
    }
  }

  // Backup contacten parallel
  const backupList = (customer?.backupContacts as Array<{ phone: string }> | null)?.filter((c) => c?.phone) ?? [];
  const backupPhones = backupList.length > 0 ? backupList.map((c) => c.phone) : (customer?.backupPhone ? [customer.backupPhone] : []);
  for (const phone of backupPhones) {
    const backupVoiceUrl = `${apiUrl}/api/twilio/voice/${alert.id}?backup=1`;
    await initiatePhoneCall(phone, backupVoiceUrl);
    await logEscalation(alert.id, 'LAYER_3', 'Telefoon naar backup contact', 'CLIENT', 'PHONE');
  }

  // Technicus: alleen SMS (geen telefoon – enkel klant wordt opgebeld)
  if (technician?.phone) {
    let smsDetail: string;
    switch (alert.type) {
      case 'WIFI_LOSS':
        smsDetail = 'WiFi-verbinding verbroken';
        break;
      case 'POWER_LOSS':
        smsDetail = 'Stroomonderbreking';
        break;
      case 'DOOR_OPEN':
        smsDetail = 'Deur te lang open';
        break;
      default:
        smsDetail = `Temperatuur ${temp}°C`;
    }
    await sendSms(
      technician.phone,
      `IntelliFrost URGENT: ${customer?.companyName} – ${coldCellName}. ${smsDetail}. U wordt gedispatcht.`
    );
    await logEscalation(alert.id, 'LAYER_3', 'SMS naar technicus', 'TECHNICIAN', 'SMS');
  }

  logger.info('Layer 3 notificaties verzonden', { alertId: alert.id });
}
