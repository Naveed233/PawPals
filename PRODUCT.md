# Product

<!-- impeccable:product-schema 1 -->

> Written from repository evidence (README, onboarding, i18n strings, theme notes, Supabase schema). The owner delegated the interview ("continue till redesign is complete"), so every line below is **inferred** unless it quotes the repo. Correct anything that is wrong.

## Platform

web

The live product is the Expo web export on GitHub Pages (`/PawPals`). iOS and Android builds are configured (`eas.json`) and share the same custom design language; it does not adapt per OS.

## Users

Dog owners in Japan, Japanese first and English second, looking for compatible playmates and walking companions for their dog nearby. Also people without a dog who want to meet dogs (the four pet-status options). Phone first, often outdoors or on the sofa, in short sessions; some use a laptop browser.

## Product Purpose

Help dogs make friends. Discover nearby dogs as swipe cards, a mutual like becomes a match, the owners chat and plan a meetup in a public, dog-friendly place, or join a group event. Success is a real, safe meetup.

## Positioning

"Dogs are the main card." The dog profile, photos and a compatibility score with human-readable reasons lead; the owner comes second. The repo states it repeatedly: PawPair is a dog friendship and meetup platform, **not** a human dating app.

## Operating Context

- Swipe deck with like / pass / undo / save, compatibility score, distance.
- Matches list and chat (text, images, suggested openers); voice/video call screens are a labeled demo shell.
- Map with opt-in "available to meet" presence; events with RSVP and calendar export.
- Owner and dog profiles, badges, edit flows, filters, "who liked you", boost. Premium is labels and gates in the UI; no payment exists.

## Capabilities and Constraints

- Expo SDK 56, expo-router, react-native-web, reanimated; Supabase auth, Postgres with RLS, storage (free plan).
- Every string ships in Japanese and English through `tx(ja, en)`; Japanese is the default.
- Colour, spacing, radius and type live in `src/theme.ts`; components read tokens.
- System fonts only (Japanese glyph coverage on every OS without multi-MB font bundles).

## Brand Commitments

- Name **PawPair**, paw motif, polite Japanese voice (です・ます) with safety reminders.
- Not a dating app: no hearts-and-flames romance cues for humans.
- Personality from `src/theme.ts`: "warm, outdoorsy, trust-first … parks, sunshine, happy dogs. Friendship & getting outside."

## Evidence on Hand

- Real dog photos (dog.ceo / Stanford Dogs) in `assets/images/dogs/`, owner portraits (randomuser.me) in `assets/images/people/`, `assets/images/welcome-bg.jpg`, `assets/images/login-dogs.jpg`.
- 12 demo dogs and owners in `src/data/` (synthetic).
- No user counts, testimonials, ratings or press exist. Do not invent them.

## Product Principles

1. The dog leads: photo and dog facts first, the human second.
2. Safety before excitement: mutual match before chat, public places, honest limits.
3. Two languages, always, with Japanese line breaking treated as a design constraint.
4. Honest states: never fake a connection, never silently lose data.
5. Fast to a real meetup, not endless swiping.

## Accessibility & Inclusion

Text meets WCAG 2.1 AA contrast (4.5:1 body, 3:1 large and UI parts). Like and pass never rely on colour alone. Touch targets at least 44×44. Respect reduced motion.
