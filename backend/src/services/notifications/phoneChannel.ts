import twilio from 'twilio';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    return null;
  }
  twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
  return twilioClient;
}

/**
 * Genereer TTS-audio via ElevenLabs API
 */
export async function generateTtsAudio(text: string): Promise<Buffer | null> {
  if (!config.elevenLabsApiKey || !config.elevenLabsVoiceId) {
    logger.warn('ElevenLabs niet geconfigureerd – TTS wordt overgeslagen');
    return null;
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenLabsApiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      logger.error('ElevenLabs API fout', new Error(errBody), { status: res.status });
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    logger.error('Fout bij ElevenLabs TTS', err as Error);
    return null;
  }
}

/**
 * Start een uitgaand telefoongesprek met Twilio
 * voiceUrl = URL die TwiML retourneert (met Play + Gather)
 */
export async function initiatePhoneCall(
  to: string,
  voiceUrl: string
): Promise<string | null> {
  const client = getTwilioClient();
  if (!client || !config.twilioPhoneNumber) {
    logger.warn('Twilio niet geconfigureerd – telefoongesprek wordt overgeslagen');
    return null;
  }

  try {
    const call = await client.calls.create({
      url: voiceUrl,
      to: to.replace(/\s/g, '').startsWith('+') ? to : `+32${to.replace(/^0/, '')}`,
      from: config.twilioPhoneNumber,
      timeout: 30,
    });
    logger.info('Telefoongesprek gestart', { to, callSid: call.sid });
    return call.sid;
  } catch (err) {
    logger.error('Fout bij starten telefoongesprek', err as Error, { to });
    return null;
  }
}
