import { Router } from 'express';
import { prisma } from '../../config/database';

const router = Router();

/**
 * GET /firmware/latest
 * Returns { version, url } for OTA update. ESP32 checks on boot.
 * No auth - version is public; URL can point to signed/versioned binary.
 */
router.get('/latest', async (_req, res, next) => {
  try {
    // TODO: Store in env or DB - for now return current version (no update)
    const version = process.env.FIRMWARE_LATEST_VERSION ?? '1.0.0';
    const url = process.env.FIRMWARE_OTA_URL ?? null;

    res.json({ version, url });
  } catch (error) {
    next(error);
  }
});

export default router;
