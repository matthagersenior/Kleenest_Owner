import type { ExpoConfig } from 'expo/config';

const EAS_PROJECT_ID = '22a65aa3-c615-4c4f-a34d-084babc28fd7';

const config: ExpoConfig = {
  name: 'KleenestOS',
  slug: 'kleenest-consumer',
  version: '0.1.0',
  runtimeVersion: 'kleenest-owner-0.1.0',
  icon: './assets/app-icon.png',
  updates: {
    enabled: true,
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    requestHeaders: { 'expo-channel-name': 'owner-production' },
  },
  orientation: 'portrait',
  scheme: 'kleenest-owner',
  userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'com.kleenest.owner', supportsTablet: true, config: { usesNonExemptEncryption: false } },
  android: { package: 'com.kleenest.owner', icon: './assets/app-icon.png' },
  web: { output: 'single', bundler: 'metro', name: 'KleenestOS', shortName: 'KleenestOS' },
  plugins: ['expo-router', 'expo-secure-store'],
  experiments: { typedRoutes: true, baseUrl: '/Kleenest_Owner' },
  extra: {
    appRole: 'owner',
    otaChannel: 'owner-production',
    supabaseProjectRef: 'ssgesjzdvdsqacdtasje',
    eas: { projectId: EAS_PROJECT_ID },
  },
};

export default config;
