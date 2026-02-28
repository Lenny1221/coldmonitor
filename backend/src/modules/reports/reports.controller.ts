/**
 * HACCP Audit Report API
 * Endpoints voor audit-data, PDF en Excel download
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import {
  fetchHaccpAuditData,
  generateHaccpPdf,
  generateHaccpExcel,
  type HaccpReportParams,
} from './haccpReportService';
import { CustomError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

const querySchema = z.object({
  customerId: z.string().optional(),
  locationId: z.string().optional(),
  coldCellIds: z.string().optional(), // JSON array of IDs
  startDate: z.string().min(1, 'startDate vereist'),
  endDate: z.string().min(1, 'endDate vereist'),
});

function getEffectiveCustomerId(req: AuthRequest): string {
  if (req.userRole === 'ADMIN' && req.query.customerId) {
    return req.query.customerId as string;
  }
  if (req.userRole === 'TECHNICIAN' && req.query.customerId) {
    return req.query.customerId as string;
  }
  if (req.userRole === 'CUSTOMER' && req.customerId) {
    return req.customerId;
  }
  throw new CustomError('customerId vereist of geen toegang', 400, 'MISSING_CUSTOMER');
}

async function ensureCustomerAccess(req: AuthRequest, customerId: string): Promise<void> {
  if (req.userRole === 'ADMIN') return;

  if (req.userRole === 'CUSTOMER') {
    if (req.customerId !== customerId) {
      throw new CustomError('Geen toegang tot deze klant', 403, 'ACCESS_DENIED');
    }
    return;
  }

  if (req.userRole === 'TECHNICIAN') {
    const linked = await prisma.customer.findFirst({
      where: { id: customerId, linkedTechnicianId: req.technicianId! },
    });
    if (!linked) {
      throw new CustomError('Geen toegang tot deze klant', 403, 'ACCESS_DENIED');
    }
    return;
  }

  throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
}

/**
 * GET /api/reports/haccp/audit-data
 * Haalt audit data op voor preview
 */
router.get(
  '/haccp/audit-data',
  requireAuth,
  requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { customerId, locationId, coldCellIds, startDate, endDate } = querySchema.parse(req.query);
      const custId = getEffectiveCustomerId(req);
      await ensureCustomerAccess(req, custId);

      const coldCellIdsArr = coldCellIds ? (JSON.parse(coldCellIds) as string[]) : undefined;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const params: HaccpReportParams = {
        customerId: custId,
        locationId: locationId as string | undefined,
        coldCellIds: coldCellIdsArr,
        startDate: start,
        endDate: end,
      };

      const data = await fetchHaccpAuditData(params);
      res.json(data);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /api/reports/haccp/pdf
 * Download HACCP rapport als PDF
 */
router.get(
  '/haccp/pdf',
  requireAuth,
  requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { customerId, locationId, coldCellIds, startDate, endDate } = querySchema.parse(req.query);
      const custId = getEffectiveCustomerId(req);
      await ensureCustomerAccess(req, custId);

      const coldCellIdsArr = coldCellIds ? (JSON.parse(coldCellIds) as string[]) : undefined;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const params: HaccpReportParams = {
        customerId: custId,
        locationId: locationId as string | undefined,
        coldCellIds: coldCellIdsArr,
        startDate: start,
        endDate: end,
      };

      const data = await fetchHaccpAuditData(params);
      const pdfBuffer = await generateHaccpPdf(data);

      // Log download
      await prisma.reportDownloadLog.create({
        data: {
          userId: req.userId!,
          customerId: custId,
          format: 'PDF',
          locationId: locationId || null,
          coldCellIds: coldCellIds || null,
          startDate: start,
          endDate: end,
        },
      });

      logger.info('HACCP PDF gedownload', { userId: req.userId, customerId: custId });

      const filename = `HACCP-audit-${params.startDate.toISOString().split('T')[0]}-${params.endDate.toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /api/reports/haccp/excel
 * Download HACCP rapport als Excel
 */
router.get(
  '/haccp/excel',
  requireAuth,
  requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { customerId, locationId, coldCellIds, startDate, endDate } = querySchema.parse(req.query);
      const custId = getEffectiveCustomerId(req);
      await ensureCustomerAccess(req, custId);

      const coldCellIdsArr = coldCellIds ? (JSON.parse(coldCellIds) as string[]) : undefined;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const params: HaccpReportParams = {
        customerId: custId,
        locationId: locationId as string | undefined,
        coldCellIds: coldCellIdsArr,
        startDate: start,
        endDate: end,
      };

      const data = await fetchHaccpAuditData(params);
      const excelBuffer = await generateHaccpExcel(data);

      // Log download
      await prisma.reportDownloadLog.create({
        data: {
          userId: req.userId!,
          customerId: custId,
          format: 'EXCEL',
          locationId: locationId || null,
          coldCellIds: coldCellIds || null,
          startDate: start,
          endDate: end,
        },
      });

      logger.info('HACCP Excel gedownload', { userId: req.userId, customerId: custId });

      const filename = `HACCP-audit-${params.startDate.toISOString().split('T')[0]}-${params.endDate.toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
