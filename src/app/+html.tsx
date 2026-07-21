import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Web-only HTML shell for every statically-rendered page.
 *
 * The critical bit is `viewport-fit=cover`: without it iOS Safari never
 * exposes `env(safe-area-inset-*)`, so react-native-safe-area-context reports
 * zero insets on the web and our top controls slide under the notch while the
 * tab bar hides behind Safari's toolbar. With it, the whole app becomes
 * safe-area aware on mobile web, exactly like the native build.
 *
 * The body background is set to the night theme colour so there is never a
 * white flash on load or white bars around the safe area.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#160309" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: rootStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const rootStyle = `
html, body { background-color: #160309; }
`;
