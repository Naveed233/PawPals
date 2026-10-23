import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { tone } from '@/theme';

/**
 * Web-only HTML shell for every statically-rendered page.
 *
 * Pinch zoom stays enabled (accessibility); touch screens get 16px inputs so
 * iOS Safari does not auto-zoom into a field on focus.
 *
 * The critical bit is `viewport-fit=cover`: without it iOS Safari never
 * exposes `env(safe-area-inset-*)`, so react-native-safe-area-context reports
 * zero insets on the web and our top controls slide under the notch while the
 * tab bar hides behind Safari's toolbar. With it, the whole app becomes
 * safe-area aware on mobile web, exactly like the native build.
 *
 * The body background is the app ground so there is never a white flash on
 * load or white bars around the safe area. The parts of the page the app never
 * draws (selection, caret, focus ring, scrollbars) are themed here too.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content={tone.ground} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: rootStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const rootStyle = `
html, body { background-color: ${tone.skyTint}; }
::selection { background: ${tone.action}; color: ${tone.onAction}; }
input, textarea { caret-color: ${tone.ink}; }
@media (pointer: coarse) { input, textarea, select { font-size: 16px !important; } }
:focus-visible { outline: 3px solid ${tone.accentInk}; outline-offset: 2px; }
* { scrollbar-color: ${tone.printEdge} transparent; }
`;
