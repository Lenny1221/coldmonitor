/**
 * Token storage abstraction: Cookies for web, Capacitor Preferences for native (iOS).
 * Ensures JWT auth works on both GitHub (web) and Capacitor (iOS app).
 */
import Cookies from 'js-cookie';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

const isNative = () => Capacitor.isNativePlatform();

export const tokenStorage = {
  async getToken(): Promise<string | undefined> {
    if (isNative()) {
      const { value } = await Preferences.get({ key: TOKEN_KEY });
      return value ?? undefined;
    }
    return Cookies.get(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | undefined> {
    if (isNative()) {
      const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
      return value ?? undefined;
    }
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  async setToken(token: string, expiresDays = 7): Promise<void> {
    if (isNative()) {
      await Preferences.set({ key: TOKEN_KEY, value: token });
      return;
    }
    Cookies.set(TOKEN_KEY, token, { expires: expiresDays });
  },

  async setRefreshToken(token: string, expiresDays = 7): Promise<void> {
    if (isNative()) {
      await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token });
      return;
    }
    Cookies.set(REFRESH_TOKEN_KEY, token, { expires: expiresDays });
  },

  async removeToken(): Promise<void> {
    if (isNative()) {
      await Preferences.remove({ key: TOKEN_KEY });
      return;
    }
    Cookies.remove(TOKEN_KEY);
  },

  async removeRefreshToken(): Promise<void> {
    if (isNative()) {
      await Preferences.remove({ key: REFRESH_TOKEN_KEY });
      return;
    }
    Cookies.remove(REFRESH_TOKEN_KEY);
  },

  /** Synchronous get for request interceptors (web only; native uses async) */
  getTokenSync(): string | undefined {
    if (isNative()) return undefined; // Native must use async getToken
    return Cookies.get(TOKEN_KEY);
  },

  getRefreshTokenSync(): string | undefined {
    if (isNative()) return undefined;
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  /** E-mail opslaan voor "onthoud mij" – pre-fill bij volgende login */
  async setRememberedEmail(email: string): Promise<void> {
    if (isNative()) {
      await Preferences.set({ key: REMEMBERED_EMAIL_KEY, value: email });
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    }
  },

  async getRememberedEmail(): Promise<string | undefined> {
    if (isNative()) {
      const { value } = await Preferences.get({ key: REMEMBERED_EMAIL_KEY });
      return value ?? undefined;
    }
    return typeof localStorage !== 'undefined' ? localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? undefined : undefined;
  },

  async removeRememberedEmail(): Promise<void> {
    if (isNative()) {
      await Preferences.remove({ key: REMEMBERED_EMAIL_KEY });
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  },
};
