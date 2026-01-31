import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest, requireRole, requireOwnership } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const deviceSchema = z.object({
  serialNumber: z.string().min(1),
  coldCellId: z.string(),
});

// Get devices for a cold cell
router.get('/coldcell/:coldCellId', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { coldCellId } = req.params;

    const coldCell = await prisma.coldCell.findUnique({
      where: { id: coldCellId },
      include: {
        location: true,
      },
    });

    if (!coldCell) {
      return res.status(404).json({ error: 'Cold cell not found' });
    }

    // Check access
    if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const devices = await prisma.device.findMany({
      where: { coldCellId },
      include: {
        sensorReadings: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get device by serial number
router.get('/serial/:serialNumber', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { serialNumber } = req.params;

    const device = await prisma.device.findUnique({
      where: { serialNumber },
      include: {
        coldCell: {
          include: {
            location: {
              include: {
                customer: true,
              },
            },
          },
        },
        sensorReadings: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 100,
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

    res.json(device);
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Create device
router.post('/', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    const data = deviceSchema.parse(req.body);

    // Verify cold cell ownership
    const coldCell = await prisma.coldCell.findUnique({
      where: { id: data.coldCellId },
      include: {
        location: true,
      },
    });

    if (!coldCell) {
      return res.status(404).json({ error: 'Cold cell not found' });
    }

    if (coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if serial number already exists
    const existing = await prisma.device.findUnique({
      where: { serialNumber: data.serialNumber },
    });

    if (existing) {
      return res.status(400).json({ error: 'Device with this serial number already exists' });
    }

    const device = await prisma.device.create({
      data: {
        serialNumber: data.serialNumber,
        coldCellId: data.coldCellId,
        status: 'OFFLINE',
      },
    });

    res.status(201).json(device);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Device serial number already exists' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// Update device status (for IoT devices to report online/offline)
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // This endpoint can be called by devices with API key authentication
    // For now, we'll allow authenticated users or implement API key auth later
    const device = await prisma.device.update({
      where: { id },
      data: { status },
    });

    res.json(device);
  } catch (error) {
    console.error('Update device status error:', error);
    res.status(500).json({ error: 'Failed to update device status' });
  }
});

export default router;
