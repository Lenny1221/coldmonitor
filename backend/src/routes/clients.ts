import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  userId: z.string().optional(),
});

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Get all clients (Admin/Technician only)
router.get('/', requireAuth, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    let clients;

    if (req.userRole === 'ADMIN') {
      clients = await prisma.client.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          devices: {
            select: {
              id: true,
              name: true,
              status: true,
              currentTemperature: true,
            },
          },
          _count: {
            select: {
              devices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Technician - only their assigned clients
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
              devices: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  currentTemperature: true,
                },
              },
              _count: {
                select: {
                  devices: true,
                },
              },
            },
          },
        },
      });

      clients = technician?.technicianClients || [];
    }

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client by ID
router.get('/:id', requireAuth, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    let client;

    if (req.userRole === 'TECHNICIAN') {
      // Verify technician has access to this client
      const technician = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: {
          technicianClients: {
            where: { id },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
              devices: {
                include: {
                  alarms: {
                    where: { status: 'ACTIVE' },
                    orderBy: { triggeredAt: 'desc' },
                    take: 10,
                  },
                },
              },
            },
          },
        },
      });

      client = technician?.technicianClients[0];
    } else {
      client = await prisma.client.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          devices: {
            include: {
              alarms: {
                where: { status: 'ACTIVE' },
                orderBy: { triggeredAt: 'desc' },
                take: 10,
              },
            },
          },
        },
      });
    }

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create client (Admin only)
router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createClientSchema.parse(req.body);

    if (!data.userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify user exists and is a customer
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'CUSTOMER') {
      return res.status(400).json({ error: 'User must be a customer' });
    }

    // Check if client already exists for this user
    const existingClient = await prisma.client.findUnique({
      where: { userId: data.userId },
    });

    if (existingClient) {
      return res.status(400).json({ error: 'Client already exists for this user' });
    }

    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        userId: data.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(client);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Client already exists' });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client (Admin only)
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateClientSchema.parse(req.body);

    const client = await prisma.client.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.json(client);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Assign technician to client (Admin only)
router.post('/:id/technicians/:technicianId', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, technicianId } = req.params;

    // Verify technician exists and has TECHNICIAN role
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
    });

    if (!technician || technician.role !== 'TECHNICIAN') {
      return res.status(400).json({ error: 'Invalid technician' });
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Add technician to client (many-to-many relation already set up)
    await prisma.client.update({
      where: { id },
      data: {
        technicians: {
          connect: { id: technicianId },
        },
      },
    });

    res.json({ message: 'Technician assigned successfully' });
  } catch (error) {
    console.error('Error assigning technician:', error);
    res.status(500).json({ error: 'Failed to assign technician' });
  }
});

// Remove technician from client (Admin only)
router.delete('/:id/technicians/:technicianId', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id, technicianId } = req.params;

    await prisma.client.update({
      where: { id },
      data: {
        technicians: {
          disconnect: { id: technicianId },
        },
      },
    });

    res.json({ message: 'Technician removed successfully' });
  } catch (error) {
    console.error('Error removing technician:', error);
    res.status(500).json({ error: 'Failed to remove technician' });
  }
});

export default router;
