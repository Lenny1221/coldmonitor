/**
 * Installaties API – CRUD voor koelinstallaties, airco's, etc.
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import {
  calculateCo2Equivalent,
  getMaintenanceFrequency,
  getStrictestFrequency,
  calculateNextMaintenanceDate,
  getMaintenanceBadge,
  isEpbdRequired,
  calculateNextEpbdDate,
} from './maintenanceFrequencyService';
import { CustomError } from '../../middleware/errorHandler';
import { InstallationType } from '@prisma/client';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(InstallationType),
  refrigerantType: z.string().min(1),
  refrigerantKg: z.number().min(0),
  nominalCoolingKw: z.number().min(0).optional(),
  hasLeakDetection: z.boolean().default(false),
  firstUseDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  locationId: z.string().optional(),
  customerId: z.string().optional(),
  technicianIds: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial();

/** GET /installations – lijst installaties (technicus: eigen klanten, admin: alle) */
router.get('/', requireAuth, requireRole('TECHNICIAN', 'ADMIN', 'CUSTOMER'), async (req: AuthRequest, res, next) => {
  try {
    const { customerId, status } = req.query;

    let where: any = {};

    if (req.userRole === 'CUSTOMER' && req.customerId) {
      where.customerId = req.customerId;
    } else if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      where.OR = [
        { assignedTechnicians: { some: { technicianId: req.technicianId } } },
        { customer: { linkedTechnicianId: req.technicianId } },
      ];
    } else if (req.userRole === 'ADMIN' && customerId && typeof customerId === 'string') {
      where.customerId = customerId;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    const installations = await prisma.installation.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true, contactName: true, address: true } },
        location: { select: { id: true, locationName: true, address: true } },
        assignedTechnicians: {
          include: { technician: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { nextMaintenanceDate: 'asc' },
    });

    const withBadge = installations.map((i) => {
      const co2Eq = i.co2EquivalentTon ?? calculateCo2Equivalent(i.refrigerantKg, i.refrigerantType);
      const rules = getMaintenanceFrequency({
        refrigerantKg: i.refrigerantKg,
        co2EquivalentTon: co2Eq,
        nominalCoolingKw: i.nominalCoolingKw ?? undefined,
        installationType: i.type,
        hasLeakDetection: i.hasLeakDetection,
      });
      return {
        ...i,
        maintenanceRules: rules,
        badge: getMaintenanceBadge(i.nextMaintenanceDate),
      };
    });

    res.json(withBadge);
  } catch (e) {
    next(e);
  }
});

/** GET /installations/:id */
router.get('/:id', requireAuth, requireRole('TECHNICIAN', 'ADMIN', 'CUSTOMER'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const inst = await prisma.installation.findUnique({
      where: { id },
      include: {
        customer: true,
        location: true,
        assignedTechnicians: { include: { technician: true } },
        maintenanceSchedules: { orderBy: { scheduledAt: 'desc' }, take: 10 },
        maintenanceReports: { orderBy: { reportDate: 'desc' }, take: 5 },
      },
    });
    if (!inst) throw new CustomError('Installatie niet gevonden', 404, 'NOT_FOUND');

    if (req.userRole === 'CUSTOMER' && inst.customerId !== req.customerId) {
      throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
    }
    if (req.userRole === 'TECHNICIAN') {
      const hasAccess =
        inst.customer.linkedTechnicianId === req.technicianId ||
        inst.assignedTechnicians.some((a) => a.technicianId === req.technicianId);
      if (!hasAccess) throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
    }

    const co2Eq = inst.co2EquivalentTon ?? calculateCo2Equivalent(inst.refrigerantKg, inst.refrigerantType);
    const rules = getMaintenanceFrequency({
      refrigerantKg: inst.refrigerantKg,
      co2EquivalentTon: co2Eq,
      nominalCoolingKw: inst.nominalCoolingKw ?? undefined,
      installationType: inst.type,
      hasLeakDetection: inst.hasLeakDetection,
    });

    res.json({
      ...inst,
      maintenanceRules: rules,
      badge: getMaintenanceBadge(inst.nextMaintenanceDate),
    });
  } catch (e) {
    next(e);
  }
});

