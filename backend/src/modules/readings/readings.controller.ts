import { Router } from 'express';
import { z } from 'zod';
import { requireDeviceAuth, DeviceRequest } from '../../middleware/deviceAuth';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { alertService } from '../../services/alertService';
import {
  processDoorEvent,
  validateDoorEventPayload,
} from '../../services/doorEventService';
import { CustomError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

const readingSchema = z.object({
  temperature: z.number().min(-50).max(50),
  humidity: z.number().min(0).max(100).optional(),
  powerStatus: z.boolean().optional(),
  doorStatus: z.boolean().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

/**
 * POST /devices/:serial/readings
 * IoT endpoint for device data ingestion
 */
router.post(
  '/devices/:serialNumber/readings',
  requireDeviceAuth,
  async (req: DeviceRequest, res, next) => {
    try {
      const { serialNumber } = req.params;
      const data = readingSchema.parse(req.body);

      // Device is already identified by API key (requireDeviceAuth). Use that device;
      // URL serial is only informational (ESP32 may send deviceId from config).
      if (req.deviceSerial !== serialNumber) {
        logger.warn('URL serial differs from device key', {
          urlSerial: serialNumber,
          deviceSerial: req.deviceSerial,
          deviceId: req.deviceId,
        });
      }

      // Create sensor reading (wordt opgeslagen in de DB van DATABASE_URL, bv. Supabase)
      const reading = await prisma.sensorReading.create({
        data: {
          deviceId: req.deviceId!,
          temperature: data.temperature,
          humidity: data.humidity ?? null,
          powerStatus: data.powerStatus ?? true,
          doorStatus: data.doorStatus ?? null,
          batteryLevel: data.batteryLevel ?? null,
          recordedAt: new Date(),
        },
        include: {
          device: {
            select: {
              coldCellId: true,
            },
          },
        },
      });

      logger.info('Sensor reading opgeslagen in DB', {
        readingId: reading.id,
        deviceId: req.deviceId,
        serialNumber,
        temperature: data.temperature,
      });

      // Immediately check for alerts
      await alertService.checkTemperatureAlerts(
        reading.device.coldCellId,
        data.temperature,
        req.deviceId!
      );

      if (data.powerStatus !== undefined) {
        await alertService.checkPowerStatus(
          reading.device.coldCellId,
          data.powerStatus,
          req.deviceId!
        );
      }

      if (data.doorStatus !== undefined && data.doorStatus !== null) {
        await alertService.checkDoorStatus(
          reading.device.coldCellId,
          data.doorStatus,
          req.deviceId!
        );
      }

      logger.debug('Sensor reading received', {
        deviceId: req.deviceId,
        serialNumber,
        temperature: data.temperature,
      });

      res.status(201).json({
        success: true,
        reading: {
          id: reading.id,
          temperature: reading.temperature,
          recordedAt: reading.recordedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /devices/:serialNumber/door-events
 * IoT endpoint: immediate door open/close event (with debounce on device)
 */
router.post(
  '/devices/:serialNumber/door-events',
  requireDeviceAuth,
  async (req: DeviceRequest, res, next) => {
    try {
      const { serialNumber } = req.params;
      if (req.deviceSerial !== serialNumber) {
        logger.warn('Door event: URL serial differs from device key', {
          urlSerial: serialNumber,
          deviceSerial: req.deviceSerial,
        });
      }

      const payload = validateDoorEventPayload(req.body);
      const result = await processDoorEvent(req.deviceId!, payload);

      if (result.duplicate) {
        return res.status(200).json({ success: true, duplicate: true });
      }

      res.status(201).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /coldcells/:id/readings
 * Get readings for a cold cell with aggregation
 */
router.get(
  '/coldcells/:id/readings',
  requireAuth,
  requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const { range = '24h' } = req.query;

      if (!['24h', '7d', '30d'].includes(range as string)) {
        throw new CustomError('Invalid range. Use: 24h, 7d, or 30d', 400, 'INVALID_RANGE');
      }

      // Verify access to cold cell
      const coldCell = await prisma.coldCell.findUnique({
        where: { id },
        include: {
          location: true,
        },
      });

      if (!coldCell) {
        throw new CustomError('Cold cell not found', 404, 'COLD_CELL_NOT_FOUND');
      }

      // Check access permissions
      if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }

      if (req.userRole === 'TECHNICIAN' && req.technicianId) {
        const customer = await prisma.customer.findUnique({
          where: { id: coldCell.location.customerId },
        });
        if (customer?.linkedTechnicianId !== req.technicianId) {
          throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
        }
      }

      // Get aggregated data
      const { dataAggregationService } = await import('../../services/DataAggregationService');
      const result = await dataAggregationService.getAggregatedReadings(
        id,
        range as '24h' | '7d' | '30d'
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /coldcells/:id/door-events
 * Get door open/close events count per day
 */
router.get(
  '/coldcells/:id/door-events',
  requireAuth,
  requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const { days = '1' } = req.query;
      const daysCount = parseInt(days as string, 10) || 1;

      // Verify access to cold cell
      const coldCell = await prisma.coldCell.findUnique({
        where: { id },
        include: {
          location: true,
        },
      });

      if (!coldCell) {
        throw new CustomError('Cold cell not found', 404, 'COLD_CELL_NOT_FOUND');
      }

      // Check access permissions
      if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }

      if (req.userRole === 'TECHNICIAN' && req.technicianId) {
        const customer = await prisma.customer.findUnique({
          where: { id: coldCell.location.customerId },
        });
        if (customer?.linkedTechnicianId !== req.technicianId) {
          throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
        }
      }

      // Get all devices for this cold cell
      const devices = await prisma.device.findMany({
        where: { coldCellId: id },
        select: { id: true },
      });

      if (devices.length === 0) {
        return res.json({ eventsPerDay: [], totalEvents: 0 });
      }

      const deviceIds = devices.map(d => d.id);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);
      startDate.setHours(0, 0, 0, 0);

      // Prefer DoorStatsDaily when available (from door-events API)
      const dailyStats = await prisma.doorStatsDaily.findMany({
        where: {
          deviceId: { in: deviceIds },
          date: { gte: startDate },
        },
      });

      const eventsPerDay = new Map<string, { opens: number; closes: number }>();
      for (const row of dailyStats) {
        const dayKey = row.date.toISOString().split('T')[0];
        const current = eventsPerDay.get(dayKey) || { opens: 0, closes: 0 };
        current.opens += row.opens;
        current.closes += row.closes;
        eventsPerDay.set(dayKey, current);
      }

      // Fallback: use SensorReading doorStatus if no DoorStatsDaily
      if (eventsPerDay.size === 0) {
        const readings = await prisma.sensorReading.findMany({
          where: {
            deviceId: { in: deviceIds },
            recordedAt: { gte: startDate },
            doorStatus: { not: null },
          },
          orderBy: { recordedAt: 'asc' },
          select: { doorStatus: true, recordedAt: true },
        });
        let previousStatus: boolean | null = null;
        for (const reading of readings) {
          const dayKey = reading.recordedAt.toISOString().split('T')[0];
          if (!eventsPerDay.has(dayKey)) eventsPerDay.set(dayKey, { opens: 0, closes: 0 });
          const dayEvents = eventsPerDay.get(dayKey)!;
          if (previousStatus !== null && previousStatus !== reading.doorStatus) {
            if (reading.doorStatus === true) dayEvents.opens++;
            else dayEvents.closes++;
          }
          previousStatus = reading.doorStatus ?? null;
        }
      }

      const eventsArray = Array.from(eventsPerDay.entries()).map(([date, events]) => ({
        date,
        opens: events.opens,
        closes: events.closes,
        total: events.opens + events.closes,
      }));

      const totalEvents = eventsArray.reduce((sum, day) => sum + day.total, 0);

      res.json({
        eventsPerDay: eventsArray.sort((a, b) => a.date.localeCompare(b.date)),
        totalEvents,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
