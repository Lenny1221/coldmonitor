import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const linkCustomerSchema = z.object({
  customerId: z.string().min(1),
});

/**
 * GET /technicians/search
 * Search technicians by name or email (public endpoint for registration)
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = q.toLowerCase();
    
    const technicians = await prisma.technician.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    res.json(technicians);
  } catch (error) {
    console.error('Search technicians error:', error);
    res.status(500).json({ error: 'Failed to search technicians' });
  }
});

/**
 * GET /technicians
 * Get all technicians (for admin/technician view)
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const technicians = await prisma.technician.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        createdAt: true,
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(technicians);
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});

/**
 * POST /technicians/:id/customers
 * DEPRECATED: Use /api/invitations instead
 * This endpoint is kept for backward compatibility but should use invitations
 */
router.post('/:id/customers', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
  return res.status(410).json({ 
    error: 'This endpoint is deprecated. Please use /api/invitations to send an invitation to the customer.',
    message: 'Customers must accept invitations before being linked.',
  });
});

/**
 * DELETE /technicians/:id/customers/:customerId
 * Unlink a customer from this technician
 */
router.delete('/:id/customers/:customerId', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const technicianId = req.params.id;
    const customerId = req.params.customerId;

    // Verify technician exists and user has access
    if (req.userRole === 'TECHNICIAN' && req.technicianId !== technicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify customer exists and is linked to this technician
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.linkedTechnicianId !== technicianId) {
      return res.status(400).json({ error: 'Customer is not linked to this technician' });
    }

    // Unlink customer and reject any pending invitations between them
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

    res.json({ message: 'Customer unlinked successfully' });
  } catch (error) {
    console.error('Unlink customer error:', error);
    res.status(500).json({ error: 'Failed to unlink customer' });
  }
});

/**
 * GET /technicians/:id/customers
 * Get all customers linked to this technician
 */
router.get('/:id/customers', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const technicianId = req.params.id;

    // Verify user has access
    if (req.userRole === 'TECHNICIAN' && req.technicianId !== technicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const customers = await prisma.customer.findMany({
      where: { linkedTechnicianId: technicianId },
      include: {
        locations: {
          include: {
            coldCells: {
              include: {
                _count: {
                  select: {
                    devices: true,
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
      orderBy: {
        companyName: 'asc',
      },
    });

    res.json(customers);
  } catch (error) {
    console.error('Get technician customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

export default router;
