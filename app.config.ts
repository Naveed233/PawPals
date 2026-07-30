import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config. Everything lives in app.json; this only overrides the
 * web base URL so the same repo can serve from two hosts:
 *
 *   - Root hosts (Cloudflare Pages `pawpair.pages.dev`, a custom domain) → "/"
 *   - GitHub Pages project site → "/PawPals" (set via EXPO_BASE_URL in the
 *     deploy workflow, since project sites live under a subpath)
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL ?? '/',
  },
});
