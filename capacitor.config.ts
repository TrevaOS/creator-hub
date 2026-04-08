import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creatorhub.app',
  appName: 'Creator Hub',
  webDir: 'dist',
  server: {
    // For local browser preview — comment out when building native
    url: 'http://localhost:5173',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#111111',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#C9A96E',
    },
  },
};

export default config;
