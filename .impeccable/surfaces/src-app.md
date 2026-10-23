---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: ["src/components","src/theme.ts"]
---

## Scope

The whole PawPair app shell (auth, onboarding, discover deck, matches, chat, map, events, profiles, edit flows). Mode: Operate. Phone first; laptop browsers get a centred phone-width column, never a stretched card.

## Audience and task

Japanese dog owners (English second) finding playmates for their dog: swipe, match, chat, meet in a public place. Short sessions, often outdoors in daylight.

## Direction contract

THESIS: Every dog is a cheki (instant photo) print. The deck is a stack of prints, a match develops two prints side by side, and the whole app is one sunny-day album. It refuses the full-bleed Tinder card with a gradient overlay, and the cream-and-coral "friendly app" default.

OWN-WORLD: a clear-sky tinted ground (#E7F0FA), white print surfaces with soft navy-tinted shadows, marker-navy ink (#1B2340) for all text, cobalt (#3552D9) for every action (primary buttons, the like paw, active tab, selected chips, links), sunflower (#FFC53D, ink content) kept for reward moments only (the compatibility sticker, the match paw), and pastel camera-body tints (mint, lilac, blossom, butter) as tag and category chips with ink text. Drawn icons in one stroke weight; no emoji as UI icons. Why cobalt, not an all-sunny action (measured, see DESIGN.md): sunflower fails as text (1.58:1) so links, outlines and focus would need a second amber hue for the same role, while cobalt serves fill and text alone (6.25:1 white on it, 5.43:1 as text on the ground); every colour-blind pairing stays at or above ΔE 44, cobalt vs sunflower ΔE 67.7 even under tritanopia; park green failed (ΔE 12.1 vs the delete red under protanopia). Sunflower stays sunny by being scarce.

STORY: the owner sees a real dog photo first, its name on the print's caption strip and its compatibility as a sticker on the photo, likes or passes in one tap, and gets one genuine moment of delight when a match develops. Safety copy stays visible and calm.

FIRST VIEWPORT: Discover. A white print card (photo inset, thick caption strip with name, breed, age, area and distance) centred on the sky ground, the next print peeking behind it; the compatibility score is a sunflower sticker on the photo's corner, because people decorate cheki prints with stickers and it is the deck's reward moment; pass and like as large round buttons under the print; filters top left; the floating tab bar at the bottom with the active tab as a cobalt pill.

FORM: cheki / instant-photo album, position 4 of my ordered list (park signage, dog ID tags, stamp rally, cheki, vet card, collar webbing, Shiba coat colours); seed:cf619c076404bf8c. Signature move: the print frame, and the "develop" effect (milky, cool, blurred to full colour) on the match screen.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Resolved

Palette: sunny, park and cobalt were measured and rendered in the real app, then compared side by side in Figma ("PawPair — palette study (cheki world)"). Committed: cobalt actions plus sunflower rewards on the sky ground. Numbers in DESIGN.md.
