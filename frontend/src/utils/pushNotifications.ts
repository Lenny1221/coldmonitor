/**
 * Push notifications – registreer FCM token bij backend voor ticket-acceptatie etc.
 * Alleen op native (Capacitor iOS/Android).
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { authApi } from '../services/api';

let registrationListenerAdded = false;

export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      await PushNotifications.requestPermissions();
    }
    if ((await PushNotifications.checkPermissions()).receive !== 'granted') {
      return;
    }

    if (!registrationListenerAdded) {
      registrationListenerAdded = true;
      await PushNotifications.addListener('registration', async (token) => {
        try {
          await authApi.registerPushToken(token.value);
        } catch (e) {
          console.warn('Push token registreren mislukt:', e);
        }
      });
      await PushNotifications.addListener('registrationError', (err) => {
        console.warn('Push registration error:', err.error);
      });
    }

    await PushNotifications.register();
  } catch (e) {
    console.warn('Push notifications init:', e);
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
