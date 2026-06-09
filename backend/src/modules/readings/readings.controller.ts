import { Router } from 'express';
import { z } from 'zod';
import { requireDeviceAuth, DeviceRequest } from '../../middleware/deviceAuth';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { alertService } from '../../services/alertService';
import {
  processDoorEvent,
  validateDoorEventPayload,
  validateDoorEventBatchPayload,
  syncDoorStateFromReading,
} from '../../services/doorEventService';
import { CustomError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { anomalyService } from '../../anomaly/anomalyService';

const router = Router();

const readingSchema = z.object({
  temperature: z.number().min(-50).max(50),
  // Optionele 2e PT1000 (verdamper) — carrier v1.1 met dubbele MAX31865.
  // Wordt door firmware als JSON null gestuurd zolang de verdamper-voeler niet
  // aangesloten is, zodat we ondubbelzinnig "geen voeler" kunnen onderscheiden
  // van een waarde van 0 °C. Zod ziet null + .nullable().optional() als geldig.
  evaporatorTemp: z.number().min(-50).max(50).nullable().optional(),
  humidity: z.number().min(0).max(100).nullable().optional(),
  powerStatus: z.boolean().nullable().optional(),
  doorStatus: z.boolean().nullable().optional(),
  // batteryLevel: nullable zodat boards zonder Li-Po ADC (bv. carrier v1.1)
  // null kunnen sturen i.p.v. een sentinel als -1, en backend hen niet
  // weigert met 400.
  batteryLevel: z.number().min(0).max(100).nullable().optional(),
  batteryCharging: z.boolean().nullable().optional(),
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

      // Ruimte/verdamper omwisselen wanneer de voelers fysiek omgekeerd zijn
      // aangesloten (technieker zet dit aan in de app). We draaien de kanalen al
      // bij ingestie om, zodat alles downstream (alarmen, anomalie, grafiek) de
      // juiste voeler gebruikt. Enkel zinvol als beide voelers data leveren.
      let roomTemp = data.temperature;
      let evaporatorTemp = data.evaporatorTemp ?? null;
      const cellSwap = await prisma.device.findUnique({
        where: { id: req.deviceId! },
        select: { coldCell: { select: { sensorsSwapped: true, sensorCount: true } } },
      });
      if (cellSwap?.coldCell?.sensorsSwapped && evaporatorTemp != null) {
        const tmp = roomTemp;
        roomTemp = evaporatorTemp;
        evaporatorTemp = tmp;
      }

      // Bij 1 voeler is de primaire meting altijd de ruimtevoeler. We negeren een
      // eventueel meegestuurde verdamperwaarde, zodat die nooit als ruimte wordt
      // getoond en de zelflerende baseline geen verdamper-as-ruimte oppikt.
      if (cellSwap?.coldCell?.sensorCount === 1) {
        evaporatorTemp = null;
      }

      // Create sensor reading (wordt opgeslagen in de DB van DATABASE_URL, bv. Supabase)
      const reading = await prisma.sensorReading.create({
        data: {
          deviceId: req.deviceId!,
          temperature: roomTemp,
          evaporatorTemp: evaporatorTemp,
          humidity: data.humidity ?? null,
          powerStatus: data.powerStatus ?? true,
          doorStatus: data.doorStatus ?? null,
          batteryLevel: data.batteryLevel ?? null,
          batteryCharging: data.batteryCharging ?? null,
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
        roomTemp,
        req.deviceId!
      );

      // powerStatus mag nu null zijn (board zonder USB-detectie). Skip de
      // alert-check in dat geval i.p.v. een non-null asserrtion.
      // Stroomuitval via readings: alleen detectie bij uitval. Oplossen gebeurt via
      // heartbeat (on_mains) — readings met powerStatus:true mogen geen vals herstel geven.
      if (data.powerStatus === false) {
        await alertService.checkPowerStatus(
          reading.device.coldCellId,
          false,
          req.deviceId!
        );
      }

      if (data.doorStatus !== undefined && data.doorStatus !== null) {
        await alertService.checkDoorStatus(
          reading.device.coldCellId,
          data.doorStatus,
          req.deviceId!
        );
        await syncDoorStateFromReading(req.deviceId!, data.doorStatus);
      }

      // Zelflerende anomaliedetectie (FASE 1) — alleen met 2e voeler (verdamper)
      if (evaporatorTemp != null) {
        const cell = await prisma.coldCell.findUnique({
          where: { id: reading.device.coldCellId },
          select: {
            temperatureMinThreshold: true,
            temperatureMaxThreshold: true,
          },
        });
        if (cell) {
          const setpoint =
            (cell.temperatureMinThreshold + cell.temperatureMaxThreshold) / 2;
          try {
            await anomalyService.processReading({
              coldCellId: reading.device.coldCellId,
              deviceId: req.deviceId!,
              roomTemp: roomTemp,
              evaporatorTemp: evaporatorTemp,
              doorOpen: data.doorStatus === true,
              recordedAt: reading.recordedAt,
              setpointTemp: setpoint,
              tempMaxThreshold: cell.temperatureMaxThreshold,
            });
          } catch (anomalyErr) {
            logger.warn('Anomaliedetectie mislukt (meting wel opgeslagen)', {
              coldCellId: reading.device.coldCellId,
              error: anomalyErr instanceof Error ? anomalyErr.message : String(anomalyErr),
            });
          }
        }
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
 * IoT endpoint: single event {device_id, state, timestamp, seq} OR batch {device_id, events: [...]}
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

      const body = req.body as Record<string, unknown>;
      if (body.events && Array.isArray(body.events)) {
        const { events } = validateDoorEventBatchPayload(req.body);
        for (const payload of events) {
          await processDoorEvent(req.deviceId!, payload);
        }
        return res.status(201).json({ success: true, count: events.length });
      }

      const payload = validateDoorEventPayload(req.body);
      const result = await processDoorEvent(req.deviceId!, payload);

      if (result.duplicate) {
        return res.status(200).json({ success: true, duplicate: true });
      }

      res.status(201).json({ success: true });
    } catch (error) {
      logger.error('Door event failed', error instanceof Error ? error : new Error(String(error)), {
        path: req.path,
        deviceId: req.deviceId,
        bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body as object) : [],
      });
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

/**
 * GET /coldcells/:id/anomaly-findings
 * Bevindingen voor technieker-dashboard (zelflerende detectie FASE 1).
 */
router.get(
  '/coldcells/:id/anomaly-findings',
  requireAuth,
  requireRole('TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const range = req.query.range as string | undefined;
      const validRange =
        range && ['24h', '7d', '30d'].includes(range) ? (range as '24h' | '7d' | '30d') : undefined;

      const coldCell = await prisma.coldCell.findUnique({
        where: { id },
        include: { location: true },
      });

      if (!coldCell) {
        throw new CustomError('Cold cell not found', 404, 'COLD_CELL_NOT_FOUND');
      }

      if (req.userRole === 'TECHNICIAN' && req.technicianId) {
        const customer = await prisma.customer.findUnique({
          where: { id: coldCell.location.customerId },
        });
        if (customer?.linkedTechnicianId !== req.technicianId) {
          throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
        }
      }

      const result = await anomalyService.getFindings(id, validRange);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /coldcells/:id/anomaly-baseline/reset
 * Start zelflerende baseline opnieuw (EWMA + leerperiode).
 */
router.post(
  '/coldcells/:id/anomaly-baseline/reset',
  requireAuth,
  requireRole('TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;

      const coldCell = await prisma.coldCell.findUnique({
        where: { id },
        include: { location: true },
      });

      if (!coldCell) {
        throw new CustomError('Cold cell not found', 404, 'COLD_CELL_NOT_FOUND');
      }

      if (req.userRole === 'TECHNICIAN' && req.technicianId) {
        const customer = await prisma.customer.findUnique({
          where: { id: coldCell.location.customerId },
        });
        if (customer?.linkedTechnicianId !== req.technicianId) {
          throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
        }
      }

      const result = await anomalyService.resetBaseline(id);
      logger.info('Anomalie-baseline gereset', { coldCellId: id, userId: req.userId });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
