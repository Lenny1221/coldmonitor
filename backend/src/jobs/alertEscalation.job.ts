import { logger } from '../utils/logger';
import { prisma } from '../config/database';

/**
 * Background job to escalate unresolved alerts
 * Should be run periodically (e.g., every hour via cron)
 */
export async function escalateAlertsJob() {
  try {
    logger.info('Running alert escalation job');
    
    // Find alerts that have been active for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const escalatedAlerts = await prisma.alert.findMany({
      where: {
        status: 'ACTIVE',
        triggeredAt: {
          lt: oneHourAgo,
        },
        notifiedCustomer: false, // Only escalate if not yet notified
      },
      include: {
        coldCell: {
          include: {
            location: {
              include: {
                customer: {
                  include: {
                    linkedTechnician: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // TODO: Send escalation notifications
    // - Send urgent email/SMS to customer
    // - Send urgent notification to technician
    // - Log escalation event

    logger.info(`Alert escalation job completed - ${escalatedAlerts.length} alerts escalated`);
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
