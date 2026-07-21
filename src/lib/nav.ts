import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * A back handler that never dead-ends. When a screen is reached normally it
 * pops the stack; when it was deep-linked or refreshed into directly (no
 * history — e.g. a shared /dog/... link, or GitHub Pages' SPA fallback), it
 * navigates to a sensible fallback instead of firing an unhandled GO_BACK.
 */
export function useSafeBack(fallback = '/(tabs)') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  }, [router, fallback]);
}
