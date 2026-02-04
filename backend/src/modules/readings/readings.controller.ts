import { Router } from 'express';
import { z } from 'zod';
import { requireDeviceAuth, DeviceRequest } from '../../middleware/deviceAuth';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { alertService } from '../../services/alertService';
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

      // Verify device matches the serial number from auth
      if (req.deviceSerial !== serialNumber) {
        throw new CustomError('Device serial mismatch', 403, 'DEVICE_MISMATCH');
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

export default router;
