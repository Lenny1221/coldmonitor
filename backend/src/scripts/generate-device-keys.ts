import { prisma } from '../config/database';
import { generateApiKey } from '../utils/crypto';
import { logger } from '../utils/logger';

/**
 * Script to generate API keys for existing devices that don't have them
 * Run this after migrating the database schema
 */
async function generateDeviceKeys() {
  try {
    logger.info('Generating API keys for devices...');

    const devicesWithoutKeys = await prisma.device.findMany({
      where: {
        OR: [
          { apiKey: null },
          { apiKey: '' },
        ],
      },
    });

    logger.info(`Found ${devicesWithoutKeys.length} devices without API keys`);

    for (const device of devicesWithoutKeys) {
      const apiKey = generateApiKey();
      await prisma.device.update({
        where: { id: device.id },
        data: { apiKey },
      });
      logger.info(`Generated API key for device ${device.serialNumber}: ${apiKey}`);
    }

    logger.info('✅ API key generation completed');
  } catch (error) {
    logger.error('Error generating device keys', error as Error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  generateDeviceKeys()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export default generateDeviceKeys;
