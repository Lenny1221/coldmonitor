/**
 * Tickets API – Supporttickets en onderhoudsaanvragen
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { sendEmail } from '../../utils/email';
import { config } from '../../config/env';
import { CustomError } from '../../middleware/errorHandler';
import { TicketType, TicketStatus, TicketUrgency } from '@prisma/client';

const router = Router();
const frontendUrl = config.frontendUrl;

const createTicketSchema = z.object({
  type: z.nativeEnum(TicketType),
  urgency: z.nativeEnum(TicketUrgency).default('NORMAAL'),
  description: z.string().min(1),
  installationId: z.string().optional(),
  proposedSlots: z.array(
    z.object({
      slotIndex: z.number().min(1).max(3),
      date: z.string(),
      preference: z.enum(['OCHTEND', 'NAMIDDAG', 'AVOND']),
    })
  ).min(1).max(3),
});

const updateTicketSchema = createTicketSchema.partial();

/** GET /tickets – lijst tickets */
router.get('/', requireAuth, requireRole('TECHNICIAN', 'ADMIN', 'CUSTOMER'), async (req: AuthRequest, res, next) => {
  try {
    let where: any = {};

    if (req.userRole === 'CUSTOMER' && req.customerId) {
      where.customerId = req.customerId;
    } else if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      where.customer = { linkedTechnicianId: req.technicianId };
    }

    const { status } = req.query;
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true, contactName: true, email: true, address: true } },
        installation: { select: { id: true, name: true } },
        proposedSlots: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tickets);
  } catch (e) {
    next(e);
  }
});

/** GET /tickets/:id */
router.get('/:id', requireAuth, requireRole('TECHNICIAN', 'ADMIN', 'CUSTOMER'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        installation: true,
        proposedSlots: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!ticket) throw new CustomError('Ticket niet gevonden', 404, 'NOT_FOUND');

    if (req.userRole === 'CUSTOMER' && ticket.customerId !== req.customerId) {
      throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
    }
    if (req.userRole === 'TECHNICIAN') {
      const cust = await prisma.customer.findUnique({
        where: { id: ticket.customerId },
        select: { linkedTechnicianId: true },
      });
      if (cust?.linkedTechnicianId !== req.technicianId) {
        throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
      }
    }

    res.json(ticket);
  } catch (e) {
    next(e);
  }
});

