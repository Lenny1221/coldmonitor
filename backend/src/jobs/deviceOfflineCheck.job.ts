import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';

/**
 * Background job to check for offline devices (power-loss detection)
 * Runs every 15s via index.ts. Threshold = 30s (3× heartbeat interval).
 */
export async function checkDeviceOfflineJob() {
  try {
    await alertService.checkDeviceOfflineStatus();
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
