import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { sendEmail } from '../../utils/email';
import { logger } from '../../utils/logger';

const router = Router();

const contactSchema = z.object({
  type: z.enum(['vraag', 'offerte', 'demo', 'technicus', 'support']),
  name: z.string().min(1, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  phone: z.string().optional(),
  company: z.string().optional(),
  sector: z.string().optional(),
  locations: z.string().optional(),
  coldrooms: z.string().optional(),
  message: z.string().min(1, 'Bericht is verplicht'),
});

const contactTypeLabels: Record<string, string> = {
  vraag: 'Algemene vraag',
  offerte: 'Offerte aanvragen',
  demo: 'Demo aanvragen',
  technicus: 'Technicus-partnerschap',
  support: 'Technische support',
};

// Striktere rate limit voor contactformulier: 5 per 15 min per IP
const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Te veel aanvragen. Probeer het later opnieuw.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', contactRateLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Ongeldige invoer';
      return res.status(400).json({ error: msg });
    }

    const { type, name, email, phone, company, sector, locations, coldrooms, message } = parsed.data;
    const typeLabel = contactTypeLabels[type] ?? type;

    const recipient = process.env.CONTACT_EMAIL || 'info@intellifrost.be';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
        <h2 style="color: #0B1F3A;">Nieuw contactformulier – IntelliFrost</h2>
        <p><strong>Type aanvraag:</strong> ${typeLabel}</p>
        <p><strong>Naam:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Telefoon:</strong> ${phone || '—'}</p>
        <p><strong>Bedrijf:</strong> ${company || '—'}</p>
        <p><strong>Sector:</strong> ${sector || '—'}</p>
        <p><strong>Aantal locaties:</strong> ${locations || '—'}</p>
        <p><strong>Aantal koelcellen:</strong> ${coldrooms || '—'}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p><strong>Bericht:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">Verzonden via intellifrost.be/contact – ${new Date().toISOString()}</p>
      </div>
    `;

    const ok = await sendEmail(recipient, `${typeLabel} – ${name}`, html);

    if (!ok) {
      logger.error('Contactformulier: e-mail kon niet worden verzonden', new Error('sendEmail returned false'), { email: recipient });
      return res.status(500).json({ error: 'Er ging iets mis. Probeer het later opnieuw of mail direct naar info@intellifrost.be.' });
    }

    logger.info('Contactformulier verzonden', { type, email });
    return res.json({ success: true });
  } catch (err) {
    logger.error('Contactformulier fout', err as Error);
    return res.status(500).json({ error: 'Er ging iets mis. Probeer het later opnieuw.' });
  }
});

export default router;
