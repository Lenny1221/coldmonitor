import { logEscalation } from '../escalationService';
import { sendSms } from './smsChannel';
import { initiatePhoneCall } from './phoneChannel';
import { EscalationChannel, EscalationRecipient } from '@prisma/client';
import type { AlertWithRelations } from '../escalationService';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

/**
 * Layer 3: AI-telefoonbot (Twilio + ElevenLabs TTS)
 * Backup contact parallel gebeld
 * Technicus automatisch gedispatcht
 */
export async function sendLayer3Notifications(alert: AlertWithRelations): Promise<void> {
  if (!alert) return;

  const customer = alert.coldCell?.location?.customer;
  const technician = customer?.linkedTechnician;
  const coldCellName = alert.coldCell?.name ?? 'Onbekende cel';
  const temp = alert.value ?? 0;

  const apiUrl = config.apiUrl.replace(/\/$/, '');
  const voiceUrl = `${apiUrl}/api/twilio/voice/${alert.id}`;

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

  // Technicus: SMS + telefoon
  if (technician?.phone) {
    await sendSms(
      technician.phone,
      `IntelliFrost URGENT: ${customer?.companyName} – ${coldCellName}. Temperatuur ${temp}°C. U wordt gedispatcht.`
    );
    await logEscalation(alert.id, 'LAYER_3', 'SMS naar technicus', 'TECHNICIAN', 'SMS');

    const techVoiceUrl = `${apiUrl}/api/twilio/voice/${alert.id}?technician=1`;
    await initiatePhoneCall(technician.phone, techVoiceUrl);
    await logEscalation(alert.id, 'LAYER_3', 'Telefoon naar technicus', 'TECHNICIAN', 'PHONE');
  }

  logger.info('Layer 3 notificaties verzonden', { alertId: alert.id });
}
