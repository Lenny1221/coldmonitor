import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.projectlogger.coldmonitor',
  appName: 'IntelliFrost',
  webDir: 'dist',
  // Geen server.url = laadt gebundelde app die via Railway (intellifrost.be) verbindt
  plugins: {
    PushNotifications: {
      // Toon de melding ook als banner/geluid wanneer de app op de voorgrond staat
      presentationOptions: ['alert', 'sound', 'badge'],
    },
  },
};

export default config;