/** POST /installations */
router.post('/', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const custId = body.customerId;
    if (!custId) throw new CustomError('customerId vereist', 400, 'MISSING_CUSTOMER');

    if (req.userRole === 'TECHNICIAN') {
      const cust = await prisma.customer.findFirst({
        where: { id: custId, linkedTechnicianId: req.technicianId },
      });
      if (!cust) throw new CustomError('Geen toegang tot deze klant', 403, 'ACCESS_DENIED');
    }

    const co2Eq = calculateCo2Equivalent(body.refrigerantKg, body.refrigerantType);
    const rules = getMaintenanceFrequency({
      refrigerantKg: body.refrigerantKg,
      co2EquivalentTon: co2Eq,
      nominalCoolingKw: body.nominalCoolingKw,
      installationType: body.type,
      hasLeakDetection: body.hasLeakDetection,
    });
    const freqMonths = getStrictestFrequency(rules);
    const firstUse = body.firstUseDate ? new Date(body.firstUseDate) : null;
    const nextMaintenance = calculateNextMaintenanceDate(null, firstUse, freqMonths);
    const nominalKw = body.nominalCoolingKw ?? 0;
    const nextEpbd = isEpbdRequired(body.type, nominalKw)
      ? calculateNextEpbdDate(firstUse, new Date())
      : null;

    const installation = await prisma.installation.create({
      data: {
        name: body.name,
        type: body.type,
        refrigerantType: body.refrigerantType,
        refrigerantKg: body.refrigerantKg,
        co2EquivalentTon: co2Eq,
        nominalCoolingKw: body.nominalCoolingKw,
        hasLeakDetection: body.hasLeakDetection,
        firstUseDate: firstUse,
        nextMaintenanceDate: nextMaintenance,
        nextEpbdDate: nextEpbd,
        locationId: body.locationId,
        customerId: custId,
      },
    });

    if (body.technicianIds?.length) {
      await prisma.installationTechnician.createMany({
        data: body.technicianIds.map((tid) => ({
          installationId: installation.id,
          technicianId: tid,
        })),
        skipDuplicates: true,
      });
    }

    const created = await prisma.installation.findUnique({
      where: { id: installation.id },
      include: {
        customer: { select: { companyName: true } },
        location: { select: { locationName: true } },
        assignedTechnicians: { include: { technician: true } },
      },
    });

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/** PATCH /installations/:id */
router.patch('/:id', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const body = updateSchema.parse(req.body);

    const existing = await prisma.installation.findUnique({
      where: { id },
      include: { customer: true, assignedTechnicians: true },
    });
    if (!existing) throw new CustomError('Installatie niet gevonden', 404, 'NOT_FOUND');

    if (req.userRole === 'TECHNICIAN') {
      const hasAccess =
        existing.customer.linkedTechnicianId === req.technicianId ||
        existing.assignedTechnicians.some((a) => a.technicianId === req.technicianId);
      if (!hasAccess) throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
    }

    const updateData: any = { ...body };
    if (body.refrigerantKg !== undefined || body.refrigerantType !== undefined) {
      const kg = body.refrigerantKg ?? existing.refrigerantKg;
      const type = body.refrigerantType ?? existing.refrigerantType;
      updateData.co2EquivalentTon = calculateCo2Equivalent(kg, type);
    }
    if (body.refrigerantKg !== undefined || body.refrigerantType !== undefined || body.nominalCoolingKw !== undefined || body.hasLeakDetection !== undefined || body.type !== undefined || body.firstUseDate !== undefined) {
      const kg = updateData.refrigerantKg ?? existing.refrigerantKg;
      const type = updateData.type ?? existing.type;
      const co2Eq = updateData.co2EquivalentTon ?? existing.co2EquivalentTon ?? calculateCo2Equivalent(kg, updateData.refrigerantType ?? existing.refrigerantType);
      const nominalKw = updateData.nominalCoolingKw ?? existing.nominalCoolingKw ?? 0;
      const firstUse = updateData.firstUseDate ? new Date(updateData.firstUseDate) : existing.firstUseDate;
      const rules = getMaintenanceFrequency({
        refrigerantKg: kg,
        co2EquivalentTon: co2Eq,
        nominalCoolingKw: nominalKw,
        installationType: type,
        hasLeakDetection: updateData.hasLeakDetection ?? existing.hasLeakDetection,
      });
      const freqMonths = getStrictestFrequency(rules);
      updateData.nextMaintenanceDate = calculateNextMaintenanceDate(
        existing.lastMaintenanceDate,
        firstUse,
        freqMonths
      );
      updateData.nextEpbdDate = isEpbdRequired(type, nominalKw)
        ? calculateNextEpbdDate(firstUse, new Date())
        : null;
    }
    delete updateData.technicianIds;
    delete updateData.customerId;

    const updated = await prisma.installation.update({
      where: { id },
      data: updateData,
    });

    if (body.technicianIds !== undefined) {
      await prisma.installationTechnician.deleteMany({ where: { installationId: id } });
      if (body.technicianIds.length > 0) {
        await prisma.installationTechnician.createMany({
          data: body.technicianIds.map((tid) => ({ installationId: id, technicianId: tid })),
        });
      }
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/** DELETE /installations/:id */
router.delete('/:id', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.installation.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!existing) throw new CustomError('Installatie niet gevonden', 404, 'NOT_FOUND');
    if (req.userRole === 'TECHNICIAN') {
      const assigned = await prisma.installationTechnician.findFirst({
        where: { installationId: id, technicianId: req.technicianId! },
      });
      const hasAccess = existing.customer.linkedTechnicianId === req.technicianId || assigned;
      if (!hasAccess) throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
    }
    await prisma.installation.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
