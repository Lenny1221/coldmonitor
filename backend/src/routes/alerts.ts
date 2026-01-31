import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRole, requireOwnership } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get alerts for current customer
router.get('/', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
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
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alerts for technician (all their customers)
router.get('/technician', requireAuth, requireRole('TECHNICIAN'), async (req: AuthRequest, res) => {
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
          select: {
            id: true,
            name: true,
            type: true,
            location: {
              select: {
                locationName: true,
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
    console.error('Get technician alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert by ID
router.get('/:id', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
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
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Check access
    if (req.userRole === 'CUSTOMER' && alert.coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Resolve alert
router.patch('/:id/resolve', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        coldCell: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Check access
    if (req.userRole === 'CUSTOMER' && alert.coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (alert.status === 'RESOLVED') {
      return res.json(alert);
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

export default router;
