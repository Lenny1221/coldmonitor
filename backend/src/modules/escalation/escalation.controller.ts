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
import { generateTtsAudio, getCachedTts, setCachedTts } from '../../services/notifications/phoneChannel';
import { logger } from '../../utils/logger';

const router = Router();

/** Escape tekst voor gebruik in TwiML <Say> */
function escapeTwiML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Format seconden naar leesbare duur (bijv. "5 minuten") */
function formatDoorDelay(seconds: number): string {
  if (seconds < 60) return `${seconds} seconden`;
  const min = Math.round(seconds / 60);
  return min === 1 ? '1 minuut' : `${min} minuten`;
}

/** Bouw alarmtekst voor TTS/Say */
function buildAlarmText(
  alert: {
    type?: string;
    value?: number | null;
    coldCell?: {
      name?: string | null;
      doorAlarmDelaySeconds?: number;
      location?: { customer?: { companyName?: string | null } | null } | null;
    } | null;
  },
  backup?: string,
  technician?: string
): string {
  const customer = alert.coldCell?.location?.customer;
  const coldCellName = alert.coldCell?.name ?? 'Onbekende cel';
  const temp = alert.value ?? 0;
  const doorDelaySec = alert.coldCell?.doorAlarmDelaySeconds ?? 300;
  const doorDelayText = formatDoorDelay(doorDelaySec);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';

  const isDoorOpen = alert.type === 'DOOR_OPEN';

  if (technician === '1') {
    if (isDoorOpen) {
      return `${greeting}. IntelliFrost. URGENT: ${customer?.companyName} – koelcel ${coldCellName}. De deur staat te lang open. U wordt gevraagd om in te grijpen.`;
    }
    return `${greeting}. IntelliFrost. URGENT: ${customer?.companyName} – koelcel ${coldCellName}, temperatuur ${temp} graden. U wordt gevraagd om in te grijpen.`;
  }
  if (backup === '1') {
    if (isDoorOpen) {
      return `${greeting}. IntelliFrost. Er is een kritisch alarm bij ${customer?.companyName} – koelcel ${coldCellName}. De deur staat te lang open. Neem contact op.`;
    }
    return `${greeting}. IntelliFrost. Er is een kritisch alarm bij ${customer?.companyName} – koelcel ${coldCellName}. Temperatuur ${temp} graden. Neem contact op.`;
  }
  // Klant (met Druk 1/2)
  if (isDoorOpen) {
    return `${greeting}. Dit is IntelliFrost. De deur van uw koelcel ${coldCellName} staat te lang open. U heeft ingesteld dat de deur maximaal ${doorDelayText} mag openstaan. Druk 1 om te bevestigen dat u op de hoogte bent. Druk 2 om een technieker op te roepen.`;
  }
  return `${greeting}. Dit is IntelliFrost. Uw koelcel ${coldCellName} heeft een kritisch temperatuuralarm. De huidige temperatuur is ${temp} graden Celsius. Druk 1 om te bevestigen dat u op de hoogte bent. Druk 2 om een technieker op te roepen.`;
}

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
router.all('/tts/audio/:alarmId', async (req: Request, res: Response) => {
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

    const text = buildAlarmText(alert, String(backup), String(technician));
    const cacheKey = `${alarmId}-${backup}-${technician}`;

    let cached = getCachedTts(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(cached);
    }

    const buffer = await generateTtsAudio(text);
    if (!buffer) {
      return res.status(503).send('TTS niet beschikbaar');
    }

    setCachedTts(cacheKey, buffer);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error) {
    logger.error('TTS audio fout', error as Error);
    res.status(500).send('Fout');
  }
});

/**
 * GET/POST /api/twilio/voice/:alarmId
 * TwiML voor AI-telefoongesprek (Twilio kan GET of POST gebruiken)
 * Fallback: als ElevenLabs faalt, gebruikt Twilio's native Say
 */
router.all('/twilio/voice/:alarmId', async (req: Request, res: Response) => {
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

    // Haal alert op voor tekst (nodig voor Twilio Say fallback)
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

    const text = alert ? buildAlarmText(alert, String(backup), String(technician)) : 'Alarm melding.';
    const cacheKey = `${alarmId}-${backup}-${technician}`;

    // Probeer ElevenLabs; bij falen (402, geen config, etc.) gebruik Twilio Say
    let usePlay = false;
    const buffer = await generateTtsAudio(text);
    if (buffer) {
      setCachedTts(cacheKey, buffer);
      usePlay = true;
    } else {
      logger.info('ElevenLabs TTS niet beschikbaar – gebruik Twilio Say fallback', { alarmId });
    }

    const sayXml = `<Say language="nl-BE">${escapeTwiML(text)}</Say>`;
    const playXml = usePlay ? `<Play>${audioUrl}</Play>` : sayXml;

    // Geen Gather voor backup/technician (alleen afspelen)
    if (backup === '1' || technician === '1') {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${playXml}
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
    ${playXml}
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
