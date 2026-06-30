# 🐾 PawPair

A dog friendship & meetup app — *"Tinder for dogs."* Owners create profiles, but
**dogs are the main card**. Swipe to find compatible playmates for walks, playdates,
and meetups nearby.

> PawPair is a dog friendship and meetup platform — **not** a human dating app.

This repo currently contains the **first vertical slice** of the MVP, built end-to-end
on real app architecture (Expo + expo-router + a persisted state store), not static mockups.

---

## What's built in this slice

| Flow | Status |
| --- | --- |
| Email sign-in / create account | ✅ working (local/mock auth) |
| Owner profile onboarding | ✅ working |
| Dog profile onboarding (full detail form + validation) | ✅ working |
| Discovery swipe deck (gesture + buttons) | ✅ working |
| Swipe left/right, undo, save, tap-to-open | ✅ working |
| Compatibility score + human-readable reasons | ✅ working |
| Mutual match → celebration screen | ✅ working |
| Matches list | ✅ working |
| Full dog profile | ✅ working |
| Owner profile / stats / sign out / reset demo | ✅ working |
| Persistence across app reloads (AsyncStorage) | ✅ working |
| Accessibility: like/pass buttons as swipe alternative, labels | ✅ working |
| Loading / empty / image-error states | ✅ working |

## Slice 2 additions

| Feature | Status |
| --- | --- |
| Animated Welcome screen (new first screen) | ✅ working |
| Reanimated effects (entrances, match heart-burst, like-pop, spring buttons, floating hero) | ✅ working |
| 12 demo users with distinct **procedural avatars** (gradient + emoji) | ✅ working |
| Real photo upload via device picker (onboarding + profile) | ✅ wired (expo-image-picker) |
| Likeable photo gallery on profiles, **anonymous likes** + counts | ✅ working |
| "Looking for" intents — dates **and** meetups / hangouts / events | ✅ working |

**On animations:** the brief asked for anime.js — but anime.js is DOM/CSS/SVG only and can't
drive native React Native views, so this uses `react-native-reanimated` (correct for RN, runs on
the native UI thread). Note: reanimated's `entering={FadeInDown}` layout animations don't complete
on react-native-web, so entrances here are mount-driven shared-value animations that keep content
visible even if the animation engine is paused.

**On photos:** AI image generation was unavailable (no Hugging Face token) and stock-site scraping
is unreliable + licence-murky, so demo profiles use deterministic procedural avatars and real
users add photos via the picker. To use your own welcome illustration, drop it at
`assets/images/welcome-hero.png` and follow the comment in `src/app/welcome.tsx`.

## Slice 3 additions — chat & calls (from a match)

| Feature | Status |
| --- | --- |
| Text chat from a match (persisted) | ✅ working |
| Suggested opening messages | ✅ working |
| Image messages via device picker | ✅ working |
| Typing indicator + simulated replies | ✅ working |
| Voice & video **call UI** (connecting → timer, mute / camera / end) | ✅ UI shell, clearly labeled |
| Entry points: Matches row, match screen, profile "Message" button | ✅ working |

**On calls:** real voice/video (WebRTC) needs a signaling server, STUN/TURN, and an actual second
participant — none of which exist in a local single-user demo. So the call screens are an honest
UI shell (no fake camera/mic stream), labeled "Demo call — not a real connection." Wiring real
calls is a backend slice.

## Slice 4 additions — real photos, profile editing, events

| Feature | Status |
| --- | --- |
| **Real bundled photos** — breed-matched dogs (dog.ceo) + owner portraits (randomuser.me) | ✅ working |
| Edit your owner profile (incl. your photo) | ✅ working |
| Edit your dog profile (incl. photos) | ✅ working |
| **Events / meetups** tab — browse, RSVP, attendee list | ✅ working |
| Host (create) an event | ✅ working |

**On photos:** cleanpng was declined — it's an ad-walled, hotlink-protected site with murky
redistribution licensing. Instead, real freely-available photos are downloaded into
`assets/images/{dogs,people}/` and bundled (offline-safe). Priority: your uploaded photo →
bundled seed photo → procedural avatar. Replace any with your own files anytime.

## What is mocked (and clearly labeled in-app)

These need external credentials/infra and are **intentionally stubbed** for the prototype —
nothing is faked silently:

- **Auth** — email/Google/Apple sign-in stores a local session; there is no real server
  or password check. The Google/Apple buttons say so before continuing.
- **The "other owner liked you" side of a match** — each demo dog carries a `likesYou`
  flag (`src/data/seed.ts`). Right-swiping a dog with `likesYou: true` produces an instant
  mutual match so the match flow is demoable with a single user.
- **Photos** — remote sample images with a themed emoji fallback if they fail to load.

## Not in this slice (next stages)

Real-time chat, meetup scheduling, map/places, push notifications, filters,
verification, subscriptions, and the admin/moderation dashboard. The five-tab nav
(adding Meetups + Messages) and these flows come next.

---

## Run it

```bash
npm install
npm start          # then press i (iOS), a (Android), or w (web)
```

To reset to a fresh user: Profile tab → **Sign out**, or delete the app's storage.

## Verify the build

```bash
npx tsc --noEmit       # type-check (passes clean)
npx expo export -p ios # production Metro bundle (passes)
```

> Note: the above verify the code compiles and bundles. On-device runtime behavior
> (gestures, persistence, image loads) should be confirmed in a simulator/device.

---

## Architecture

```
src/
  app/                      # expo-router file-based routes
    _layout.tsx             # providers (gesture root, safe area) + stack
    index.tsx               # splash + onboarding router (redirects by state)
    sign-in.tsx
    onboarding/{owner,dog}.tsx
    (tabs)/{index,matches,profile}.tsx
    match.tsx               # match celebration (modal)
    dog/[id].tsx            # full dog profile
  components/               # DogCard, SwipeDeck, DogPhoto, Screen, ui, form
  data/{seed,options}.ts    # demo deck + selectable option sets
  lib/compatibility.ts      # pure, testable scoring function
  store.ts                  # zustand + AsyncStorage (single source of truth)
  theme.ts                  # design tokens
  types.ts                  # domain models
```

Key decisions:
- **Matches & swipes reference a specific dog profile**, not the owner (per the brief).
- **Compatibility is a transparent heuristic, never a safety guarantee** — the UI says so.
- **Owner is supporting info** beneath the dog, never the hero of the card.
