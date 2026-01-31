import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Generate CSV report for a device
router.get('/device/:deviceId/csv', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

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

    const where: any = { deviceId: device.id };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const measurements = await prisma.measurement.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    // Generate CSV
    const csvHeader = 'Timestamp,Temperature (°C)\n';
    const csvRows = measurements.map(m => 
      `${m.timestamp.toISOString()},${m.temperature}`
    ).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="device-${device.deviceId}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});

// Generate summary report (JSON) for a device
router.get('/device/:deviceId/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
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

    const where: any = { deviceId: device.id };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const measurements = await prisma.measurement.findMany({
      where,
    });

    const alarms = await prisma.alarm.findMany({
      where: { deviceId: device.id },
    });

    const temperatures = measurements.map(m => m.temperature);
    const min = measurements.length > 0 ? Math.min(...temperatures) : null;
    const max = measurements.length > 0 ? Math.max(...temperatures) : null;
    const avg = measurements.length > 0
      ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length
      : null;

    res.json({
      device: {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
        client: device.client.user.name,
      },
      period: {
        start: startDate || measurements[0]?.timestamp || null,
        end: endDate || measurements[measurements.length - 1]?.timestamp || null,
      },
      statistics: {
        measurementCount: measurements.length,
        minTemperature: min,
        maxTemperature: max,
        avgTemperature: avg ? Math.round(avg * 100) / 100 : null,
      },
      thresholds: {
        low: device.lowTemperatureThreshold,
        high: device.highTemperatureThreshold,
      },
      alarms: {
        total: alarms.length,
        active: alarms.filter(a => a.status === 'ACTIVE').length,
        resolved: alarms.filter(a => a.status === 'RESOLVED').length,
      },
    });
  } catch (error) {
    console.error('Error generating summary report:', error);
    res.status(500).json({ error: 'Failed to generate summary report' });
  }
});

export default router;
