import { logEscalation } from '../escalationService';
import { sendAlertEmail } from './emailChannel';
import { sendSms } from './smsChannel';
import { EscalationChannel, EscalationRecipient } from '@prisma/client';
import type { AlertWithRelations } from '../escalationService';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

/**
 * Layer 2: Client SMS + push repeat + backup contact
 * Technician: SMS met alarmcode + werkorder
 */
export async function sendLayer2Notifications(alert: AlertWithRelations): Promise<void> {
  if (!alert) return;

  const customer = alert.coldCell?.location?.customer;
  const technician = customer?.linkedTechnician;
  const coldCellName = alert.coldCell?.name ?? 'Onbekende cel';
  const temp = alert.value ?? 0;
  const alertType = alert.type === 'HIGH_TEMP' ? 'te hoog' : alert.type === 'LOW_TEMP' ? 'te laag' : alert.type;

  const smsBody = `IntelliFrost: Alarm ${coldCellName} – ${alertType} (${temp}°C). Bevestig in de app.`;

  // Client: SMS
  if (customer?.phone) {
    await sendSms(customer.phone, smsBody);
    await logEscalation(alert.id, 'LAYER_2', 'SMS naar klant', 'CLIENT', 'SMS');
  }

  // Client: e-mail herhaling
  if (customer?.email) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #ff9500;">IntelliFrost – Escalatie alarm</h2>
        <p>Het alarm voor <strong>${coldCellName}</strong> is geëscaleerd. Bevestig zo snel mogelijk.</p>
        <p><strong>Type:</strong> ${alertType} – <strong>Waarde:</strong> ${temp}°C</p>
        <p><a href="${config.frontendUrl}/dashboard">Bekijk dashboard</a></p>
      </div>
    `;
    await sendAlertEmail(
      customer.email,
      `[Escalatie] IntelliFrost – ${coldCellName}`,
      html
    );
    await logEscalation(alert.id, 'LAYER_2', 'E-mail herhaling naar klant', 'CLIENT', 'EMAIL');
  }

  // Backup contacten: SMS
  const backupList = (customer?.backupContacts as Array<{ phone: string }> | null)?.filter((c) => c?.phone) ?? [];
  const backupPhones = backupList.length > 0 ? backupList.map((c) => c.phone) : (customer?.backupPhone ? [customer.backupPhone] : []);
  for (const phone of backupPhones) {
    await sendSms(phone, `IntelliFrost: ${customer?.companyName} – Alarm ${coldCellName}. Neem contact op.`);
    await logEscalation(alert.id, 'LAYER_2', 'SMS naar backup contact', 'CLIENT', 'SMS');
  }

  // Technician: SMS
  if (technician?.phone) {
    await sendSms(
      technician.phone,
      `IntelliFrost alarm: ${customer?.companyName} – ${coldCellName} (${alertType}). Code: ${alert.id.slice(-6)}`
    );
    await logEscalation(alert.id, 'LAYER_2', 'SMS naar technicus', 'TECHNICIAN', 'SMS');
  }

  logger.info('Layer 2 notificaties verzonden', { alertId: alert.id });
}
