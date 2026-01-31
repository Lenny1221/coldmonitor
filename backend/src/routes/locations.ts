import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest, requireRole, requireOwnership } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const locationSchema = z.object({
  locationName: z.string().min(1),
  address: z.string().min(1, 'Address is required'),
});

// Get all locations for current customer
router.get('/', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    // Get customerId from token or fetch from database
    let customerId = req.customerId;
    if (!customerId && req.userId) {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.userId },
        select: { id: true },
      });
      if (!customer) {
        return res.status(404).json({ error: 'Customer profile not found' });
      }
      customerId = customer.id;
    }

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const locations = await prisma.location.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        coldCells: {
          include: {
            devices: {
              include: {
                sensorReadings: {
                  orderBy: {
                    recordedAt: 'desc',
                  },
                  take: 1,
                },
              },
            },
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
      orderBy: {
        createdAt: 'desc', // Newest first
      },
    });

    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Get location by ID
router.get('/:id', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        coldCells: {
          include: {
            devices: true,
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
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check access
    if (req.userRole === 'CUSTOMER' && location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      const customer = await prisma.customer.findUnique({
        where: { id: location.customerId },
      });
      if (customer?.linkedTechnicianId !== req.technicianId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(location);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Create location
router.post('/', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    const data = locationSchema.parse(req.body);

    // Get customerId from token or fetch from database
    let customerId = req.customerId;
    if (!customerId && req.userId) {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.userId },
        select: { id: true },
      });
      if (!customer) {
        return res.status(404).json({ error: 'Customer profile not found' });
      }
      customerId = customer.id;
    }

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const location = await prisma.location.create({
      data: {
        locationName: data.locationName,
        address: data.address,
        customerId: customerId,
      },
      include: {
        coldCells: {
          include: {
            devices: {
              include: {
                sensorReadings: {
                  orderBy: {
                    recordedAt: 'desc',
                  },
                  take: 1,
                },
              },
            },
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
    });

    res.status(201).json(location);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    console.error('Create location error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Request customerId:', req.customerId);
    console.error('Request userId:', req.userId);
    res.status(500).json({ 
      error: 'Failed to create location',
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Update location
router.patch('/:id', requireAuth, requireOwnership, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = locationSchema.partial().parse(req.body);

    // Verify ownership
    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (req.userRole === 'CUSTOMER' && location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.location.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Delete location (customer can delete own; technician can delete linked customer's)
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            linkedTechnicianId: true,
          },
        },
      },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (req.userRole === 'CUSTOMER') {
      let customerId = req.customerId;
      if (!customerId && req.userId) {
        const customer = await prisma.customer.findUnique({
          where: { userId: req.userId },
          select: { id: true },
        });
        if (customer) customerId = customer.id;
      }
      if (!customerId || location.customerId !== customerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      if (location.customer?.linkedTechnicianId !== req.technicianId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.location.delete({
      where: { id },
    });

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;
