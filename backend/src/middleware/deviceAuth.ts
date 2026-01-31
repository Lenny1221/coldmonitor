import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { CustomError } from './errorHandler';
import { logger } from '../utils/logger';

export interface DeviceRequest extends Request {
  deviceId?: string;
  deviceSerial?: string;
  coldCellId?: string;
}

/**
 * Authenticate device using API key from x-device-key header
 */
export const requireDeviceAuth = async (
  req: DeviceRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-device-key'] as string;

    if (!apiKey) {
      throw new CustomError('Device API key required', 401, 'NO_DEVICE_KEY');
    }

    // Find device by API key
    const device = await prisma.device.findUnique({
      where: { apiKey },
      include: {
        coldCell: {
          select: {
            id: true,
            locationId: true,
          },
        },
      },
    });

    if (!device) {
      logger.warn('Invalid device API key attempt', { apiKey: apiKey.substring(0, 8) + '...' });
      throw new CustomError('Invalid device API key', 401, 'INVALID_DEVICE_KEY');
    }

    // Update last seen timestamp and set status to ONLINE
    await prisma.device.update({
      where: { id: device.id },
      data: {
        lastSeenAt: new Date(),
        status: 'ONLINE',
      },
    });

    // Attach device info to request
    req.deviceId = device.id;
    req.deviceSerial = device.serialNumber;
    req.coldCellId = device.coldCellId;

    next();
  } catch (error) {
    next(error);
  }
};
