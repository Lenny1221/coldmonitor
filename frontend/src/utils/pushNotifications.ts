/**
 * Push notifications – registreer FCM token bij backend voor ticket-acceptatie etc.
 * Alleen op native (Capacitor iOS/Android).
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { authApi } from '../services/api';

let registrationListenerAdded = false;

// #region agent log
/** Ingest (Simulator) + console (Xcode op fysiek toestel). Geen volledige tokens. */
function agentPushDebug(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data: Record<string, unknown>;
}): void {
  const body = { sessionId: 'de5eab', timestamp: Date.now(), ...payload };
  console.info('[DEBUG_SESSION de5eab]', JSON.stringify(body));
  fetch('http://127.0.0.1:7242/ingest/8434f989-3671-4d11-b7a6-a2d361417207', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'de5eab' },
    body: JSON.stringify(body),
  }).catch(() => {});
}
// #endregion

export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    agentPushDebug({
      hypothesisId: 'H1',
      location: 'pushNotifications.ts:init',
      message: 'initPush skipped (not native)',
      data: {},
    });
    return;
  }

  try {
    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      await PushNotifications.requestPermissions();
    }
    const finalPerm = await PushNotifications.checkPermissions();
    agentPushDebug({
      hypothesisId: 'H1',
      location: 'pushNotifications.ts:perm',
      message: 'push permission after request',
      data: { receive: finalPerm.receive },
    });
    if (finalPerm.receive !== 'granted') {
      return;
    }

    if (!registrationListenerAdded) {
      registrationListenerAdded = true;
      await PushNotifications.addListener('registration', async (token) => {
        const tokenLen = token.value?.length ?? 0;
        agentPushDebug({
          hypothesisId: 'H2',
          location: 'pushNotifications.ts:registration',
          message: 'APNs/FCM registration callback',
          data: { tokenLen },
        });
        try {
          await authApi.registerPushToken(token.value);
          agentPushDebug({
            hypothesisId: 'H2',
            location: 'pushNotifications.ts:registerPushToken ok',
            message: 'push token PATCH succeeded',
            data: {},
          });
        } catch (e: unknown) {
          console.warn('Push token registreren mislukt:', e);
          const ax = e as { response?: { status?: number } };
          agentPushDebug({
            hypothesisId: 'H2',
            location: 'pushNotifications.ts:registerPushToken err',
            message: 'push token PATCH failed',
            data: { httpStatus: ax.response?.status ?? null },
          });
        }
      });
      await PushNotifications.addListener('registrationError', (err) => {
        console.warn('Push registration error:', err.error);
        agentPushDebug({
          hypothesisId: 'H2',
          location: 'pushNotifications.ts:registrationError',
          message: 'native registrationError',
          data: { error: String(err.error ?? err) },
        });
      });
    }

    await PushNotifications.register();
  } catch (e) {
    console.warn('Push notifications init:', e);
    agentPushDebug({
      hypothesisId: 'H1',
      location: 'pushNotifications.ts:catch',
      message: 'initPush threw',
      data: { err: String(e) },
    });
  }
}

export async function clearPushToken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await authApi.registerPushToken(null);
  } catch (e) {
    console.warn('Push token wissen mislukt:', e);
  }
}
