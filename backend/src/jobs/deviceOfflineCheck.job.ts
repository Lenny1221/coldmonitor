import { alertService } from '../services/AlertService';
import { logger } from '../utils/logger';

/**
 * Background job to check for offline devices
 * Should be run periodically (e.g., every 15 minutes via cron)
 */
export async function checkDeviceOfflineJob() {
  try {
    logger.info('Running device offline check job');
    await alertService.checkDeviceOfflineStatus();
    logger.info('Device offline check job completed');
  } catch (error) {
    logger.error('Error in device offline check job', error as Error);
  }
}

// For manual execution or cron scheduling
if (require.main === module) {
  checkDeviceOfflineJob()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
