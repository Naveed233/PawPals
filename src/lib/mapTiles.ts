/**
 * Map tile provider.
 *
 * OpenStreetMap's community tile server explicitly forbids heavy / commercial
 * use and blocks bulk traffic — which shows up as a blank grey map for users.
 * So the app never points at it in production.
 *
 * Default (no key): CARTO's "voyager" raster basemap — reliable, light, and it
 * suits the warm palette. Good for launch-scale traffic.
 *
 * Production (recommended once you're growing): paste a free MapTiler key
 * below. MapTiler's free tier is 100k tile loads/month and explicitly allows
 * commercial use. Get one at https://cloud.maptiler.com (30 seconds), then
 * restrict it to your domain in their dashboard — client-side map keys are
 * public by design, so the domain restriction is what protects it.
 */

/** Paste your MapTiler key here to switch providers. Empty = CARTO. */
export const MAPTILER_KEY = '';

/** MapTiler raster style: streets-v2 | basic-v2 | outdoor-v2 | bright-v2 */
const MAPTILER_STYLE = 'streets-v2';

/** URL for a single slippy-map tile. */
export function tileUrl(z: number, x: number, y: number): string {
  if (MAPTILER_KEY) {
    return `https://api.maptiler.com/maps/${MAPTILER_STYLE}/${z}/${x}/${y}.png?key=${MAPTILER_KEY}`;
  }
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
}

/** Attribution required by whichever provider is active. */
export const TILE_ATTRIBUTION = MAPTILER_KEY
  ? '© MapTiler © OpenStreetMap contributors'
  : '© CARTO © OpenStreetMap contributors';
