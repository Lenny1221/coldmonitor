import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { alertService } from '../../services/alertService';
import { CustomError } from '../../middleware/errorHandler';

const router = Router();

const resolveAlertSchema = z.object({
  resolutionNote: z.string().optional(),
});

/**
 * GET /alerts
 * Get alerts for current customer
 */
router.get('/', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res, next) => {
  try {
    const { status, type } = req.query;

    const where: any = {
      coldCell: {
        location: {
          customerId: req.customerId!,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        coldCell: {
          select: {
            id: true,
            name: true,
            type: true,
            location: {
              select: {
                locationName: true,
              },
            },
          },
        },
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: 100,
    });

    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /alerts/technician
 * Get all alerts for technician's customers
 */
router.get(
  '/technician',
  requireAuth,
  requireRole('TECHNICIAN', 'ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { status, type } = req.query;

      const where: any = {
        coldCell: {
          location: {
            customer: {
              linkedTechnicianId: req.technicianId!,
            },
          },
        },
      };

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      const alerts = await prisma.alert.findMany({
        where,
        include: {
          coldCell: {
            include: {
              location: {
                include: {
                  customer: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          triggeredAt: 'desc',
        },
        take: 200,
      });

      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /alerts/:id
 * Get alert by ID
 */
router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        coldCell: {
          include: {
            location: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    if (!alert) {
      throw new CustomError('Alert not found', 404, 'ALERT_NOT_FOUND');
    }

    // Check access
    if (req.userRole === 'CUSTOMER' && alert.coldCell.location.customerId !== req.customerId) {
      throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
    }

    if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      if (alert.coldCell.location.customer.linkedTechnicianId !== req.technicianId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }
    }

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /alerts/:id/resolve
 * Resolve an alert
 */
router.patch(
  '/:id/resolve',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const data = resolveAlertSchema.parse(req.body);

      // Get alert and verify access
      const alert = await prisma.alert.findUnique({
        where: { id },
        include: {
          coldCell: {
            include: {
              location: {
                include: {
                  customer: true,
                },
              },
            },
          },
        },
      });

      if (!alert) {
        throw new CustomError('Alert not found', 404, 'ALERT_NOT_FOUND');
      }

      // Check access
      if (req.userRole === 'CUSTOMER' && alert.coldCell.location.customerId !== req.customerId) {
        throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
      }

      if (req.userRole === 'TECHNICIAN' && req.technicianId) {
        if (alert.coldCell.location.customer.linkedTechnicianId !== req.technicianId) {
          throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
        }
      }

      // Resolve alert
      await alertService.resolveAlert(id, data.resolutionNote);

      const updated = await prisma.alert.findUnique({
        where: { id },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
