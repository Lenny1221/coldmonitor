/**
 * Escalatie- en alarm-API
 * - POST /escalate: cron endpoint (elke minuut)
 * - POST /alarm/acknowledge: bevestig alarm
 * - GET /alarms/active: actieve alarmen
 * - GET /twilio/voice/:alarmId: TwiML voor AI-telefoon
 * - GET /tts/audio/:alarmId: TTS-audio (ElevenLabs)
 * - POST /twilio/webhook: DTMF-handling
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { config } from '../../config/env';
import { runEscalationCron } from '../../services/escalationService';
import { alertService } from '../../services/alertService';
import { generateTtsAudio } from '../../services/notifications/phoneChannel';
import { logger } from '../../utils/logger';

const router = Router();

// In-memory cache voor TTS-audio (5 min)
const ttsCache = new Map<string, { buffer: Buffer; expires: number }>();
const TTS_CACHE_MS = 5 * 60 * 1000;

/**
 * POST /api/escalate
 * Cron endpoint – roep elke minuut aan (n8n, cron, etc.)
 */
router.post('/escalate', async (req: Request, res: Response) => {
  try {
    const secret = req.headers['x-cron-secret'] || req.query.secret;
    if (config.cronSecret && secret !== config.cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await runEscalationCron();
    res.json({ success: true, message: 'Escalatie-cron uitgevoerd' });
  } catch (error) {
    logger.error('Escalatie-cron fout', error as Error);
    res.status(500).json({ error: 'Escalatie-cron mislukt' });
  }
});

const acknowledgeSchema = z.object({
  alarm_id: z.string().optional(),
  alarmId: z.string().optional(),
  acknowledged_by: z.string().optional(),
  acknowledgedBy: z.string().optional(),
}).refine(
  (d) => d.alarm_id || d.alarmId,
  { message: 'alarm_id of alarmId verplicht' }
);

/**
 * POST /api/alarm/acknowledge
 * Bevestig alarm – stopt alle verdere escalatie
 */
router.post('/alarm/acknowledge', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = acknowledgeSchema.parse(req.body);
    const alarmId = data.alarm_id ?? data.alarmId!;
    const acknowledgedBy = data.acknowledged_by ?? data.acknowledgedBy ?? req.userId ?? 'unknown';

    const alert = await prisma.alert.findUnique({
      where: { id: alarmId },
      include: {
        coldCell: {
          include: {
            location: { include: { customer: true } },
          },
        },
      },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alarm niet gevonden' });
    }

    if (req.userRole === 'CUSTOMER' && alert.coldCell.location.customerId !== req.customerId) {
      return res.status(403).json({ error: 'Geen toegang' });
    }

    if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      const cust = await prisma.customer.findUnique({
        where: { id: alert.coldCell.location.customerId },
      });
      if (cust?.linkedTechnicianId !== req.technicianId) {
        return res.status(403).json({ error: 'Geen toegang' });
      }
    }

    await prisma.alert.update({
      where: { id: alarmId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy,
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNote: 'Bevestigd door gebruiker',
      },
    });

    logger.info('Alarm bevestigd', { alarmId, acknowledgedBy });
    res.json({ success: true, message: 'Alarm bevestigd' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alarms/active
 * Alle actieve alarmen met laag en verstreken tijd
 */
router.get('/alarms/active', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const where: any = {
      status: { in: ['ACTIVE', 'ESCALATING'] },
      acknowledgedAt: null,
    };

    if (req.userRole === 'CUSTOMER' && req.customerId) {
      where.coldCell = {
        location: { customerId: req.customerId },
      };
    } else if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      where.coldCell = {
        location: {
          customer: { linkedTechnicianId: req.technicianId },
        },
      };
    }
    // ADMIN: geen filter

    const alarms = await prisma.alert.findMany({
      where,
      include: {
        coldCell: {
          include: {
            location: {
              include: {
                customer: { select: { companyName: true } },
              },
            },
          },
        },
      },
      orderBy: { triggeredAt: 'asc' },
    });

    const now = Date.now();
    const result = alarms.map((a) => ({
      ...a,
      timeElapsedMinutes: Math.floor((now - a.triggeredAt.getTime()) / 60000),
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tts/audio/:alarmId
 * Genereer TTS-audio voor alarm (ElevenLabs)
 */
router.get('/tts/audio/:alarmId', async (req: Request, res: Response) => {
  try {
    const { alarmId } = req.params;
    const { backup, technician } = req.query;

    const alert = await prisma.alert.findUnique({
      where: { id: alarmId },
      include: {
        coldCell: {
          include: {
            location: { include: { customer: true } },
          },
        },
      },
    });

    if (!alert) {
      return res.status(404).send('Alarm niet gevonden');
    }

    const customer = alert.coldCell?.location?.customer;
    const coldCellName = alert.coldCell?.name ?? 'Onbekende cel';
    const temp = alert.value ?? 0;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';

    let text: string;
    if (technician === '1') {
      text = `${greeting}. IntelliFrost. URGENT: ${customer?.companyName} – koelcel ${coldCellName}, temperatuur ${temp} graden. U wordt gevraagd om in te grijpen.`;
    } else if (backup === '1') {
      text = `${greeting}. IntelliFrost. Er is een kritisch alarm bij ${customer?.companyName} – koelcel ${coldCellName}. Temperatuur ${temp} graden. Neem contact op.`;
    } else {
      text = `${greeting}. Dit is IntelliFrost. Uw koelcel ${coldCellName} heeft een kritisch temperatuuralarm. De huidige temperatuur is ${temp} graden Celsius. Druk 1 om te bevestigen dat u op de hoogte bent. Druk 2 om een technieker op te roepen.`;
    }

    const cacheKey = `${alarmId}-${backup}-${technician}`;
    let cached = ttsCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(cached.buffer);
    }

    const buffer = await generateTtsAudio(text);
    if (!buffer) {
      return res.status(503).send('TTS niet beschikbaar');
    }

    ttsCache.set(cacheKey, { buffer, expires: Date.now() + TTS_CACHE_MS });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error) {
    logger.error('TTS audio fout', error as Error);
    res.status(500).send('Fout');
  }
});

/**
 * GET /api/twilio/voice/:alarmId
 * TwiML voor AI-telefoongesprek
 */
router.get('/twilio/voice/:alarmId', async (req: Request, res: Response) => {
  try {
    const { alarmId } = req.params;
    const { backup, technician } = req.query;
    const retry = parseInt(String(req.query.retry || '0'), 10);

    const apiUrl = config.apiUrl.replace(/\/$/, '');
    const qs = new URLSearchParams();
    if (backup === '1') qs.set('backup', '1');
    if (technician === '1') qs.set('technician', '1');
    const audioUrl = `${apiUrl}/api/tts/audio/${alarmId}${qs.toString() ? '?' + qs.toString() : ''}`;
    const webhookUrl = `${apiUrl}/api/twilio/webhook`;

    // Geen Gather voor backup/technician (alleen afspelen)
    if (backup === '1' || technician === '1') {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="2"/>
  <Hangup/>
</Response>`;
      res.type('text/xml');
      return res.send(twiml);
    }

    // Klant: Gather voor DTMF (1 = bevestigen, 2 = technicus)
    const maxRetries = 3;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${webhookUrl}?alarmId=${alarmId}" method="POST" timeout="30">
    <Play>${audioUrl}</Play>
  </Gather>
  ${retry < maxRetries - 1 ? `<Redirect>${apiUrl}/api/twilio/voice/${alarmId}?retry=${retry + 1}</Redirect>` : '<Hangup/>'}
</Response>`;

    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    logger.error('Twilio voice TwiML fout', error as Error);
    res.status(500).send('Fout');
  }
});

/**
 * POST /api/twilio/webhook
 * DTMF-handling: 1 = bevestigen, 2 = technicus oproepen
 */
router.post('/twilio/webhook', async (req: Request, res: Response) => {
  try {
    const digits = req.body?.Digits;
    const alarmId = req.body?.alarmId || req.query?.alarmId;

    if (!alarmId) {
      res.type('text/xml');
      return res.send('<?xml version="1.0"?><Response><Hangup/></Response>');
    }

    const alert = await prisma.alert.findUnique({
      where: { id: alarmId },
      include: {
        coldCell: {
          include: {
            location: {
              include: {
                customer: { include: { linkedTechnician: true } },
              },
            },
          },
        },
      },
    });

    if (!alert) {
      res.type('text/xml');
      return res.send('<?xml version="1.0"?><Response><Say>Alarm niet gevonden.</Say><Hangup/></Response>');
    }

    if (digits === '1' || digits === '2') {
      await prisma.alert.update({
        where: { id: alarmId },
        data: {
          acknowledgedAt: new Date(),
          acknowledgedBy: 'twilio-dtmf',
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionNote: digits === '1' ? 'Bevestigd via telefoon (1)' : 'Technicus opgeroepen via telefoon (2)',
        },
      });

      if (digits === '2') {
        // Technicus dispatch – extra notificatie
        const technician = alert.coldCell?.location?.customer?.linkedTechnician;
        if (technician?.phone) {
          const { sendSms } = await import('../../services/notifications/smsChannel');
          await sendSms(
            technician.phone,
            `IntelliFrost: Klant heeft technicus opgeroepen voor ${alert.coldCell?.name}. Alarm ${alarmId}.`
          );
        }
      }

      logger.info('Alarm bevestigd via DTMF', { alarmId, digits });
    }

    const twiml = `<?xml version="1.0"?>
<Response>
  <Say>Bedankt. Het alarm is geregistreerd.</Say>
  <Hangup/>
</Response>`;

    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    logger.error('Twilio webhook fout', error as Error);
    res.type('text/xml');
    res.send('<?xml version="1.0"?><Response><Hangup/></Response>');
  }
});

export default router;
