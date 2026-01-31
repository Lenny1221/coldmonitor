import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRole, requireOwnership } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /customers/search
 * Search customers by company name, contact name, or email (for technicians)
 */
router.get('/search', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = q.toLowerCase();
    
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        linkedTechnicianId: true,
        linkedTechnician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            locations: true,
          },
        },
      },
      take: 10,
      orderBy: {
        companyName: 'asc',
      },
    });

    res.json(customers);
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Get current customer's own data
router.get('/me', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.customerId! },
      include: {
        linkedTechnician: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
          },
        },
        locations: {
          include: {
            coldCells: {
              include: {
                devices: {
                  select: {
                    id: true,
                    serialNumber: true,
                    status: true,
                  },
                },
                _count: {
                  select: {
                    alerts: {
                      where: {
                        status: 'ACTIVE',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

// Get customer by ID (Technician or Admin only)
router.get('/:id', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Technicians can only access their linked customers
    if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id,
          linkedTechnicianId: req.technicianId,
        },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found or access denied' });
      }
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        linkedTechnician: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
          },
        },
        locations: {
          include: {
            coldCells: {
              include: {
                devices: {
                  select: {
                    id: true,
                    serialNumber: true,
                    status: true,
                  },
                },
                _count: {
                  select: {
                    alerts: {
                      where: {
                        status: 'ACTIVE',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

/**
 * DELETE /customers/me/unlink-technician
 * Customer unlinks themselves from their assigned technician
 */
router.delete('/me/unlink-technician', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    // Get customerId from token or fetch from database if not available
    let customerId = req.customerId;
    if (!customerId && req.userId) {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.userId },
        select: { id: true },
      });
      if (customer) {
        customerId = customer.id;
      }
    }

    if (!customerId) {
      return res.status(403).json({ error: 'Customer ID not found. Please log out and log back in.' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        linkedTechnician: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (!customer.linkedTechnicianId) {
      return res.status(400).json({ error: 'No technician linked to this customer' });
    }

    const technicianId = customer.linkedTechnicianId;

    // Unlink customer and reject any pending invitations
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: { linkedTechnicianId: null },
      }),
      // Reject any pending invitations between this technician and customer
      prisma.invitation.updateMany({
        where: {
          technicianId,
          customerId,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
      }),
    ]);

    res.json({ message: 'Successfully unlinked from technician' });
  } catch (error) {
    console.error('Unlink technician error:', error);
    res.status(500).json({ error: 'Failed to unlink technician' });
  }
});

export default router;
