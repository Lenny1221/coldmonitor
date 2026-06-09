import { prisma } from '../../config/database';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { sendAlertEmail } from './emailChannel';
import { sendPushNotification } from '../pushService';

/**
 * Een losgekomen of defecte voeler is een onderhouds-/installatieprobleem, geen
 * hard temperatuuralarm. We melden dit daarom rechtstreeks aan de gekoppelde
 * technieker (push + e-mail) i.p.v. de volledige klant-escalatie (SMS/telefoon).
 */
export async function sendSensorFaultTechnicianNotification(
  coldCellId: string,
  faultLabel: string
): Promise<boolean> {
  const cell = await prisma.coldCell.findUnique({
    where: { id: coldCellId },
    select: {
      name: true,
      location: {
        select: {
          locationName: true,
          customer: {
            select: {
              companyName: true,
              linkedTechnician: {
                select: {
                  email: true,
                  user: { select: { pushToken: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const technician = cell?.location?.customer?.linkedTechnician;
  if (!technician) {
    logger.debug('Voelerfout-melding overgeslagen: geen gekoppelde technieker', { coldCellId });
    return false;
  }

  const cellName = cell?.name ?? 'Onbekende cel';
  const locationName = cell?.location?.locationName ?? '';
  const companyName = cell?.location?.customer?.companyName ?? 'Klant';

  let anySent = false;

  // Push naar de app van de technieker
  if (technician.user?.pushToken) {
    const sent = await sendPushNotification(
      technician.user.pushToken,
      'IntelliFrost – Voeler losgekomen of defect',
      `${companyName} – ${cellName}: ${faultLabel}`,
      { type: 'SENSOR_FAULT', coldCellId }
    );
    anySent = anySent || sent;
  } else {
    logger.debug('Voelerfout-melding: technieker heeft geen push token', { coldCellId });
  }

  // E-mail naar de technieker
  if (technician.email) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #d12b2b;">IntelliFrost – Voeler losgekomen of defect</h2>
        <p>Bij klant <strong>${companyName}</strong>${locationName ? ` (${locationName})` : ''} – koelcel <strong>${cellName}</strong> is een probleem met een voeler gedetecteerd:</p>
        <p style="font-size:16px;"><strong>${faultLabel}</strong></p>
        <p>Controleer de bedrading en de PT1000-voeler(s) ter plaatse. Zolang de voeler ontbreekt, bewaakt het systeem de betrokken temperatuur niet correct.</p>
        <p><a href="${config.frontendUrl}/technician" style="display: inline-block; padding: 12px 24px; background: #0080ff; color: white; text-decoration: none; border-radius: 6px;">Technician dashboard</a></p>
        <p style="color:#888;font-size:12px;">Deze melding verschijnt zolang de voelerconfiguratie (1 of 2 voelers) niet overeenkomt met wat het toestel meet.</p>
      </div>
    `;
    const sent = await sendAlertEmail(
      technician.email,
      `IntelliFrost – Voelerfout: ${cellName} (${companyName})`,
      html
    );
    anySent = anySent || sent;
  }

  if (anySent) {
    logger.info('Voelerfout-melding verstuurd naar technieker', { coldCellId, faultLabel });
  }

  return anySent;
}
