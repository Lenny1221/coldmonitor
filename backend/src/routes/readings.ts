import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest, requireOwnership } from '../middleware/auth';
import { checkAndCreateAlerts } from '../services/alertService';

const router = express.Router();
const prisma = new PrismaClient();

const readingSchema = z.object({
  temperature: z.number(),
  humidity: z.number().optional(),
  powerStatus: z.boolean().optional(),
  doorStatus: z.boolean().optional(),
});

// IoT endpoint: POST sensor readings (device authentication via serial number + API key)
router.post('/devices/:serialNumber/readings', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const data = readingSchema.parse(req.body);

    // Find device by serial number
    const device = await prisma.device.findUnique({
      where: { serialNumber },
      include: {
        coldCell: true,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // TODO: Add API key authentication for devices
    // For now, we'll accept readings from any device

    // Create sensor reading
    const reading = await prisma.sensorReading.create({
      data: {
        deviceId: device.id,
        temperature: data.temperature,
        humidity: data.humidity,
        powerStatus: data.powerStatus ?? true,
        doorStatus: data.doorStatus,
        recordedAt: new Date(),
      },
    });

    // Update device status to ONLINE
    await prisma.device.update({
      where: { id: device.id },
      data: { status: 'ONLINE' },
    });

    // Check for alerts and create if needed
    await checkAndCreateAlerts(device.coldCellId, data.temperature, device.id);

    res.status(201).json(reading);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create reading error:', error);
    res.status(500).json({ error: 'Failed to create reading' });
  }
});

// Get readings for a cold cell
router.get('/coldcells/:id/readings', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = '100' } = req.query;

    // Verify cold cell access
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

    // Get all devices for this cold cell
    const devices = await prisma.device.findMany({
      where: { coldCellId: id },
      select: { id: true },
    });

    const deviceIds = devices.map(d => d.id);

    // Build query
    const where: any = {
      deviceId: { in: deviceIds },
    };

    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) {
        where.recordedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.recordedAt.lte = new Date(endDate as string);
      }
    }

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: {
        recordedAt: 'desc',
      },
      take: parseInt(limit as string),
      include: {
        device: {
          select: {
            id: true,
            serialNumber: true,
          },
        },
      },
    });

    res.json(readings);
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

// Get readings for a specific device
router.get('/devices/:deviceId/readings', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, limit = '100' } = req.query;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        coldCell: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check access
    if (req.userRole === 'CUSTOMER' && device.coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where: any = {
      deviceId,
    };

    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) {
        where.recordedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.recordedAt.lte = new Date(endDate as string);
      }
    }

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: {
        recordedAt: 'desc',
      },
      take: parseInt(limit as string),
    });

    res.json(readings);
  } catch (error) {
    console.error('Get device readings error:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

export default router;
