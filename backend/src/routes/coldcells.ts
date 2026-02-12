import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest, requireRole, requireOwnership } from '../middleware/auth';
import { addSSESubscriber } from '../services/doorEventService';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

const coldCellSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['fridge', 'freezer']),
  temperatureMinThreshold: z.number(),
  temperatureMaxThreshold: z.number(),
  doorAlarmDelaySeconds: z.number().int().min(1).max(3600).optional(), // 1s–1h
});

const settingsSchema = z.object({
  min_temp: z.number().min(-40).max(20),
  max_temp: z.number().min(-40).max(20),
  door_alarm_delay_seconds: z.number().int().min(1).max(3600),
}).refine((data) => data.min_temp < data.max_temp, {
  message: 'Min temperatuur moet lager zijn dan max temperatuur',
  path: ['max_temp'],
});

// Get all cold cells for a location
router.get('/location/:locationId', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { locationId } = req.params;

    // Verify location access
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (req.userRole === 'CUSTOMER' && location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const coldCells = await prisma.coldCell.findMany({
      where: { locationId },
      include: {
        devices: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
          },
        },
        _count: {
          select: {
            alerts: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    res.json(coldCells);
  } catch (error) {
    console.error('Get cold cells error:', error);
    res.status(500).json({ error: 'Failed to fetch cold cells' });
  }
});

// Get cold cell by ID (with latest sensor reading)
router.get('/:id', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const coldCell = await prisma.coldCell.findUnique({
      where: { id },
      include: {
        location: {
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
                contactName: true,
                email: true,
                phone: true,
                address: true,
                linkedTechnicianId: true,
              },
            },
          },
        },
        devices: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
            lastSeenAt: true,
            firmwareVersion: true,
            createdAt: true,
          },
        },
        alerts: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            triggeredAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!coldCell) {
      return res.status(404).json({ error: 'Cold cell not found' });
    }

    // Check access
    if (req.userRole === 'CUSTOMER') {
      if (coldCell.location.customerId !== req.customerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userRole === 'TECHNICIAN') {
      if (!req.technicianId || coldCell.location.customer.linkedTechnicianId !== req.technicianId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get latest sensor reading from any device in this cold cell
    const deviceIds = coldCell.devices.map(d => d.id);
    let latestReading = null;
    let doorState = null; // DeviceState (realtime door) overrides latestReading.doorStatus
    if (deviceIds.length > 0) {
      latestReading = await prisma.sensorReading.findFirst({
        where: { deviceId: { in: deviceIds } },
        orderBy: { recordedAt: 'desc' },
      });
      // Prefer DeviceState for door (real-time) over reading
      doorState = await prisma.deviceState.findFirst({
        where: { deviceId: { in: deviceIds } },
        orderBy: { doorLastChangedAt: 'desc' },
      });
    }

    res.json({
      ...coldCell,
      latestReading,
      doorState: doorState ? {
        doorState: doorState.doorState,
        doorLastChangedAt: doorState.doorLastChangedAt,
        doorOpenCountTotal: doorState.doorOpenCountTotal,
        doorCloseCountTotal: doorState.doorCloseCountTotal,
      } : null,
    });
  } catch (error) {
    console.error('Get cold cell error:', error);
    res.status(500).json({ error: 'Failed to fetch cold cell' });
  }
});

// Create cold cell
router.post('/', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    const data = coldCellSchema.parse(req.body);
    const { locationId } = req.body;

    if (!locationId) {
      return res.status(400).json({ error: 'locationId is required' });
    }

    // Verify location ownership
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const coldCell = await prisma.coldCell.create({
      data: {
        name: data.name,
        type: data.type,
        temperatureMinThreshold: data.temperatureMinThreshold,
        temperatureMaxThreshold: data.temperatureMaxThreshold,
        locationId,
      },
    });

    res.status(201).json(coldCell);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create cold cell error:', error);
    res.status(500).json({ error: 'Failed to create cold cell' });
  }
});

// Update cold cell settings (alarm thresholds + door delay)
router.put('/:id/settings', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = settingsSchema.parse(req.body);

    const coldCell = await prisma.coldCell.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!coldCell) {
      return res.status(404).json({ error: 'Cold cell not found' });
    }

    if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.coldCell.update({
      where: { id },
      data: {
        temperatureMinThreshold: data.min_temp,
        temperatureMaxThreshold: data.max_temp,
        doorAlarmDelaySeconds: data.door_alarm_delay_seconds,
      },
    });

    logger.info('Cold cell settings updated', {
      coldCellId: id,
      userId: req.userId,
      minTemp: data.min_temp,
      maxTemp: data.max_temp,
      doorAlarmDelaySeconds: data.door_alarm_delay_seconds,
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update cold cell settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Update cold cell
router.patch('/:id', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = coldCellSchema.partial().parse(req.body);

    const coldCell = await prisma.coldCell.findUnique({
      where: { id },
      include: {
        location: true,
      },
    });

    if (!coldCell) {
      return res.status(404).json({ error: 'Cold cell not found' });
    }

    if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.coldCell.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update cold cell error:', error);
    res.status(500).json({ error: 'Failed to update cold cell' });
  }
});

