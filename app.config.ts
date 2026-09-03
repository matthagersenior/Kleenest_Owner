import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Kleenest Owner',
  slug: 'kleenest-owner',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'kleenest-owner',
  userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'com.kleenest.owner', supportsTablet: true, config: { usesNonExemptEncryption: false } },
  android: { package: 'com.kleenest.owner' },
  web: { output: 'single', bundler: 'metro', name: 'Kleenest Owner', shortName: 'Kleenest Owner' },
  plugins: ['expo-router', 'expo-secure-store'],
  experiments: { typedRoutes: true, baseUrl: '/Kleenest_Owner' },
  extra: { appRole: 'owner', supabaseProjectRef: 'ssgesjzdvdsqacdtasje' },
};

export default config;
