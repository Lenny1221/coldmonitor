import type { AlarmLayer } from '@prisma/client';
import { prisma } from '../../config/database';

/**
 * Minimale tijd tussen notificaties (e-mail/push/SMS) voor hetzelfde actieve alarm.
 * - Onopgelost alarm: max. één melding per 5 minuten (zelfde alertId).
 * - Nieuw alarm na RESOLVED: direct (nieuw alertId → geen eerdere logs).
 */
export const ALERT_NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Controleer of we opnieuw mogen notificeren voor dit alarm op deze laag.
 * Gebruikt EscalationLog als bron van waarheid.
 */
export async function shouldSendAlertNotification(
  alertId: string,
  layer: AlarmLayer
): Promise<boolean> {
  const lastLog = await prisma.escalationLog.findFirst({
    where: { alarmId: alertId, layer },
    orderBy: { sentAt: 'desc' },
  });
  if (!lastLog) return true;

  const elapsed = Date.now() - lastLog.sentAt.getTime();
  return elapsed >= ALERT_NOTIFICATION_COOLDOWN_MS;
}

/**
 * Laatste notificatie voor dit alarm (alle lagen) — voor logging/diagnose.
 */
export async function msSinceLastNotification(alertId: string): Promise<number | null> {
  const lastLog = await prisma.escalationLog.findFirst({
    where: { alarmId: alertId },
    orderBy: { sentAt: 'desc' },
  });
  if (!lastLog) return null;
  return Date.now() - lastLog.sentAt.getTime();
}
