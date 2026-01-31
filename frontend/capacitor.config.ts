import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.projectlogger.coldmonitor',
  appName: 'ColdMonitor',
  webDir: 'dist',
  server: {
    // Voor development: uncomment om de live webapp te laden
     url: 'http://192.168.1.208:5173',
    // cleartext: true,
  },
};

export default config;
