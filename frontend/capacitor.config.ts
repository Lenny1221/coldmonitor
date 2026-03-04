import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.projectlogger.coldmonitor',
  appName: 'IntelliFrost',
  webDir: 'dist',
  server: {
    // Voor development: uncomment om de live webapp te laden
     url: 'http://localhost:5173',
    // cleartext: true,
  },
};

export default config;