// GET cold cell state stream (SSE) - realtime door updates (must be before /:id/state)
router.get('/:id/state/stream', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const coldCell = await prisma.coldCell.findUnique({
      where: { id },
      include: { location: true },
    });
    if (!coldCell) {
      return res.status(404).json({ error: 'Cold cell not found' });
    }
    if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    addSSESubscriber(id, res);
    const deviceIds = (await prisma.device.findMany({ where: { coldCellId: id }, select: { id: true } })).map(d => d.id);
    let doorState = null;
    let doorOpenCountTotal = 0;
    let doorCloseCountTotal = 0;
    if (deviceIds.length > 0) {
      const states = await prisma.deviceState.findMany({
        where: { deviceId: { in: deviceIds } },
        orderBy: { doorLastChangedAt: 'desc' },
      });
      doorState = states[0] || null;
      doorOpenCountTotal = states.reduce((s, r) => s + r.doorOpenCountTotal, 0);
      doorCloseCountTotal = states.reduce((s, r) => s + r.doorCloseCountTotal, 0);
    }
    const payload = JSON.stringify({
      type: 'initial',
      coldCellId: id,
      doorState: doorState ? doorState.doorState : null,
      doorLastChangedAt: doorState?.doorLastChangedAt?.toISOString() ?? null,
      doorOpenCountTotal,
      doorCloseCountTotal,
      doorStatsToday: { opens: doorOpenCountTotal, closes: doorCloseCountTotal, totalOpenSeconds: 0 },
    });
    res.write(`data: ${payload}\n\n`);
    if (typeof (res as any).flush === 'function') (res as any).flush();

    // Keepalive elke 30s (proxies sluiten anders idle verbindingen)
    const keepalive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepalive);
      }
    }, 30000);
    res.on('close', () => clearInterval(keepalive));
  } catch (error) {
    console.error('SSE stream error:', error);
    res.status(500).json({ error: 'Failed to open stream' });
  }
});

// GET cold cell state (door + counters) - for polling fallback
router.get('/:id/state', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const coldCell = await prisma.coldCell.findUnique({
      where: { id },
      include: { location: true, devices: { select: { id: true } } },
    });
    if (!coldCell) {
      return res.status(404).json({ error: 'Cold cell not found' });
    }
    if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const deviceIds = coldCell.devices.map(d => d.id);
    let doorState = null;
    let doorOpenCountTotal = 0;
    let doorCloseCountTotal = 0;
    if (deviceIds.length > 0) {
      const states = await prisma.deviceState.findMany({
        where: { deviceId: { in: deviceIds } },
        orderBy: { doorLastChangedAt: 'desc' },
      });
      doorState = states[0] || null;
      // Gebruik DeviceState (niet DoorStatsDaily) voor tellers
      doorOpenCountTotal = states.reduce((s, r) => s + r.doorOpenCountTotal, 0);
      doorCloseCountTotal = states.reduce((s, r) => s + r.doorCloseCountTotal, 0);
    }
    res.json({
      coldCellId: id,
      doorState: doorState ? {
        doorState: doorState.doorState,
        doorLastChangedAt: doorState.doorLastChangedAt,
        doorOpenCountTotal,
        doorCloseCountTotal,
      } : null,
      doorStatsToday: { opens: doorOpenCountTotal, closes: doorCloseCountTotal, totalOpenSeconds: 0 },
    });
  } catch (error) {
    console.error('Get cold cell state error:', error);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

// Delete cold cell
router.delete('/:id', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const coldCell = await prisma.coldCell.findUnique({
      where: { id },
      include: {
        location: true,
      },
    });

    if (!coldCell) {
      return res.status(404).json({ error: 'Cold cell not found' });
    }

    if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.coldCell.delete({
      where: { id },
    });

    res.json({ message: 'Cold cell deleted successfully' });
  } catch (error) {
    console.error('Delete cold cell error:', error);
    res.status(500).json({ error: 'Failed to delete cold cell' });
  }
});

export default router;
