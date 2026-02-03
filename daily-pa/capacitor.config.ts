import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dailypa.app',
  appName: 'Daily PA',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // IMPORTANT: For production, your API routes need to point to your Vercel deployment
    // Uncomment and set your Vercel URL:
    // url: 'https://your-app.vercel.app',
    // For local development, use:
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set path to your keystore for release builds
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB', // or 'APK'
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
