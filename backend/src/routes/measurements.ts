import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Get measurements for a device
router.get('/device/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, limit = '1000' } = req.query;

    // Verify device exists and user has access
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        client: true,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check permissions
    if (req.userRole === 'CUSTOMER') {
      const client = await prisma.client.findUnique({
        where: { userId: req.userId! },
      });
      if (device.clientId !== client?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userRole === 'TECHNICIAN') {
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            select: { id: true },
          },
        },
      });
      const hasAccess = technician?.technicianClients.some(c => c.id === device.clientId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Build query
    const where: any = { deviceId: device.id };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const measurements = await prisma.measurement.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(measurements);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

// Get latest measurement for a device
router.get('/device/:deviceId/latest', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        client: true,
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check permissions (same as above)
    if (req.userRole === 'CUSTOMER') {
      const client = await prisma.client.findUnique({
        where: { userId: req.userId! },
      });
      if (device.clientId !== client?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userRole === 'TECHNICIAN') {
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            select: { id: true },
          },
        },
      });
      const hasAccess = technician?.technicianClients.some(c => c.id === device.clientId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const measurement = await prisma.measurement.findFirst({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'desc' },
    });

    if (!measurement) {
      return res.status(404).json({ error: 'No measurements found' });
    }

    res.json(measurement);
  } catch (error) {
    console.error('Error fetching latest measurement:', error);
    res.status(500).json({ error: 'Failed to fetch latest measurement' });
  }
});

// Get aggregated stats (min, max, avg) for a device
router.get('/device/:deviceId/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check permissions (same pattern)
    if (req.userRole === 'CUSTOMER') {
      const client = await prisma.client.findUnique({
        where: { userId: req.userId! },
      });
      if (device.clientId !== client?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userRole === 'TECHNICIAN') {
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            select: { id: true },
          },
        },
      });
      const hasAccess = technician?.technicianClients.some(c => c.id === device.clientId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const where: any = { deviceId: device.id };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const measurements = await prisma.measurement.findMany({
      where,
      select: { temperature: true },
    });

    if (measurements.length === 0) {
      return res.json({
        min: null,
        max: null,
        avg: null,
        count: 0,
      });
    }

    const temperatures = measurements.map(m => m.temperature);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

    res.json({
      min,
      max,
      avg: Math.round(avg * 100) / 100,
      count: measurements.length,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
