import { Alert, Customer, Technician } from '@prisma/client';
import { logger } from '../utils/logger';

interface AlertWithRelations extends Alert {
  coldCell?: {
    name: string;
    location?: {
      locationName: string;
      customer?: {
        companyName: string;
        email: string;
        linkedTechnician?: Technician | null;
      };
    };
  };
}

export class NotificationService {
  /**
   * Send alert notification to customer
   */
  async sendCustomerAlert(alert: AlertWithRelations): Promise<void> {
    try {
      const customer = alert.coldCell?.location?.customer;
      
      if (!customer) {
        logger.warn('Cannot send customer alert - customer not found', { alertId: alert.id });
        return;
      }

      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      logger.info('📧 Customer alert notification', {
        alertId: alert.id,
        alertType: alert.type,
        customerEmail: customer.email,
        companyName: customer.companyName,
        coldCellName: alert.coldCell?.name,
      });

      // Example email structure:
      /*
      await emailService.send({
        to: customer.email,
        subject: `Alert: ${alert.type.replace('_', ' ')} - ${alert.coldCell?.name}`,
        template: 'customer-alert',
        data: {
          alertType: alert.type,
          temperature: alert.value,
          threshold: alert.threshold,
          coldCellName: alert.coldCell?.name,
          locationName: alert.coldCell?.location?.locationName,
          triggeredAt: alert.triggeredAt,
        },
      });
      */

      // Mark as notified
      // await prisma.alert.update({
      //   where: { id: alert.id },
      //   data: { notifiedCustomer: true },
      // });
    } catch (error) {
      logger.error('Error sending customer alert', error as Error, { alertId: alert.id });
    }
  }

  /**
   * Send alert notification to technician
   */
  async sendTechnicianAlert(alert: AlertWithRelations): Promise<void> {
    try {
      const technician = alert.coldCell?.location?.customer?.linkedTechnician;
      
      if (!technician) {
        logger.debug('No technician linked to customer', { alertId: alert.id });
        return;
      }

      // TODO: Integrate with email service
      logger.info('📧 Technician alert notification', {
        alertId: alert.id,
        alertType: alert.type,
        technicianEmail: technician.email,
        customerCompany: alert.coldCell?.location?.customer?.companyName,
        coldCellName: alert.coldCell?.name,
      });

      // Example email structure:
      /*
      await emailService.send({
        to: technician.email,
        subject: `Alert: ${alert.type.replace('_', ' ')} - ${alert.coldCell?.location?.customer?.companyName}`,
        template: 'technician-alert',
        data: {
          alertType: alert.type,
          temperature: alert.value,
          threshold: alert.threshold,
          coldCellName: alert.coldCell?.name,
          locationName: alert.coldCell?.location?.locationName,
          customerCompany: alert.coldCell?.location?.customer?.companyName,
          triggeredAt: alert.triggeredAt,
        },
      });
      */

      // Mark as notified
      // await prisma.alert.update({
      //   where: { id: alert.id },
      //   data: { notifiedTechnician: true },
      // });
    } catch (error) {
      logger.error('Error sending technician alert', error as Error, { alertId: alert.id });
    }
  }

  /**
   * Send notification when alert is resolved
   */
  async sendAlertResolvedNotification(alert: AlertWithRelations): Promise<void> {
    try {
      const customer = alert.coldCell?.location?.customer;
      const technician = customer?.linkedTechnician;

      logger.info('📧 Alert resolved notification', {
        alertId: alert.id,
        alertType: alert.type,
        customerEmail: customer?.email,
        technicianEmail: technician?.email,
        resolutionNote: alert.resolutionNote,
      });

      // TODO: Send emails to customer and technician about resolution
    } catch (error) {
      logger.error('Error sending alert resolved notification', error as Error, { alertId: alert.id });
    }
  }

  /**
   * Send system notification to user
   */
  async sendSystemNotification(
    userId: string,
    type: string,
    message: string
  ): Promise<void> {
    try {
      logger.info('📧 System notification', {
        userId,
        type,
        message,
      });

      // TODO: Implement system notifications (in-app, email, push)
      // This could be used for maintenance notices, system updates, etc.
    } catch (error) {
      logger.error('Error sending system notification', error as Error, { userId, type });
    }
  }
}
