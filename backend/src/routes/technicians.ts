import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const linkCustomerSchema = z.object({
  customerId: z.string().min(1),
});

const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Bedrijfsnaam is verplicht'),
  contactName: z.string().min(1, 'Contactpersoon is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  phone: z.string().optional(),
  address: z.string().optional(),
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationAddress: z.string().optional(),
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
 * Create a new customer without IntelliFrost account and link to technician.
 * For onderhoud, koudemiddel logboek, installaties – klant hoeft geen account te hebben.
 */
router.post('/:id/customers', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const technicianId = req.params.id;
    const data = createCustomerSchema.parse(req.body);

    if (req.userRole === 'TECHNICIAN' && req.technicianId !== technicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existing = await prisma.customer.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return res.status(400).json({
        error: 'Er bestaat al een klant met dit e-mailadres',
        code: 'EMAIL_EXISTS',
      });
    }

    const customer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.create({
        data: {
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone ?? '',
          address: data.address ?? '',
          linkedTechnicianId: technicianId,
          emailVerified: false,
          userId: null,
        },
      });

      if (data.locationName?.trim()) {
        await tx.location.create({
          data: {
            customerId: cust.id,
            locationName: data.locationName.trim(),
            address: data.locationAddress?.trim() || null,
          },
        });
      }

      const result = await tx.customer.findUnique({
        where: { id: cust.id },
        include: { locations: true },
      });
      if (!result) throw new Error('Customer creation failed');
      return result;
    });

    res.status(201).json(customer);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ongeldige gegevens', details: error.errors });
    }
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Klant aanmaken mislukt' });
  }
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
