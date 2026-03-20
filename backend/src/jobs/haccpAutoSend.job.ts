/**
 * HACCP automatisch versturen job
 * Draait dagelijks (bv. 6:00) en verstuurt HACCP-rapporten naar klanten met auto-send ingeschakeld
 */
import { subWeeks, format } from 'date-fns';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { fetchHaccpAuditData, generateHaccpPdf, type HaccpReportParams } from '../modules/reports/haccpReportService';
import { sendEmailWithAttachment } from '../utils/email';
import { logger } from '../utils/logger';

interface HaccpAutoSendConfig {
  enabled?: boolean;
  extraEmails?: string[];
}

export async function haccpAutoSendJob() {
  try {
    logger.info('HACCP auto-send job gestart');

    const customers = await prisma.customer.findMany({
      where: {
        haccpAutoSendConfig: { not: Prisma.DbNull },
      },
      select: {
        id: true,
        companyName: true,
        email: true,
        haccpAutoSendConfig: true,
      },
    });

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = subWeeks(endDate, 1);

    for (const customer of customers) {
      const config = customer.haccpAutoSendConfig as HaccpAutoSendConfig | null;
      if (!config?.enabled) continue;

      const recipients = new Set<string>([customer.email]);
      if (Array.isArray(config.extraEmails)) {
        config.extraEmails.forEach((e) => recipients.add(e));
      }

      try {
        const params: HaccpReportParams = {
          customerId: customer.id,
          startDate,
          endDate,
        };

        const data = await fetchHaccpAuditData(params);
        const pdfBuffer = await generateHaccpPdf(data);

        const filename = `HACCP-audit-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.pdf`;
        const subject = `HACCP-auditrapport ${customer.companyName} – ${format(startDate, 'yyyy-MM-dd')} t/m ${format(endDate, 'yyyy-MM-dd')}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
            <p>Beste ${customer.companyName},</p>
            <p>Hierbij ontvangt u het automatisch gegenereerde HACCP-auditrapport voor de periode.</p>
            <p><strong>Periode:</strong> ${format(startDate, 'dd-MM-yyyy')} t/m ${format(endDate, 'dd-MM-yyyy')}</p>
            <p>Het rapport is bijgevoegd als PDF.</p>
            <p>Met vriendelijke groeten,<br><strong>IntelliFrost</strong></p>
          </div>
        `;

        for (const to of recipients) {
          const ok = await sendEmailWithAttachment(to, subject, html, {
            filename,
            content: pdfBuffer,
          });
          if (ok) {
            logger.info('HACCP auto-send verzonden', { customerId: customer.id, to });
          } else {
            logger.error('HACCP auto-send mislukt', new Error('sendEmailWithAttachment returned false'), { customerId: customer.id, to });
          }
        }
      } catch (err) {
        logger.error('HACCP auto-send fout voor klant', err as Error, { customerId: customer.id });
      }
    }

    logger.info('HACCP auto-send job voltooid');
  } catch (err) {
    logger.error('HACCP auto-send job fout', err as Error);
  }
}
