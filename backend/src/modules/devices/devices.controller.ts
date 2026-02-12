import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { requireDeviceAuth, DeviceRequest } from '../../middleware/deviceAuth';
import { prisma } from '../../config/database';
import { generateApiKey } from '../../utils/crypto';
import { CustomError } from '../../middleware/errorHandler';

const router = Router();

const deviceSchema = z.object({
  serialNumber: z.string().min(1),
  coldCellId: z.string(),
  firmwareVersion: z.string().optional(),
});

/**
 * POST /devices
 * Create a new device with API key
 */
router.post('/', requireAuth, requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const data = deviceSchema.parse(req.body);

    const coldCell = await prisma.coldCell.findUnique({
      where: { id: data.coldCellId },
      include: { location: true },
    });

    if (!coldCell) {
      throw new CustomError('Cold cell not found', 404, 'COLD_CELL_NOT_FOUND');
    }

    // Klant: eigen cold cells | Technicus: gekoppelde klanten | Admin: alle
    if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
      throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
    }
    if (req.userRole === 'TECHNICIAN') {
      const linked = await prisma.customer.findFirst({
        where: { id: coldCell.location.customerId, linkedTechnicianId: req.technicianId },
      });
      if (!linked) {
        throw new CustomError('Access denied – alleen cold cells van gekoppelde klanten', 403, 'ACCESS_DENIED');
      }
    }

    // Check if serial number already exists
    const existing = await prisma.device.findUnique({
      where: { serialNumber: data.serialNumber },
    });

    if (existing) {
      throw new CustomError('Device with this serial number already exists', 400, 'DUPLICATE_SERIAL');
    }

    // Generate API key for device
    const apiKey = generateApiKey();

    const device = await prisma.device.create({
      data: {
        serialNumber: data.serialNumber,
        coldCellId: data.coldCellId,
        status: 'OFFLINE',
        apiKey,
        firmwareVersion: data.firmwareVersion,
      },
    });

    res.status(201).json({
      ...device,
      apiKey, // Return API key only on creation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /devices/heartbeat
 * Device online/heartbeat - ESP32 meldt zich als ONLINE, met telemetrie
 * Requires x-device-key header. Updates lastSeenAt, status=ONLINE.
 */
router.post(
  '/heartbeat',
  requireDeviceAuth,
  async (req: DeviceRequest, res, next) => {
    try {
      if (!req.deviceId) {
        throw new CustomError('Device ID not found', 400, 'DEVICE_ID_MISSING');
      }

      const { firmwareVersion, ip, rssi, uptime } = req.body || {};

      const updateData: { firmwareVersion?: string; lastSeenAt: Date; status: 'ONLINE' } = {
        lastSeenAt: new Date(),
        status: 'ONLINE',
      };
      if (firmwareVersion && typeof firmwareVersion === 'string') {
        updateData.firmwareVersion = firmwareVersion;
      }

      await prisma.device.update({
        where: { id: req.deviceId },
        data: updateData,
      });

      res.status(200).json({ success: true, status: 'ONLINE' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /devices/coldcell/:coldCellId
 * Get devices for a cold cell
 */
router.get(
  '/coldcell/:coldCellId',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { coldCellId } = req.params;

      const coldCell = await prisma.coldCell.findUnique({
        where: { id: coldCellId },
        include: {
          location: true,
        },
      });

      if (!coldCell) {
        throw new CustomError('Cold cell not found', 404, 'COLD_CELL_NOT_FOUND');
      }

      // Check access
      if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }

      const devices = await prisma.device.findMany({
        where: { coldCellId },
        select: {
          id: true,
          serialNumber: true,
          status: true,
          lastSeenAt: true,
          firmwareVersion: true,
          createdAt: true,
          // Don't return API key for security
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(devices);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /devices/serial/:serialNumber
 * Get device by serial number
 */
router.get(
  '/serial/:serialNumber',
  requireAuth,
  async (req: AuthRequest, res, next) => {
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
        },
      });

      if (!device) {
        throw new CustomError('Device not found', 404, 'DEVICE_NOT_FOUND');
      }

      // Check access
      if (req.userRole === 'CUSTOMER' && device.coldCell.location.customerId !== req.customerId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }

      // Remove API key from response
      const { apiKey, ...deviceWithoutKey } = device;

      res.json(deviceWithoutKey);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /devices/:id/regenerate-key
 * Regenerate API key for a device
 */
router.patch(
  '/:id/regenerate-key',
  requireAuth,
  requireRole('CUSTOMER'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;

      const device = await prisma.device.findUnique({
        where: { id },
        include: {
          coldCell: {
            include: {
              location: true,
            },
          },
        },
      });

      if (!device) {
        throw new CustomError('Device not found', 404, 'DEVICE_NOT_FOUND');
      }

      if (req.userRole === 'CUSTOMER' && device.coldCell.location.customerId !== req.customerId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }

      const newApiKey = generateApiKey();

      const updated = await prisma.device.update({
        where: { id },
        data: { apiKey: newApiKey },
      });

      res.json({
        id: updated.id,
        serialNumber: updated.serialNumber,
        apiKey: newApiKey, // Return new key only on regeneration
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /devices/:id/commands
 * Create a command for a device (e.g., start defrost)
 */
router.post(
  '/:id/commands',
  requireAuth,
  requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const { commandType, parameters } = req.body;

      if (!commandType) {
        throw new CustomError('commandType is required', 400, 'INVALID_INPUT');
      }

      const device = await prisma.device.findUnique({
        where: { id },
        include: {
          coldCell: {
            include: {
              location: true,
            },
          },
        },
      });

      if (!device) {
        throw new CustomError('Device not found', 404, 'DEVICE_NOT_FOUND');
      }

      // Check access
      if (req.userRole === 'CUSTOMER' && device.coldCell.location.customerId !== req.customerId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }

      const command = await prisma.deviceCommand.create({
        data: {
          deviceId: id,
          commandType,
          parameters: parameters || {},
          status: 'PENDING',
          createdBy: req.userId,
        },
      });

      res.status(201).json(command);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /devices/commands/pending
 * Get pending commands for a device (called by ESP32 using device auth)
 * Marks command as EXECUTING when fetched to prevent duplicate execution
 */
router.get(
  '/commands/pending',
  requireDeviceAuth,
  async (req: DeviceRequest, res, next) => {
    try {
      if (!req.deviceId) {
        throw new CustomError('Device ID not found', 400, 'DEVICE_ID_MISSING');
      }

      const command = await prisma.deviceCommand.findFirst({
        where: {
          deviceId: req.deviceId,
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (command) {
        // Immediately mark as EXECUTING to prevent duplicate execution
        await prisma.deviceCommand.update({
          where: { id: command.id },
          data: { status: 'EXECUTING' },
        });
        
        res.json({ commands: [command] });
      } else {
        res.json({ commands: [] });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /devices/commands/:commandId/complete
 * Mark a command as completed (called by ESP32 using device auth)
 */
router.patch(
  '/commands/:commandId/complete',
  requireDeviceAuth,
  async (req: DeviceRequest, res, next) => {
    try {
      const { commandId } = req.params;
      const { result, error } = req.body;

      if (!req.deviceId) {
        throw new CustomError('Device ID not found', 400, 'DEVICE_ID_MISSING');
      }

      const command = await prisma.deviceCommand.findUnique({
        where: { id: commandId },
      });

      if (!command || command.deviceId !== req.deviceId) {
        throw new CustomError('Command not found', 404, 'COMMAND_NOT_FOUND');
      }

      const updated = await prisma.deviceCommand.update({
        where: { id: commandId },
        data: {
          status: error ? 'FAILED' : 'COMPLETED',
          result: result || null,
          error: error || null,
          executedAt: new Date(),
        },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /coldcells/:coldCellId/rs485-status
 * Get RS485 status (temperature, defrost status) for a cold cell
 */
router.get(
  '/coldcells/:coldCellId/rs485-status',
  requireAuth,
  requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { coldCellId } = req.params;

      const coldCell = await prisma.coldCell.findUnique({
        where: { id: coldCellId },
        include: {
          location: true,
          devices: {
            where: {
              status: 'ONLINE',
            },
            take: 1,
            orderBy: {
              lastSeenAt: 'desc',
            },
          },
        },
      });

      if (!coldCell) {
        throw new CustomError('Cold cell not found', 404, 'COLD_CELL_NOT_FOUND');
      }

      // Check access
      if (req.userRole === 'CUSTOMER' && coldCell.location.customerId !== req.customerId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }

      // Get latest command result for RS485 temperature
      const latestTempCommand = await prisma.deviceCommand.findFirst({
        where: {
          device: {
            coldCellId,
          },
          commandType: 'READ_TEMPERATURE',
          status: 'COMPLETED',
        },
        orderBy: {
          executedAt: 'desc',
        },
      });

      const rs485Temperature = latestTempCommand?.result?.temperature || null;

      res.json({
        rs485Temperature,
        deviceOnline: coldCell.devices.length > 0,
        lastUpdate: latestTempCommand?.executedAt || null,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
