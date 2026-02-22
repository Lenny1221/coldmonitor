/**
 * IntelliFrost Escalatie-service
 * Beheert alarm-escalatie volgens tijdslot en laag.
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import {
  AlarmLayer,
  AlertStatus,
  EscalationChannel,
  EscalationRecipient,
  TimeSlot,
} from '@prisma/client';
import { getTimeSlot, getInitialLayerForTimeSlot, isLayerEnabled, type EscalationConfig } from '../utils/timeSlotUtil';
import { sendLayer1Notifications } from './notifications/layer1';
import { sendLayer2Notifications } from './notifications/layer2';
import { sendLayer3Notifications } from './notifications/layer3';

const ESCALATION_WAIT_MS = {
  LAYER_1_TO_2: 20 * 60 * 1000, // 20 min (OPEN_HOURS)
  LAYER_2_TO_3: 15 * 60 * 1000, // 15 min
};

export type AlertWithRelations = Awaited<
  ReturnType<typeof prisma.alert.findFirst>
> & {
  coldCell: {
    id: string;
    name: string;
    location: {
      customer: {
        id: string;
        companyName: string;
        email: string;
        phone: string | null;
        backupPhone: string | null;
        openingTime: string;
        closingTime: string;
        nightStart: string;
        escalationConfig?: EscalationConfig | null;
        linkedTechnician: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
        } | null;
      };
    };
  };
};

/**
 * Log een escalatie-actie
 */
export async function logEscalation(
  alarmId: string,
  layer: AlarmLayer,
  action: string,
  recipientType: EscalationRecipient,
  channel: EscalationChannel,
  responseAt?: Date
): Promise<void> {
  await prisma.escalationLog.create({
    data: {
      alarmId,
      layer,
      action,
      recipientType,
      channel,
      responseAt,
    },
  });
}

/**
 * Start Layer 1 notificaties (push + email client, app alert technician)
 */
export async function executeLayer1(alert: AlertWithRelations): Promise<void> {
  if (!alert) return;
  await sendLayer1Notifications(alert);
}

/**
 * Start Layer 2 notificaties (SMS, push repeat, backup contact, technician SMS)
 */
export async function executeLayer2(alert: AlertWithRelations): Promise<void> {
  if (!alert) return;
  await sendLayer2Notifications(alert);
}

/**
 * Start Layer 3 notificaties (AI phone bot, backup contact, technician dispatch)
 */
export async function executeLayer3(alert: AlertWithRelations): Promise<void> {
  if (!alert) return;
  await sendLayer3Notifications(alert);
}

/**
 * Escalatie-cron: controleer alle actieve alarmen en escalate indien timer verlopen
 */
export async function runEscalationCron(): Promise<void> {
  const now = new Date();

  const activeAlerts = await prisma.alert.findMany({
    where: {
      status: { in: ['ACTIVE', 'ESCALATING'] },
      acknowledgedAt: null,
    },
    include: {
      coldCell: {
        include: {
          location: {
            include: {
              customer: {
                include: {
                  linkedTechnician: true,
                },
              },
            },
          },
        },
      },
    },
  });

  for (const alert of activeAlerts) {
    try {
      const customer = alert.coldCell?.location?.customer;
      if (!customer) continue;

      const timeSlot = (alert.timeSlot ?? getTimeSlot(customer)) as TimeSlot;

      const config = customer.escalationConfig as EscalationConfig | null | undefined;

      if (alert.layer === 'LAYER_1' && isLayerEnabled(timeSlot, 'LAYER_2', config)) {
        const elapsed = now.getTime() - alert.triggeredAt.getTime();
        if (timeSlot === 'OPEN_HOURS' && elapsed >= ESCALATION_WAIT_MS.LAYER_1_TO_2) {
          await escalateToLayer2(alert);
        } else if (timeSlot !== 'OPEN_HOURS') {
          await escalateToLayer2(alert);
        }
      } else if (alert.layer === 'LAYER_2' && isLayerEnabled(timeSlot, 'LAYER_3', config)) {
        const layer2Start = alert.layer2At ?? alert.triggeredAt;
        const elapsed = now.getTime() - layer2Start.getTime();
        if (elapsed >= ESCALATION_WAIT_MS.LAYER_2_TO_3) {
          await escalateToLayer3(alert);
        }
      }
      // Layer 3: geen verdere escalatie
    } catch (err) {
      logger.error('Escalatie fout voor alarm', err as Error, { alertId: alert.id });
    }
  }
}

async function escalateToLayer2(alert: any): Promise<void> {
  const lastLog = await prisma.escalationLog.findFirst({
    where: { alarmId: alert.id, layer: 'LAYER_2' },
    orderBy: { sentAt: 'desc' },
  });
  if (lastLog) {
    logger.debug('Layer 2 al uitgevoerd voor dit alarm', { alertId: alert.id });
    return;
  }

  await prisma.alert.update({
    where: { id: alert.id },
    data: {
      layer: 'LAYER_2',
      status: 'ESCALATING',
      layer2At: new Date(),
    },
  });

  await executeLayer2(alert);
  logger.info('Alarm geëscaleerd naar Layer 2', { alertId: alert.id });
}

async function escalateToLayer3(alert: any): Promise<void> {
  const lastLog = await prisma.escalationLog.findFirst({
    where: { alarmId: alert.id, layer: 'LAYER_3' },
    orderBy: { sentAt: 'desc' },
  });
  if (lastLog) {
    logger.debug('Layer 3 al uitgevoerd voor dit alarm', { alertId: alert.id });
    return;
  }

  await prisma.alert.update({
    where: { id: alert.id },
    data: {
      layer: 'LAYER_3',
      status: 'ESCALATING',
      layer3At: new Date(),
    },
  });

  await executeLayer3(alert);
  logger.info('Alarm geëscaleerd naar Layer 3', { alertId: alert.id });
}

/**
 * Bepaal tijdslot en initiële laag voor een nieuw alarm
 */
export function getInitialEscalationState(customer: {
  openingTime: string;
  closingTime: string;
  nightStart: string;
  escalationConfig?: EscalationConfig | null;
}): { timeSlot: TimeSlot; layer: 'LAYER_1' | 'LAYER_2' | 'LAYER_3' } {
  const timeSlot = getTimeSlot(customer);
  const layer = getInitialLayerForTimeSlot(timeSlot, customer.escalationConfig);
  return { timeSlot, layer };
}
