import { logger } from '../utils/logger';
import { runEscalationCron } from '../services/escalationService';

/**
 * Background job: escalatie van actieve alarmen
 * Controleert timers (20 min L1→L2, 15 min L2→L3) en voert notificaties uit.
 * Wordt elke minuut uitgevoerd (via setInterval of externe cron).
 */
export async function escalateAlertsJob() {
  try {
    await runEscalationCron();
    logger.debug('Escalatie-cron uitgevoerd');
  } catch (error) {
    logger.error('Error in alert escalation job', error as Error);
  }
}

// For manual execution or cron scheduling
if (require.main === module) {
  escalateAlertsJob()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
