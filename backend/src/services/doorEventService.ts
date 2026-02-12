import { Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const doorEventSchema = {
  device_id: (v: unknown) => typeof v === 'string',
  state: (v: unknown) => v === 'OPEN' || v === 'CLOSED',
  timestamp: (v: unknown) => typeof v === 'number',
  seq: (v: unknown) => typeof v === 'number',
  rssi: (v: unknown) => v === undefined || typeof v === 'number',
  uptime_ms: (v: unknown) => v === undefined || typeof v === 'number',
};

interface DoorEventPayload {
  device_id: string;
  state: 'OPEN' | 'CLOSED';
  timestamp: number;
  seq: number;
  rssi?: number;
  uptime_ms?: number;
}

// SSE subscribers: coldCellId -> Set of Response objects
const sseSubscribers = new Map<string, Set<Response>>();

export function addSSESubscriber(coldCellId: string, res: Response): void {
  if (!sseSubscribers.has(coldCellId)) {
    sseSubscribers.set(coldCellId, new Set());
  }
  sseSubscribers.get(coldCellId)!.add(res);
  res.on('close', () => {
    sseSubscribers.get(coldCellId)?.delete(res);
  });
}

export function getSSESubscriberCount(coldCellId?: string): number {
  if (coldCellId) {
    return sseSubscribers.get(coldCellId)?.size ?? 0;
  }
  return Array.from(sseSubscribers.values()).reduce((sum, set) => sum + set.size, 0);
}

export async function processDoorEvent(
  deviceId: string,
  payload: DoorEventPayload
): Promise<{ success: boolean; duplicate?: boolean }> {
  const { state, timestamp, seq } = payload;
  const eventTime = new Date(timestamp);

  // Idempotency: (deviceId, seq) unique
  const existing = await prisma.doorEvent.findUnique({
    where: {
      deviceId_seq: { deviceId, seq },
    },
  });
  if (existing) {
    return { success: true, duplicate: true };
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { coldCell: true },
  });
  if (!device) {
    throw new Error('Device not found');
  }

  await prisma.$transaction(async (tx) => {
    // Create DoorEvent
    await tx.doorEvent.create({
      data: {
        deviceId,
        state,
        timestamp: eventTime,
        seq,
      },
    });

    // Upsert DeviceState
    const isOpen = state === 'OPEN';
    const stateData = {
      doorState: state,
      doorLastChangedAt: eventTime,
      doorOpenCountTotal: { increment: isOpen ? 1 : 0 },
      doorCloseCountTotal: { increment: isOpen ? 0 : 1 },
    };

    await tx.deviceState.upsert({
      where: { deviceId },
      create: {
        deviceId,
        doorState: state,
        doorLastChangedAt: eventTime,
        doorOpenCountTotal: isOpen ? 1 : 0,
        doorCloseCountTotal: isOpen ? 0 : 1,
      },
      update: stateData,
    });

    // Update DoorStatsDaily
    const dateKey = new Date(eventTime);
    dateKey.setHours(0, 0, 0, 0);

    await tx.doorStatsDaily.upsert({
      where: {
        deviceId_date: {
          deviceId,
          date: dateKey,
        },
      },
      create: {
        deviceId,
        date: dateKey,
        opens: isOpen ? 1 : 0,
        closes: isOpen ? 0 : 1,
      },
      update: {
        opens: { increment: isOpen ? 1 : 0 },
        closes: { increment: isOpen ? 0 : 1 },
      },
    });
  });

  // Publish to SSE subscribers for this cold cell (incl. counts for direct UI update)
  const subs = sseSubscribers.get(device.coldCellId);
  if (subs && subs.size > 0) {
    const updated = await prisma.deviceState.findUnique({ where: { deviceId } });
    const today = new Date(eventTime);
    today.setHours(0, 0, 0, 0);
    const statsRow = await prisma.doorStatsDaily.findUnique({
      where: { deviceId_date: { deviceId, date: today } },
    });
    const doorStatsToday = statsRow
      ? { opens: statsRow.opens, closes: statsRow.closes, totalOpenSeconds: statsRow.totalOpenSeconds }
      : { opens: 0, closes: 0, totalOpenSeconds: 0 };

    const payload = JSON.stringify({
      type: 'door_state',
      deviceId,
      coldCellId: device.coldCellId,
      doorState: state,
      doorLastChangedAt: eventTime.toISOString(),
      doorOpenCountTotal: updated?.doorOpenCountTotal ?? 0,
      doorCloseCountTotal: updated?.doorCloseCountTotal ?? 0,
      doorStatsToday,
      timestamp: Date.now(),
    });
    subs.forEach((res) => {
      try {
        res.write(`data: ${payload}\n\n`);
      } catch (e) {
        subs.delete(res);
      }
    });
  }

  return { success: true };
}

export function validateDoorEventPayload(body: unknown): DoorEventPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid body');
  }
  const b = body as Record<string, unknown>;
  if (!doorEventSchema.device_id(b.device_id)) throw new Error('device_id required');
  if (!doorEventSchema.state(b.state)) throw new Error('state must be OPEN or CLOSED');
  if (!doorEventSchema.timestamp(b.timestamp)) throw new Error('timestamp required');
  if (!doorEventSchema.seq(b.seq)) throw new Error('seq required');
  return {
    device_id: b.device_id as string,
    state: b.state as 'OPEN' | 'CLOSED',
    timestamp: b.timestamp as number,
    seq: b.seq as number,
    rssi: b.rssi as number | undefined,
    uptime_ms: b.uptime_ms as number | undefined,
  };
}

export function validateDoorEventBatchPayload(body: unknown): { device_id: string; events: DoorEventPayload[] } {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid body');
  }
  const b = body as Record<string, unknown>;
  if (!doorEventSchema.device_id(b.device_id)) throw new Error('device_id required');
  const events = b.events;
  if (!Array.isArray(events) || events.length === 0 || events.length > 32) {
    throw new Error('events must be non-empty array (max 32)');
  }
  const result: DoorEventPayload[] = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e || typeof e !== 'object') throw new Error(`events[${i}] invalid`);
    const ev = e as Record<string, unknown>;
    if (!doorEventSchema.state(ev.state)) throw new Error(`events[${i}].state must be OPEN or CLOSED`);
    if (!doorEventSchema.timestamp(ev.timestamp)) throw new Error(`events[${i}].timestamp required`);
    if (!doorEventSchema.seq(ev.seq)) throw new Error(`events[${i}].seq required`);
    result.push({
      device_id: b.device_id as string,
      state: ev.state as 'OPEN' | 'CLOSED',
      timestamp: ev.timestamp as number,
      seq: ev.seq as number,
      rssi: ev.rssi as number | undefined,
      uptime_ms: ev.uptime_ms as number | undefined,
    });
  }
  return { device_id: b.device_id as string, events: result };
}
