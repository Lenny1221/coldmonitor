/**
 * Apple Push Notification service (HTTP/2 APNs) voor iOS-app tokens van Capacitor.
 * Vereist: APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY (.p8 inhoud), APNS_BUNDLE_ID
 */
import http2 from 'http2';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../utils/logger';

/** Ruim spaties en <> uit token; lowercase voor URL-pad */
export function cleanApnsDeviceToken(raw: string): string {
  return raw.replace(/[\s<>]/g, '').toLowerCase();
}

/**
 * Capacitor iOS geeft een hex APNs device token (typisch 64–128 hex).
 * FCM-tokens zijn langer en niet enkel hex.
 */
export function isLikelyApnsDeviceToken(token: string): boolean {
  const t = cleanApnsDeviceToken(token);
  if (t.length < 64 || t.length > 200) return false;
  return /^[0-9a-f]+$/.test(t);
}

function createApnsJwt(): string | null {
  const { apnsKeyId, apnsTeamId, apnsPrivateKey } = config;
  if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) return null;
  const key = apnsPrivateKey.includes('BEGIN PRIVATE KEY')
    ? apnsPrivateKey
    : apnsPrivateKey.replace(/\\n/g, '\n');
  try {
    return jwt.sign(
      { iss: apnsTeamId, iat: Math.floor(Date.now() / 1000) },
      key,
      { algorithm: 'ES256', header: { alg: 'ES256', kid: apnsKeyId } }
    );
  } catch (e) {
    logger.error('APNs JWT sign fout', e as Error);
    return null;
  }
}

export async function sendApnsPush(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const token = cleanApnsDeviceToken(deviceToken);
  if (!token) return false;

  const auth = createApnsJwt();
  if (!auth || !config.apnsBundleId) {
    logger.debug(
      'APNs: niet geconfigureerd (zet APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY, APNS_BUNDLE_ID)'
    );
    return false;
  }

  const host = config.apnsUseSandbox ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';

  const custom: Record<string, string> = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (k !== 'aps') custom[k] = String(v);
  }

  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
    },
    ...custom,
  };

  return new Promise((resolve) => {
    const client = http2.connect(`https://${host}`);

    const cleanup = () => {
      try {
        client.close();
      } catch {
        /* ignore */
      }
    };

    client.on('error', (err) => {
      logger.warn('APNs http2 connect error', { message: (err as Error).message });
      cleanup();
      resolve(false);
    });

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${token}`,
      authorization: `bearer ${auth}`,
      'apns-topic': config.apnsBundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    });

    let status = 0;
    let responseBody = '';
    req.on('response', (headers) => {
      status = Number(headers[':status'] || 0);
    });
    req.on('data', (chunk) => {
      responseBody += chunk.toString();
    });
    req.on('end', () => {
      cleanup();
      if (status === 200) {
        logger.info('APNs push verzonden', { title });
        resolve(true);
      } else {
        logger.warn('APNs push mislukt', { status, body: responseBody.slice(0, 500) });
        resolve(false);
      }
    });
    req.on('error', (err) => {
      logger.warn('APNs request error', { message: (err as Error).message });
      cleanup();
      resolve(false);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}
