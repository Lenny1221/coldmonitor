import { logEscalation } from '../escalationService';
import { sendAlertEmail } from './emailChannel';
import type { AlertWithRelations } from '../escalationService';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { sendPushNotification } from '../pushService';

/**
 * Layer 1: Client push + email met temperatuurgrafiek
 * Technician: app alert + dashboard prioriteit
 */
export async function sendLayer1Notifications(alert: AlertWithRelations): Promise<void> {
  if (!alert) return;

  const customer = alert.coldCell?.location?.customer;
  const technician = customer?.linkedTechnician;
  const coldCellName = alert.coldCell?.name ?? 'Onbekende cel';
  const temp = alert.value ?? 0;
  const threshold = alert.threshold ?? 0;
  const alertType =
    alert.type === 'HIGH_TEMP'
      ? 'te hoog'
      : alert.type === 'LOW_TEMP'
        ? 'te laag'
        : alert.type === 'WIFI_LOSS'
          ? 'WiFi-verbinding verloren'
          : alert.type === 'POWER_LOSS'
            ? 'Stroom uitval'
            : alert.type;

  const isConnectionAlert = alert.type === 'WIFI_LOSS' || alert.type === 'POWER_LOSS';
  const emailSubject = isConnectionAlert
    ? `IntelliFrost – ${alertType}: ${coldCellName}`
    : `IntelliFrost – Temperatuuralarm: ${coldCellName}`;
  const emailBody = isConnectionAlert
    ? `<p>Het meetapparaat van koelcel <strong>${coldCellName}</strong> is offline (geen verbinding meer).</p>
        <p><strong>Type:</strong> ${alertType}</p>
        <p>Controleer de WiFi-verbinding of stroomvoorziening van het apparaat.</p>`
    : `<p>Uw koelcel <strong>${coldCellName}</strong> heeft een temperatuuralarm.</p>
        <p><strong>Type:</strong> ${alertType}<br>
        <strong>Huidige waarde:</strong> ${temp}°C<br>
        <strong>Drempel:</strong> ${threshold}°C</p>`;

  // Client: e-mail
  if (customer?.email) {
    const dashboardUrl = `${config.frontendUrl}/dashboard`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #00c8ff;">IntelliFrost – Alarm</h2>
        ${emailBody}
        <p><a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #00c8ff; color: #060d18; text-decoration: none; border-radius: 6px; font-weight: bold;">Bekijk dashboard</a></p>
        <p style="color: #666; font-size: 12px;">Bevestig het alarm in het dashboard om verdere escalatie te stoppen.</p>
      </div>
    `;
    await sendAlertEmail(customer.email, emailSubject, html);
    await logEscalation(
      alert.id,
      'LAYER_1',
      'E-mail verzonden naar klant',
      'CLIENT',
      'EMAIL'
    );
  }

  // Push: log (geen echte push zonder FCM/OneSignal – later uitbreiden)
  logger.info('Layer 1: push notification (app alert)', {
    alertId: alert.id,
    customerId: customer?.id,
  });
  await logEscalation(alert.id, 'LAYER_1', 'App-alert naar klant', 'CLIENT', 'PUSH');

  // Technician: app alert + dashboard
  if (technician?.email) {
    const techBody = isConnectionAlert
      ? `<p><strong>Type:</strong> ${alertType}</p>`
      : `<p><strong>Type:</strong> ${alertType}<br><strong>Waarde:</strong> ${temp}°C</p>`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #ff9500;">IntelliFrost – Alarm (prioriteit verhoogd)</h2>
        <p>Klant <strong>${customer?.companyName}</strong> – koelcel <strong>${coldCellName}</strong>.</p>
        ${techBody}
        <p><a href="${config.frontendUrl}/technician" style="display: inline-block; padding: 12px 24px; background: #0080ff; color: white; text-decoration: none; border-radius: 6px;">Technician dashboard</a></p>
      </div>
    `;
    await sendAlertEmail(
      technician.email,
      `IntelliFrost – Alarm: ${coldCellName} (${customer?.companyName})`,
      html
    );
    await logEscalation(
      alert.id,
      'LAYER_1',
      'E-mail naar technicus',
      'TECHNICIAN',
      'EMAIL'
    );
  }

  // Technicus: push naar app
  if (technician?.id) {
    const techRow = await prisma.technician.findUnique({
      where: { id: technician.id },
      select: { user: { select: { pushToken: true } } },
    });
    if (techRow?.user?.pushToken) {
      const pushTitle = 'IntelliFrost – Alarm';
      const pushBody = `${customer?.companyName ?? 'Klant'} – ${coldCellName}`;
      const sent = await sendPushNotification(techRow.user.pushToken, pushTitle, pushBody, {
        type: 'ALARM_TECH',
        alertId: alert.id,
      });
      if (sent) {
        await logEscalation(alert.id, 'LAYER_1', 'Push naar technicus (app)', 'TECHNICIAN', 'PUSH');
      }
    }
  }
}
