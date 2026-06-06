import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { sendEmail } from '../../utils/email';
import { logger } from '../../utils/logger';

const router = Router();

// Early-bird-aanbod — hier centraal aanpasbaar.
const EARLY_BIRD_LIMIT = 25;
const EARLY_BIRD_OFFER = '3 maanden gratis monitoring + gratis installatie';

const waitlistSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(120),
  email: z.string().email('Ongeldig e-mailadres'),
  company: z.string().max(160).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  sector: z.string().max(120).optional().or(z.literal('')),
  coldrooms: z.string().max(60).optional().or(z.literal('')),
});

// Rate limit: 5 aanmeldingen per 15 min per IP
const waitlistRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Te veel aanvragen. Probeer het later opnieuw.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function getFirstName(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first || 'daar';
}

function clean(value?: string): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** Professionele bevestigingsmail naar de aanmelder. */
function buildConfirmationHtml(name: string, position: number): string {
  const voornaam = getFirstName(name);
  const isEarlyBird = position <= EARLY_BIRD_LIMIT;
  const earlyBirdBlock = isEarlyBird
    ? `
      <div style="margin:20px 0;padding:16px 20px;background:#eafaff;border:1px solid #00c8ff;border-radius:10px;">
        <p style="margin:0;color:#0B1F3A;font-weight:bold;">🎉 Je hoort bij de eerste ${EARLY_BIRD_LIMIT} aanmeldingen!</p>
        <p style="margin:6px 0 0;color:#0B1F3A;">Daardoor krijg je als early-bird <strong>${EARLY_BIRD_OFFER}</strong> bij de start.</p>
      </div>`
    : `
      <div style="margin:20px 0;padding:16px 20px;background:#f4f8fb;border:1px solid #d6e4ee;border-radius:10px;">
        <p style="margin:0;color:#0B1F3A;">Je staat op de wachtlijst. We houden je op de hoogte van onze early-bird-acties bij de lancering.</p>
      </div>`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
      <h2 style="color:#00c8ff;margin-bottom:4px;">Welkom op de IntelliFrost-wachtlijst</h2>
      <p>Beste ${voornaam},</p>
      <p>Bedankt om je in te schrijven voor <strong>IntelliFrost</strong>! We zijn volop bezig om alle functies van het platform af te werken, zodat je straks zorgeloos je koel- en vriescellen kan bewaken.</p>

      ${earlyBirdBlock}

      <h3 style="color:#0B1F3A;margin-bottom:6px;">Wat is IntelliFrost?</h3>
      <p style="margin-top:0;">Slimme, realtime bewaking van je koel- en vriesinstallaties — zodat je nooit nog wakker ligt van een defecte cel:</p>
      <ul style="padding-left:18px;">
        <li><strong>Realtime temperatuur &amp; deurbewaking</strong> van elke koelcel, dag en nacht.</li>
        <li><strong>Direct alarm</strong> via app, SMS en zelfs telefoon zodra er iets misgaat.</li>
        <li><strong>Zelflerende detectie</strong>: het systeem leert je cel kennen en waarschuwt preventief vóór een echt probleem.</li>
        <li><strong>Automatische HACCP-rapporten</strong> — altijd in orde bij controle.</li>
        <li><strong>Vaste servicepartner (Serv-Ice)</strong>: wij detecteren én lossen het probleem op.</li>
        <li><strong>Mobiele app</strong>: je koelcellen letterlijk in je broekzak.</li>
      </ul>

      <h3 style="color:#0B1F3A;margin-bottom:6px;">Hoe gaat het verder?</h3>
      <p style="margin-top:0;">Zodra we van start gaan, nemen we <strong>persoonlijk contact</strong> met je op om alles in te plannen en de installatie bij jou te verzorgen. Jij hoeft voorlopig niets te doen — wij houden je op de hoogte.</p>

      <p>Vragen in tussentijd? Antwoord gerust op deze mail of contacteer ons via <a href="mailto:info@intellifrost.be">info@intellifrost.be</a>.</p>

      <p style="margin-top:24px;">Met vriendelijke groeten,<br><strong>Team IntelliFrost</strong><br>Slimme monitoring voor koel- en vriesinstallaties</p>
    </div>
  `;
}

/** Interne notificatie naar het IntelliFrost-team. */
function buildInternalHtml(data: {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  sector: string | null;
  coldrooms: string | null;
  position: number;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
      <h2 style="color:#0B1F3A;">Nieuwe wachtlijst-aanmelding (#${data.position})</h2>
      <p><strong>Naam:</strong> ${data.name}</p>
      <p><strong>E-mail:</strong> ${data.email}</p>
      <p><strong>Bedrijf:</strong> ${data.company ?? '—'}</p>
      <p><strong>Telefoon:</strong> ${data.phone ?? '—'}</p>
      <p><strong>Sector:</strong> ${data.sector ?? '—'}</p>
      <p><strong>Aantal koelcellen:</strong> ${data.coldrooms ?? '—'}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
      <p style="font-size:12px;color:#666;">Positie ${data.position}${data.position <= EARLY_BIRD_LIMIT ? ' — valt binnen de eerste ' + EARLY_BIRD_LIMIT + ' (early-bird)' : ''}. Verzonden via intellifrost.be/wachtlijst – ${new Date().toISOString()}</p>
    </div>
  `;
}

router.post('/', waitlistRateLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = waitlistSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Ongeldige invoer';
      return res.status(400).json({ error: msg });
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.trim().toLowerCase();
    const company = clean(parsed.data.company);
    const phone = clean(parsed.data.phone);
    const sector = clean(parsed.data.sector);
    const coldrooms = clean(parsed.data.coldrooms);

    // Bestaat dit e-mailadres al? Dan geen dubbele entry, maar wel een nette
    // bevestiging (en geen extra interne mail).
    const existing = await prisma.waitlistEntry.findFirst({
      where: { email },
      orderBy: { createdAt: 'asc' },
    });

    let position: number;
    let isNew = false;

    if (existing) {
      position = existing.position;
    } else {
      // Volgnummer bepalen + entry aanmaken in één transactie (beperkt races).
      position = await prisma.$transaction(async (tx) => {
        const count = await tx.waitlistEntry.count();
        const entry = await tx.waitlistEntry.create({
          data: { name, email, company, phone, sector, coldrooms, position: count + 1 },
        });
        return entry.position;
      });
      isNew = true;
    }

    // Bevestigingsmail naar de aanmelder
    const confirmationOk = await sendEmail(
      email,
      'Welkom op de IntelliFrost-wachtlijst',
      buildConfirmationHtml(name, position)
    );

    // Interne notificatie (enkel bij een nieuwe aanmelding)
    if (isNew) {
      const recipient =
        process.env.WAITLIST_EMAIL || process.env.CONTACT_EMAIL || 'info@intellifrost.be';
      await sendEmail(
        recipient,
        `Wachtlijst #${position} – ${name}`,
        buildInternalHtml({ name, email, company, phone, sector, coldrooms, position })
      );
    }

    if (!confirmationOk) {
      logger.warn('Wachtlijst: bevestigingsmail kon niet worden verzonden', { email });
    }

    logger.info('Wachtlijst-aanmelding verwerkt', { email, position, isNew });
    return res.json({ success: true, position, earlyBird: position <= EARLY_BIRD_LIMIT });
  } catch (err) {
    logger.error('Wachtlijst fout', err as Error);
    return res.status(500).json({ error: 'Er ging iets mis. Probeer het later opnieuw.' });
  }
});

export default router;
