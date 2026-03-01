import twilio from 'twilio';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

let twilioClient: ReturnType<typeof twilio> | null = null;
let elevenLabsClient: ElevenLabsClient | null = null;

// Cache voor TTS (gedeeld met escalation controller) – voorkomt dubbele ElevenLabs-calls
const TTS_CACHE_MS = 5 * 60 * 1000;
const ttsCache = new Map<string, { buffer: Buffer; expires: number }>();

export function getCachedTts(cacheKey: string): Buffer | null {
  const cached = ttsCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.buffer;
  return null;
}

export function setCachedTts(cacheKey: string, buffer: Buffer): void {
  ttsCache.set(cacheKey, { buffer, expires: Date.now() + TTS_CACHE_MS });
}

function getTwilioClient() {
  if (twilioClient) return twilioClient;
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    return null;
  }
  twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
  return twilioClient;
}

function getElevenLabsClient(): ElevenLabsClient | null {
  if (elevenLabsClient) return elevenLabsClient;
  if (!config.elevenLabsApiKey || !config.elevenLabsVoiceId) {
    return null;
  }
  elevenLabsClient = new ElevenLabsClient({
    apiKey: config.elevenLabsApiKey,
  });
  return elevenLabsClient;
}

/**
 * Genereer TTS-audio via ElevenLabs API (officiële SDK, zie elevenlabs.io/docs/eleven-api/quickstart)
 */
export async function generateTtsAudio(text: string): Promise<Buffer | null> {
  const client = getElevenLabsClient();
  if (!client || !config.elevenLabsVoiceId) {
    logger.warn('ElevenLabs niet geconfigureerd – TTS wordt overgeslagen');
    return null;
  }

  try {
    const stream = await client.textToSpeech.convert(config.elevenLabsVoiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    if (!stream) {
      logger.error('ElevenLabs: geen audio stream ontvangen');
      return null;
    }

    const chunks: Buffer[] = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
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
