import { prisma } from '../../config/database';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import { sendAlertEmail } from './emailChannel';
import { sendPushNotification } from '../pushService';
import type { AnomalyFindingDto, AnomalyFeature, FindingSeverity } from '../../anomaly/types';

/**
 * Preventieve bevindingen (zelflerende baseline) zijn niet urgent zoals harde
 * alarmen: max. één melding per 6 uur voor dezelfde situatie. Een nieuwe of
 * gewijzigde set bevindingen (andere signature) meldt wel meteen.
 */
const ANOMALY_NOTIFICATION_COOLDOWN_MS = 6 * 60 * 60 * 1000;

const FEATURE_LABEL: Record<AnomalyFeature, string> = {
  deltaT: 'Temperatuurverschil ruimte/verdamper (ΔT)',
  pullDownMinutes: 'Terugkoeltijd (pull-down)',
  evaporatorFloor: 'Verdampertemperatuur',
  trendDrift: 'Geleidelijke trend-afwijking',
};

function statusLabel(status: FindingSeverity): string {
  return status === 'ALARM' ? 'Alarm' : 'Aandacht';
}

export interface AnomalyNotifyDecision {
  signature: string | null;
  notifiedAt: Date | null;
}

/**
 * Beslist of er een preventieve melding naar de technieker moet en verstuurt
 * deze (push + e-mail). Geeft de nieuwe dedup-signature/timestamp terug zodat
 * de aanroeper ze op de AnomalyState kan bewaren.
 */
export async function maybeNotifyAnomalyFindings(params: {
  coldCellId: string;
  learningDone: boolean;
  findings: AnomalyFindingDto[];
  prevSignature: string | null;
  prevNotifiedAt: Date | null;
}): Promise<AnomalyNotifyDecision> {
  const { coldCellId, learningDone, findings, prevSignature, prevNotifiedAt } = params;

  // Enkel na de leerfase en enkel bevindingen die aandacht/alarm zijn.
  const notifiable = learningDone
    ? findings.filter((f) => f.status === 'ATTENTION' || f.status === 'ALARM')
    : [];

  // Geen actieve bevindingen: signature wissen zodat een latere herhaling
  // opnieuw meldt; cooldown-timestamp behouden we niet langer nodig.
  if (notifiable.length === 0) {
    return { signature: null, notifiedAt: prevNotifiedAt };
  }

  const signature = notifiable
    .map((f) => `${f.feature}:${f.status}`)
    .sort()
    .join('|');

  const changed = signature !== prevSignature;
  const cooldownPassed =
    !prevNotifiedAt || Date.now() - prevNotifiedAt.getTime() >= ANOMALY_NOTIFICATION_COOLDOWN_MS;

  if (!changed && !cooldownPassed) {
    return { signature, notifiedAt: prevNotifiedAt };
  }

  const sent = await sendAnomalyTechnicianNotifications(coldCellId, notifiable);

  // Alleen de timestamp verzetten als er effectief iets verstuurd is; de
  // signature bewaren we sowieso zodat ongewijzigde situaties niet herhalen.
  return { signature, notifiedAt: sent ? new Date() : prevNotifiedAt };
}

async function sendAnomalyTechnicianNotifications(
  coldCellId: string,
  findings: AnomalyFindingDto[]
): Promise<boolean> {
  const cell = await prisma.coldCell.findUnique({
    where: { id: coldCellId },
    select: {
      name: true,
      location: {
        select: {
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
    logger.debug('Anomalie-melding overgeslagen: geen gekoppelde technieker', { coldCellId });
    return false;
  }

  const cellName = cell?.name ?? 'Onbekende cel';
  const companyName = cell?.location?.customer?.companyName ?? 'Klant';
  const hasAlarm = findings.some((f) => f.status === 'ALARM');
  const topFinding =
    findings.find((f) => f.status === 'ALARM') ?? findings[0];

  let anySent = false;

  // Push naar app van de technieker
  if (technician.user?.pushToken) {
    const pushTitle = hasAlarm
      ? 'IntelliFrost – Preventief alarm'
      : 'IntelliFrost – Preventieve melding';
    const pushBody = `${companyName} – ${cellName}: ${topFinding.reden}`;
    const sent = await sendPushNotification(technician.user.pushToken, pushTitle, pushBody, {
      type: 'ANOMALY_FINDING',
      coldCellId,
      severity: hasAlarm ? 'ALARM' : 'ATTENTION',
    });
    anySent = anySent || sent;
  } else {
    logger.debug('Anomalie-melding: technieker heeft geen push token', { coldCellId });
  }

  // E-mail naar de technieker
  if (technician.email) {
    const rows = findings
      .map(
        (f) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">
            <strong>${FEATURE_LABEL[f.feature] ?? f.feature}</strong>
            <span style="color:${f.status === 'ALARM' ? '#d12b2b' : '#c87a00'};font-weight:bold;"> — ${statusLabel(
              f.status
            )}</span><br>
            <span style="color:#444;">${f.reden}</span><br>
            <span style="color:#666;font-size:13px;">Aanbevolen: ${f.aanbevolenActie}</span>
          </td>
        </tr>`
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: ${hasAlarm ? '#d12b2b' : '#c87a00'};">IntelliFrost – Preventieve bevinding</h2>
        <p>De zelflerende bewaking detecteerde een afwijking bij klant <strong>${companyName}</strong> – koelcel <strong>${cellName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows}</table>
        <p><a href="${config.frontendUrl}/technician" style="display: inline-block; padding: 12px 24px; background: #0080ff; color: white; text-decoration: none; border-radius: 6px;">Technician dashboard</a></p>
        <p style="color:#888;font-size:12px;">Dit is een preventieve melding op basis van het zelfgeleerde normaalprofiel, geen hard temperatuuralarm.</p>
      </div>
    `;
    const subjectPrefix = hasAlarm ? 'Preventief alarm' : 'Preventieve melding';
    const sent = await sendAlertEmail(
      technician.email,
      `IntelliFrost – ${subjectPrefix}: ${cellName} (${companyName})`,
      html
    );
    anySent = anySent || sent;
  }

  if (anySent) {
    logger.info('Preventieve anomalie-melding verstuurd naar technieker', {
      coldCellId,
      severity: hasAlarm ? 'ALARM' : 'ATTENTION',
      findings: findings.map((f) => `${f.feature}:${f.status}`),
    });
  }

  return anySent;
}