/** POST /tickets – klant dient ticket in */
router.post('/', requireAuth, requireRole('CUSTOMER'), async (req: AuthRequest, res, next) => {
  try {
    const customerId = req.customerId!;
    const body = createTicketSchema.parse(req.body);

    if (body.installationId) {
      const inst = await prisma.installation.findFirst({
        where: { id: body.installationId, customerId },
      });
      if (!inst) throw new CustomError('Installatie niet gevonden of geen toegang', 400, 'INVALID_INSTALLATION');
    }

    const ticket = await prisma.ticket.create({
      data: {
        type: body.type,
        urgency: body.urgency,
        description: body.description,
        installationId: body.installationId,
        customerId,
        proposedSlots: {
          create: body.proposedSlots.map((s) => ({
            slotIndex: s.slotIndex,
            date: new Date(s.date),
            preference: s.preference,
          })),
        },
      },
      include: {
        customer: true,
        installation: true,
        proposedSlots: true,
      },
    });

    await prisma.ticketStatusLog.create({
      data: { ticketId: ticket.id, status: 'NIEUW', note: 'Ticket ingediend' },
    });

    // E-mail naar technicus
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { linkedTechnician: true },
    });
    const technician = customer?.linkedTechnician;
    if (technician?.email) {
      const slotLines = ticket.proposedSlots
        .map(
          (s) =>
            `- ${s.date.toLocaleDateString('nl-BE')} (${s.preference}) – <a href="${frontendUrl}/technician/tickets?confirm=${ticket.id}&slot=${s.slotIndex}">Bevestig tijdstip ${s.slotIndex}</a>`
        )
        .join('<br>');
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <p>Beste ${technician.name},</p>
          <p>Er is een nieuw ticket binnengekomen van <strong>${customer?.companyName}</strong>.</p>
          <p><strong>Type:</strong> ${body.type}<br>
          <strong>Ernst:</strong> ${body.urgency}<br>
          <strong>Installatie:</strong> ${ticket.installation?.name ?? '-'}</p>
          <p><strong>Beschrijving:</strong><br>${body.description}</p>
          <p><strong>Voorgestelde tijdsvakken:</strong><br>${slotLines}</p>
          <p><a href="${frontendUrl}/technician/tickets">Bekijk ticket in dashboard</a></p>
          <p>Met vriendelijke groeten,<br>IntelliFrost</p>
        </div>
      `;
      await sendEmail(technician.email, `Nieuw ticket: ${body.type} – ${customer?.companyName}`, html);
    }

    res.status(201).json(ticket);
  } catch (e) {
    next(e);
  }
});

/** PATCH /tickets/:id – klant past ticket aan of annuleert */
router.patch('/:id', requireAuth, requireRole('CUSTOMER', 'TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { cancel, ...body } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { proposedSlots: true },
    });
    if (!ticket) throw new CustomError('Ticket niet gevonden', 404, 'NOT_FOUND');

    // Klant: alleen eigen tickets
    if (req.userRole === 'CUSTOMER') {
      if (ticket.customerId !== req.customerId) throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
    } else if (req.userRole === 'TECHNICIAN') {
      const cust = await prisma.customer.findUnique({
        where: { id: ticket.customerId },
        select: { linkedTechnicianId: true },
      });
      if (cust?.linkedTechnicianId !== req.technicianId) throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
    }

    // Aanpassen: alleen wanneer NIEUW, IN_BEHANDELING of INGEPLAND (niet bij cancel)
    if (!cancel && !['NIEUW', 'IN_BEHANDELING', 'INGEPLAND'].includes(ticket.status)) {
      throw new CustomError('Ticket kan niet meer worden aangepast', 400, 'INVALID_STATUS');
    }

    // Annuleren (alleen als nog niet afgerond)
    if (cancel === true) {
      if (!['NIEUW', 'IN_BEHANDELING', 'INGEPLAND'].includes(ticket.status)) {
        throw new CustomError('Dit ticket kan niet meer worden geannuleerd', 400, 'INVALID_STATUS');
      }
      const updated = await prisma.ticket.update({
        where: { id },
        data: { status: 'GESLOTEN', closedAt: new Date() },
      });
      await prisma.ticketStatusLog.create({
        data: { ticketId: id, status: 'GESLOTEN', note: req.userRole === 'CUSTOMER' ? 'Geannuleerd door klant' : 'Geannuleerd' },
      });
      return res.json(updated);
    }

    // Aanpassen
    const updateData = updateTicketSchema.parse(body);
    const data: any = {};

    if (updateData.type !== undefined) data.type = updateData.type;
    if (updateData.urgency !== undefined) data.urgency = updateData.urgency;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.installationId !== undefined) data.installationId = updateData.installationId || null;

    if (updateData.installationId !== undefined) {
      if (updateData.installationId) {
        const inst = await prisma.installation.findFirst({
          where: { id: updateData.installationId, customerId: ticket.customerId },
        });
        if (!inst) throw new CustomError('Installatie niet gevonden', 400, 'INVALID_INSTALLATION');
      }
    }

    if (updateData.proposedSlots && updateData.proposedSlots.length > 0) {
      await prisma.ticketTimeSlot.deleteMany({ where: { ticketId: id } });
      await prisma.ticketTimeSlot.createMany({
        data: updateData.proposedSlots.map((s) => ({
          ticketId: id,
          slotIndex: s.slotIndex,
          date: new Date(s.date),
          preference: s.preference,
        })),
      });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        customer: true,
        installation: true,
        proposedSlots: true,
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/** PATCH /tickets/:id/status – technicus wijzigt status */
router.patch('/:id/status', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, scheduledAt, resolutionSummary, confirmedSlotIndex } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { customer: true, proposedSlots: true },
    });
    if (!ticket) throw new CustomError('Ticket niet gevonden', 404, 'NOT_FOUND');

    const cust = await prisma.customer.findUnique({
      where: { id: ticket.customerId },
      select: { linkedTechnicianId: true },
    });
    if (req.userRole === 'TECHNICIAN' && cust?.linkedTechnicianId !== req.technicianId) {
      throw new CustomError('Geen toegang', 403, 'ACCESS_DENIED');
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'GESLOTEN') updateData.closedAt = new Date();
      if (status === 'INGEPLAND' && scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    }
    if (resolutionSummary !== undefined) updateData.resolutionSummary = resolutionSummary;
    if (confirmedSlotIndex !== undefined && ticket.proposedSlots.length >= confirmedSlotIndex) {
      await prisma.ticketTimeSlot.updateMany({
        where: { ticketId: id },
        data: { confirmed: false },
      });
      const slot = ticket.proposedSlots.find((s) => s.slotIndex === confirmedSlotIndex);
      if (slot) {
        await prisma.ticketTimeSlot.update({
          where: { id: slot.id },
          data: { confirmed: true },
        });
        updateData.scheduledAt = slot.date;
        updateData.status = 'INGEPLAND';
      }
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    if (status) {
      await prisma.ticketStatusLog.create({
        data: { ticketId: id, status: status as TicketStatus },
      });
    }

    // E-mail naar klant bij bevestiging
    if (status === 'INGEPLAND' && ticket.customer?.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <p>Beste ${ticket.customer.contactName},</p>
          <p>Uw onderhoudsaanvraag is ingepland.</p>
          <p><strong>Gepland op:</strong> ${updated.scheduledAt ? new Date(updated.scheduledAt).toLocaleString('nl-BE') : '-'}</p>
          <p><a href="${frontendUrl}/tickets">Bekijk status in de app</a></p>
          <p>Met vriendelijke groeten,<br>IntelliFrost</p>
        </div>
      `;
      await sendEmail(ticket.customer.email, 'Onderhoud ingepland – IntelliFrost', html);
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
