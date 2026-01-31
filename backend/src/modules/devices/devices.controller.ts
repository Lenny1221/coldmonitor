import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
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
router.post('/', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res, next) => {
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
      throw new CustomError('Cold cell not found', 404, 'COLD_CELL_NOT_FOUND');
    }

    if (coldCell.location.customerId !== req.customerId) {
      throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
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

export default router;
