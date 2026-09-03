import type { ExpoConfig } from 'expo/config';

const EAS_PROJECT_ID = '22a65aa3-c615-4c4f-a34d-084babc28fd7';

const config: ExpoConfig = {
  name: 'Kleenest Owner',
  slug: 'kleenest-owner',
  version: '0.1.0',
  runtimeVersion: 'kleenest-owner-0.1.0',
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
  android: { package: 'com.kleenest.owner' },
  web: { output: 'single', bundler: 'metro', name: 'Kleenest Owner', shortName: 'Kleenest Owner' },
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
