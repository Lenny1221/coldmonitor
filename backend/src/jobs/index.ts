/**
 * Background Jobs Index
 * 
 * These jobs should be scheduled using a cron library or task scheduler:
 * - node-cron (for Node.js)
 * - PM2 cron (for production)
 * - AWS EventBridge / CloudWatch Events
 * - Kubernetes CronJobs
 */

import { checkDeviceOfflineJob } from './deviceOfflineCheck.job';
import { generateDailyReportsJob } from './dailyReport.job';
import { escalateAlertsJob } from './alertEscalation.job';

export const jobs = {
  checkDeviceOffline: checkDeviceOfflineJob,
  generateDailyReports: generateDailyReportsJob,
  escalateAlerts: escalateAlertsJob,
};

/**
 * Example cron schedule (using node-cron):
 * 
 * import cron from 'node-cron';
 * 
 * // Check for offline devices every 15 minutes
 * cron.schedule('0/15 * * * *', () => {
 *   jobs.checkDeviceOffline();
 * });
 * 
 * // Generate daily reports at 6 AM
 * cron.schedule('0 6 * * *', () => {
 *   jobs.generateDailyReports();
 * });
 * 
 * // Escalate alerts every hour
 * cron.schedule('0 * * * *', () => {
 *   jobs.escalateAlerts();
 * });
 */
