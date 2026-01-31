import { prisma } from '../config/database';
import { AlertType, AlertStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { NotificationService } from './NotificationService';

export class AlertService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Check temperature thresholds and create/update alerts
   */
  async checkTemperatureAlerts(
    coldCellId: string,
    temperature: number,
    deviceId: string
  ): Promise<void> {
    try {
      const coldCell = await prisma.coldCell.findUnique({
        where: { id: coldCellId },
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
      });

      if (!coldCell) {
        logger.warn('Cold cell not found for alert check', { coldCellId });
        return;
      }

      let alertType: AlertType | null = null;
      let threshold: number | null = null;

      // Check high temperature
      if (temperature > coldCell.temperatureMaxThreshold) {
        alertType = 'HIGH_TEMP';
        threshold = coldCell.temperatureMaxThreshold;
      }
      // Check low temperature
      else if (temperature < coldCell.temperatureMinThreshold) {
        alertType = 'LOW_TEMP';
        threshold = coldCell.temperatureMinThreshold;
      }

      if (alertType) {
        // Check if alert already exists
        const existingAlert = await prisma.alert.findFirst({
          where: {
            coldCellId,
            type: alertType,
            status: 'ACTIVE',
          },
        });

        if (existingAlert) {
          // Update last triggered time (don't spam duplicate alerts)
          await prisma.alert.update({
            where: { id: existingAlert.id },
            data: {
              lastTriggeredAt: new Date(),
              value: temperature,
            },
          });
          logger.debug('Updated existing alert', { alertId: existingAlert.id, alertType });
        } else {
          // Create new alert
          const alert = await prisma.alert.create({
            data: {
              coldCellId,
              type: alertType,
              value: temperature,
              threshold,
              status: 'ACTIVE',
              triggeredAt: new Date(),
              lastTriggeredAt: new Date(),
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

          logger.info('New temperature alert created', { alertId: alert.id, alertType, temperature });

          // Send notifications
          await this.notificationService.sendCustomerAlert(alert);
          await this.notificationService.sendTechnicianAlert(alert);
        }
      } else {
        // Temperature is normal - resolve any active temperature alerts
        await this.resolveTemperatureAlerts(coldCellId);
      }
    } catch (error) {
      logger.error('Error checking temperature alerts', error as Error, {
        coldCellId,
        temperature,
      });
    }
  }

  /**
   * Check power status and create alert if power is lost
   */
  async checkPowerStatus(
    coldCellId: string,
    powerStatus: boolean,
    deviceId: string
  ): Promise<void> {
    try {
      if (!powerStatus) {
        // Check if alert already exists
        const existingAlert = await prisma.alert.findFirst({
          where: {
            coldCellId,
            type: 'POWER_LOSS',
            status: 'ACTIVE',
          },
        });

        if (!existingAlert) {
          const alert = await prisma.alert.create({
            data: {
              coldCellId,
              type: 'POWER_LOSS',
              status: 'ACTIVE',
              triggeredAt: new Date(),
              lastTriggeredAt: new Date(),
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

          logger.warn('Power loss alert created', { alertId: alert.id, coldCellId });

          await this.notificationService.sendCustomerAlert(alert);
          await this.notificationService.sendTechnicianAlert(alert);
        }
      } else {
        // Power restored - resolve power loss alerts
        await prisma.alert.updateMany({
          where: {
            coldCellId,
            type: 'POWER_LOSS',
            status: 'ACTIVE',
          },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolutionNote: 'Power restored',
          },
        });
      }
    } catch (error) {
      logger.error('Error checking power status', error as Error, { coldCellId, powerStatus });
    }
  }

  /**
   * Resolve temperature alerts when values return to normal
   */
  private async resolveTemperatureAlerts(coldCellId: string): Promise<void> {
    try {
      const resolved = await prisma.alert.updateMany({
        where: {
          coldCellId,
          type: { in: ['HIGH_TEMP', 'LOW_TEMP'] },
          status: 'ACTIVE',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNote: 'Temperature returned to normal range',
        },
      });

      if (resolved.count > 0) {
        logger.info('Temperature alerts auto-resolved', { coldCellId, count: resolved.count });
      }
    } catch (error) {
      logger.error('Error resolving temperature alerts', error as Error, { coldCellId });
    }
  }

  /**
   * Check for offline devices and create sensor error alerts
   */
  async checkDeviceOfflineStatus(): Promise<void> {
    try {
      const { config } = await import('../config/env');
      const thresholdMinutes = config.deviceOfflineThresholdMinutes;
      const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);

      // Find devices that are marked ONLINE but haven't sent data recently
      const offlineDevices = await prisma.device.findMany({
        where: {
          status: 'ONLINE',
          OR: [
            { lastSeenAt: null },
            { lastSeenAt: { lt: thresholdTime } },
          ],
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

      for (const device of offlineDevices) {
        // Update device status
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'OFFLINE' },
        });

        // Check if alert already exists
        const existingAlert = await prisma.alert.findFirst({
          where: {
            coldCellId: device.coldCellId,
            type: 'SENSOR_ERROR',
            status: 'ACTIVE',
          },
        });

        if (!existingAlert) {
          const alert = await prisma.alert.create({
            data: {
              coldCellId: device.coldCellId,
              type: 'SENSOR_ERROR',
              status: 'ACTIVE',
              triggeredAt: new Date(),
              lastTriggeredAt: new Date(),
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

          logger.warn('Device offline alert created', {
            alertId: alert.id,
            deviceId: device.id,
            serialNumber: device.serialNumber,
          });

          await this.notificationService.sendCustomerAlert(alert);
          await this.notificationService.sendTechnicianAlert(alert);
        }
      }
    } catch (error) {
      logger.error('Error checking device offline status', error as Error);
    }
  }

  /**
   * Manually resolve an alert
   */
  async resolveAlert(alertId: string, resolutionNote?: string): Promise<void> {
    try {
      const alert = await prisma.alert.update({
        where: { id: alertId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNote: resolutionNote || 'Manually resolved',
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

      logger.info('Alert resolved', { alertId, type: alert.type });

      // Send notification about resolution
      await this.notificationService.sendAlertResolvedNotification(alert);
    } catch (error) {
      logger.error('Error resolving alert', error as Error, { alertId });
      throw error;
    }
  }
}

export const alertService = new AlertService();
