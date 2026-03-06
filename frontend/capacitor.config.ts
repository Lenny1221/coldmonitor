import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.projectlogger.coldmonitor',
  appName: 'IntelliFrost',
  webDir: 'dist',
  // Geen server.url = laadt gebundelde app die via Railway (intellifrost.be) verbindt
};

export default config;
