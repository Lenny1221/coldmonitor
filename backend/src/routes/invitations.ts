import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const createInvitationSchema = z.object({
  customerId: z.string().min(1),
  message: z.string().optional(),
});

/**
 * POST /invitations
 * Send an invitation to a customer (Technician only)
 */
router.post('/', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const technicianId = req.technicianId!;
    const data = createInvitationSchema.parse(req.body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      include: { linkedTechnician: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer is already linked to this technician
    if (customer.linkedTechnicianId === technicianId) {
      return res.status(400).json({ error: 'Customer is already linked to you' });
    }

    // Check if there's already a pending invitation (enforce uniqueness for pending only)
    const existingPendingInvitation = await prisma.invitation.findFirst({
      where: {
        technicianId,
        customerId: data.customerId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingPendingInvitation) {
      return res.status(400).json({ error: 'A pending invitation already exists for this customer' });
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        technicianId,
        customerId: data.customerId,
        message: data.message,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

/**
 * GET /invitations
 * Get invitations (filtered by role)
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.userRole === 'CUSTOMER') {
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

      // Customers see all invitations sent to them
      const invitations = await prisma.invitation.findMany({
        where: {
          customerId: customerId,
        },
        include: {
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
      });

      res.json(invitations);
    } else if (req.userRole === 'TECHNICIAN' || req.userRole === 'ADMIN') {
      // Get technicianId from token or fetch from database if not available
      let technicianId = req.technicianId;
      if (!technicianId && req.userId) {
        const technician = await prisma.technician.findUnique({
          where: { userId: req.userId },
          select: { id: true },
        });
        if (technician) {
          technicianId = technician.id;
        }
      }

      if (!technicianId) {
        return res.status(403).json({ error: 'Technician ID not found. Please log out and log back in.' });
      }

      // Technicians see all invitations they sent (including rejected/accepted)
      const invitations = await prisma.invitation.findMany({
        where: {
          technicianId: technicianId,
        },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              email: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
      });

      res.json(invitations);
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

/**
 * PATCH /invitations/:id/accept
 * Accept an invitation (Customer only)
 */
router.patch('/:id/accept', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    const invitationId = req.params.id;

    // Get customerId from token or fetch from database if not available
    let customerId = req.customerId;
    if (!customerId && req.userId) {
      try {
        const customer = await prisma.customer.findUnique({
          where: { userId: req.userId },
          select: { id: true },
        });
        if (customer) {
          customerId = customer.id;
        } else {
          console.error('Customer not found for userId:', req.userId);
          return res.status(403).json({ error: 'Customer profile not found. Please contact support.' });
        }
      } catch (dbError: any) {
        console.error('Database error fetching customer:', dbError);
        return res.status(500).json({ error: 'Database error. Please try again.' });
      }
    }

    if (!customerId) {
      console.error('Customer ID not found:', { customerId: req.customerId, userId: req.userId });
      return res.status(403).json({ error: 'Customer ID not found. Please log out and log back in.' });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        customer: {
          include: {
            linkedTechnician: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        technician: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Verify customer owns this invitation
    if (invitation.customerId !== customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: `Invitation has already been ${invitation.status.toLowerCase()}` });
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' },
      });
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if customer is already linked to another technician
    if (invitation.customer.linkedTechnicianId && invitation.customer.linkedTechnicianId !== invitation.technicianId) {
      const currentTechnician = invitation.customer.linkedTechnician;
      return res.status(400).json({ 
        error: 'You are already linked to another technician',
        currentTechnician: currentTechnician?.name || 'Unknown',
      });
    }

    // Accept invitation: link customer to technician
    // Also reject any other pending invitations for this customer
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: invitation.customerId },
        data: { linkedTechnicianId: invitation.technicianId },
      }),
      prisma.invitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      }),
      // Reject other pending invitations for this customer
      prisma.invitation.updateMany({
        where: {
          customerId: invitation.customerId,
          id: { not: invitationId },
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
      }),
    ]);

    // Fetch updated invitation to return
    const updatedInvitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Invitation accepted successfully',
      invitation: updatedInvitation,
    });
  } catch (error: any) {
    console.error('Accept invitation error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      customerId: req.customerId,
      userId: req.userId,
      invitationId: req.params.id,
    });
    res.status(500).json({ 
      error: 'Failed to accept invitation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * PATCH /invitations/:id/reject
 * Reject an invitation (Customer only)
 */
router.patch('/:id/reject', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res) => {
  try {
    const invitationId = req.params.id;

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

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Verify customer owns this invitation
    if (invitation.customerId !== customerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: `Invitation has already been ${invitation.status.toLowerCase()}` });
    }

    // Reject invitation
    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    res.json({
      message: 'Invitation rejected',
    });
  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).json({ error: 'Failed to reject invitation' });
  }
});

/**
 * DELETE /invitations/:id
 * Cancel an invitation (Technician only)
 */
router.delete('/:id', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const invitationId = req.params.id;

    // Get technicianId from token or fetch from database if not available
    let technicianId = req.technicianId;
    if (!technicianId && req.userId) {
      const technician = await prisma.technician.findUnique({
        where: { userId: req.userId },
        select: { id: true },
      });
      if (technician) {
        technicianId = technician.id;
      }
    }

    if (!technicianId) {
      return res.status(403).json({ error: 'Technician ID not found. Please log out and log back in.' });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Verify technician owns this invitation
    if (invitation.technicianId !== technicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow canceling pending invitations
    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Can only cancel pending invitations',
        currentStatus: invitation.status,
      });
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error: any) {
    console.error('Cancel invitation error:', {
      message: error.message,
      stack: error.stack,
      technicianId: req.technicianId,
      userId: req.userId,
      invitationId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

export default router;
