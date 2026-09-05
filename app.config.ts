import type { ExpoConfig } from 'expo/config';

const EXPECTED_EAS_PROJECT_ID = '9b5527b5-c8b1-47c1-a961-3e2d5e549a62';
const configuredEasProjectId = process.env.EAS_PROJECT_ID;
if (configuredEasProjectId && configuredEasProjectId !== EXPECTED_EAS_PROJECT_ID) {
  throw new Error(`[KleenestOS] EAS_PROJECT_ID drift detected. Expected ${EXPECTED_EAS_PROJECT_ID}, received ${configuredEasProjectId}.`);
}
const EAS_PROJECT_ID = configuredEasProjectId || EXPECTED_EAS_PROJECT_ID;
const otaChannel = process.env.EXPO_PUBLIC_OTA_CHANNEL || 'owner-production';

const config: ExpoConfig = {
  name: 'KleenestOS',
  slug: 'kleenest-owner',
  version: '0.1.0',
  runtimeVersion: 'kleenest-owner-0.1.0',
  icon: './assets/app-icon.png',
  updates: {
    enabled: true,
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    requestHeaders: { 'expo-channel-name': otaChannel },
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
    otaChannel,
    supabaseProjectRef: 'ssgesjzdvdsqacdtasje',
    eas: { projectId: EAS_PROJECT_ID },
  },
};

export default config;
