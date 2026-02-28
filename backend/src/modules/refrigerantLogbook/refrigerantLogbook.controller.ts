/**
 * Koudemiddelen Logboek API – EU 517/2014, NBN EN 378 conform
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { CustomError } from '../../middleware/errorHandler';
import {
  calculateCo2EquivalentTon,
  getLeakCheckFrequencyMonths,
  getLogbookRequirement,
  checkTopUpBan,
  isNameplateRequired,
  getLogbookStatus,
  GWP_TABLE,
} from './refrigerantLogbookService';
import { calculateNextMaintenanceDate } from '../maintenance/maintenanceFrequencyService';
import { RefrigerantLogCategory } from '@prisma/client';

const router = Router();

const logEntrySchema = z.object({
  category: z.nativeEnum(RefrigerantLogCategory),
  performedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T?\d{2}:\d{2}/)),
  technicianName: z.string().min(1),
  technicianCertNr: z.string().optional(),
  notes: z.string().optional(),
  data: z.record(z.any()),
});

/** GET /refrigerant-logbook/gwp – GWP-referentietabel (publiek voor frontend) */
router.get('/gwp', (req, res) => {
  res.json(GWP_TABLE);
});

/** GET /refrigerant-logbook/installations – installaties met logboekstatus (technicus) */
router.get('/installations', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    let where: any = {};
    if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      where.OR = [
        { assignedTechnicians: { some: { technicianId: req.technicianId } } },
        { customer: { linkedTechnicianId: req.technicianId } },
      ];
    }

    const installations = await prisma.installation.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true, address: true } },
        location: { select: { id: true, locationName: true, address: true } },
        refrigerantLogEntries: {
          where: { category: 'LEKCONTROLE' },
          orderBy: { performedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { nextMaintenanceDate: 'asc' },
    });

    const withStatus = installations.map((i) => {
      const co2 = i.co2EquivalentTon ?? calculateCo2EquivalentTon(i.refrigerantKg, i.refrigerantType);
      const leakFreqMonths = getLeakCheckFrequencyMonths(co2, i.hasLeakDetection);
      const lastLeakCheck = (i.refrigerantLogEntries as any[])?.[0];
      const lastLeakDate = lastLeakCheck?.performedAt
        ? new Date(lastLeakCheck.performedAt)
        : i.firstUseDate;
      const nextLeakCheck = lastLeakDate
        ? calculateNextMaintenanceDate(lastLeakDate, null, leakFreqMonths)
        : null;

      const status = getLogbookStatus(nextLeakCheck, co2, i.refrigerantType);
      const logbookReq = getLogbookRequirement(
        i.refrigerantKg,
        co2,
        i.isHermeticallySealed
      );
      const topUpBan = checkTopUpBan(i.refrigerantType, co2);

      return {
        ...i,
        co2EquivalentTon: co2,
        nextLeakCheckDate: nextLeakCheck,
        leakCheckFrequencyMonths: leakFreqMonths,
        logbookStatus: status,
        logbookRequirement: logbookReq,
        topUpBan: topUpBan,
        nameplateRequired: isNameplateRequired(co2),
      };
    });

    res.json(withStatus);
  } catch (e) {
    next(e);
  }
});

/** GET /refrigerant-logbook/installations/:id/entries – logboek per installatie */
router.get(
  '/installations/:id/entries',
  requireAuth,
  requireRole('TECHNICIAN', 'ADMIN', 'CUSTOMER'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const inst = await prisma.installation.findUnique({
        where: { id },
        include: { customer: true },
      });
      if (!inst) throw new CustomError('Installatie niet gevonden', 404, 'NOT_FOUND');

      if (req.userRole === 'CUSTOMER' && inst.customerId !== req.customerId) {
        throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
      }
      if (req.userRole === 'TECHNICIAN') {
        const hasAccess =
          inst.customer.linkedTechnicianId === req.technicianId ||
          (await prisma.installationTechnician.findFirst({
            where: { installationId: id, technicianId: req.technicianId! },
          }));
        if (!hasAccess) throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
      }

      const entries = await prisma.refrigerantLogEntry.findMany({
        where: { installationId: id },
        orderBy: { performedAt: 'desc' },
      });

      const co2 = inst.co2EquivalentTon ?? calculateCo2EquivalentTon(inst.refrigerantKg, inst.refrigerantType);
      const leakFreqMonths = getLeakCheckFrequencyMonths(co2, inst.hasLeakDetection);
      const lastLeak = entries.find((e) => e.category === 'LEKCONTROLE');
      const nextLeakCheck = lastLeak
        ? calculateNextMaintenanceDate(
            new Date((lastLeak as any).performedAt),
            inst.firstUseDate,
            leakFreqMonths
          )
        : null;

      res.json({
        installation: inst,
        entries,
        nextLeakCheckDate: nextLeakCheck,
        leakCheckFrequencyMonths: leakFreqMonths,
      });
    } catch (e) {
      next(e);
    }
  }
);

/** POST /refrigerant-logbook/installations/:id/entries – nieuwe logboekregistratie */
router.post(
  '/installations/:id/entries',
  requireAuth,
  requireRole('TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const body = logEntrySchema.parse(req.body);

      const inst = await prisma.installation.findUnique({
        where: { id },
        include: { customer: true },
      });
      if (!inst) throw new CustomError('Installatie niet gevonden', 404, 'NOT_FOUND');

      const hasAccess =
        inst.customer.linkedTechnicianId === req.technicianId ||
        (await prisma.installationTechnician.findFirst({
          where: { installationId: id, technicianId: req.technicianId! },
        }));
      if (!hasAccess && req.userRole !== 'ADMIN') {
        throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
      }

      const performedAt = new Date(body.performedAt);

      // Bij BIJVULLING: herbereken refrigerantKg en co2EquivalentTon
      let updateInstallation: any = null;
      if (body.category === 'BIJVULLING' && body.data) {
        const d = body.data as any;
        const addKg = Number(d.amountKg) || 0;
        const newKg = inst.refrigerantKg + addKg;
        const newCo2 = calculateCo2EquivalentTon(newKg, inst.refrigerantType);
        updateInstallation = { refrigerantKg: newKg, co2EquivalentTon: newCo2 };
      }

      const entry = await prisma.refrigerantLogEntry.create({
        data: {
          installationId: id,
          category: body.category,
          performedAt,
          technicianName: body.technicianName,
          technicianCertNr: body.technicianCertNr,
          notes: body.notes,
          data: body.data,
          createdByUserId: (req as any).user?.id,
        },
      });

      if (updateInstallation) {
        await prisma.installation.update({
          where: { id },
          data: updateInstallation,
        });
      }

      // Bij LEKCONTROLE: update nextMaintenanceDate
      if (body.category === 'LEKCONTROLE' && body.data) {
        const d = body.data as any;
        const result = d.result;
        if (result === 'GEEN_LEK' || result === 'Geen lek gevonden') {
          const co2 = inst.co2EquivalentTon ?? calculateCo2EquivalentTon(inst.refrigerantKg, inst.refrigerantType);
          const freqMonths = getLeakCheckFrequencyMonths(co2, inst.hasLeakDetection);
          const nextDate = calculateNextMaintenanceDate(performedAt, null, freqMonths);
          await prisma.installation.update({
            where: { id },
            data: { lastMaintenanceDate: performedAt, nextMaintenanceDate: nextDate },
          });
        }
      }

      res.status(201).json(entry);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
