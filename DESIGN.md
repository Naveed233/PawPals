---
name: PawPair
description: A dog-friendship and meetup app drawn as one sunny-day cheki (instant-photo) album.
colors:
  sky-ground: "#E7F0FA"
  sky-ground-top: "#F3F8FD"
  sky-tint: "#D3E5F7"
  sky-scrim: "rgba(231,240,250,0.97)"
  print-white: "#FFFFFF"
  print-edge: "#DCE3EE"
  input-mist: "#F2F6FB"
  cobalt: "#3552D9"
  cobalt-soft: "#E1E6FB"
  sunflower: "#FFC53D"
  marker-navy: "#1B2340"
  ink-muted: "#4B5670"
  ink-faint: "#5A6480"
  success-green: "#1E7A4C"
  success-soft: "#DDF0E4"
  danger-red: "#BA3329"
  danger-soft: "#FBE4E1"
  mint: "#D5EFE0"
  mint-ink: "#1D5C3E"
  lilac: "#E3DDF6"
  lilac-ink: "#4A3A8C"
  blossom: "#F9DCE2"
  blossom-ink: "#8C2F45"
  butter: "#FCEBB6"
  butter-ink: "#6E5100"
  sky-ink: "#1F4E85"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "30px"
    fontWeight: 900
  print-name:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "28px"
    fontWeight: 900
    letterSpacing: "-0.4px"
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "22px"
    fontWeight: 800
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "18px"
    fontWeight: 800
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
  button:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "15px"
    fontWeight: 700
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 700
  group-heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 800
    letterSpacing: "0.6px"
  caption:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 800
rounded:
  print-inset: "3px"
  print: "6px"
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.print-white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 16px"
  button-ink:
    backgroundColor: "{colors.marker-navy}"
    textColor: "{colors.print-white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.marker-navy}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.print-white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-danger-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.danger-red}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
  chip:
    backgroundColor: "{colors.print-white}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  chip-selected:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.print-white}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  tag-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.mint-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  tag-butter:
    backgroundColor: "{colors.butter}"
    textColor: "{colors.butter-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  tag-sky:
    backgroundColor: "{colors.sky-tint}"
    textColor: "{colors.sky-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  tag-blossom:
    backgroundColor: "{colors.blossom}"
    textColor: "{colors.blossom-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  tag-lilac:
    backgroundColor: "{colors.lilac}"
    textColor: "{colors.lilac-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  tag-cobalt:
    backgroundColor: "{colors.cobalt-soft}"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  field:
    backgroundColor: "{colors.input-mist}"
    textColor: "{colors.marker-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.print-white}"
    textColor: "{colors.marker-navy}"
    rounded: "{rounded.lg}"
    padding: "16px"
  print-card:
    backgroundColor: "{colors.print-white}"
    textColor: "{colors.marker-navy}"
    rounded: "{rounded.print}"
    padding: "12px 12px 0"
  compat-sticker:
    backgroundColor: "{colors.sunflower}"
    textColor: "{colors.marker-navy}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  match-paw:
    backgroundColor: "{colors.sunflower}"
    textColor: "{colors.marker-navy}"
    rounded: "{rounded.pill}"
    size: "48px"
  deck-like:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.print-white}"
    rounded: "{rounded.pill}"
    size: "64px"
  deck-pass:
    backgroundColor: "{colors.print-white}"
    textColor: "{colors.marker-navy}"
    rounded: "{rounded.pill}"
    size: "60px"
  tab-bar:
    backgroundColor: "{colors.print-white}"
    rounded: "{rounded.pill}"
    height: "66px"
  tab-active:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.print-white}"
    rounded: "{rounded.pill}"
    width: "54px"
    height: "40px"
  action-sheet:
    backgroundColor: "{colors.print-white}"
    textColor: "{colors.marker-navy}"
    rounded: "{rounded.xl}"
    padding: "24px"
  action-row:
    backgroundColor: "{colors.input-mist}"
    textColor: "{colors.marker-navy}"
    rounded: "{rounded.lg}"
    padding: "12px"
  action-row-destructive:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-red}"
    rounded: "{rounded.lg}"
    padding: "12px"
  language-toggle-active:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.print-white}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
---

# Design System: PawPair

## Overview

**Creative North Star: "The Sunny-Day Cheki Album"**

Every dog is an instant-photo print. The discovery deck is a stack of prints on a table, a match is two prints developing side by side, and the whole app is one album laid out under a clear sky: a pale sky-blue ground, white prints with soft navy-tinted shadows, and every word written in the same marker-navy ink. The dog's photo is the hero and stays clean; the facts sit on the print's thick bottom margin like a handwritten caption, and the only thing stuck on the photo is a sunflower sticker carrying the compatibility score, the way people decorate cheki prints.

Colour has a strict division of labour. Cobalt carries every action, as a fill and as text, so there is one hue to learn for "you can press this". Sunflower is kept back for the two moments of delight (the compatibility sticker and the match paw), and it stays sunny by being scarce. Pastel camera-body tints (mint, lilac, blossom, butter, sky) label categories, always with their own deep ink. The palette was chosen by measurement, not taste: contrast and colour-vision separation were measured for every pairing, and the alternatives that failed are recorded below.

The density is phone-first and calm: short sessions, often outdoors in daylight, one decision per screen. Motion is an enhancement, never a gate on content, with exactly one authored moment (the match prints developing). The system refuses the full-bleed swipe card with a dark gradient over the photo and text printed on it, and it refuses the cream-and-coral "friendly app" default.

**Key Characteristics:**
- Sky ground, white prints, marker-navy ink for all text.
- Cobalt for every action; sunflower fill for reward moments only.
- Dog photos sit inside print frames: near-square corners, a thicker caption margin, a slight turn.
- Everything you touch is a pill; containers are softly rounded; prints are nearly square.
- Soft navy-tinted shadows lift prints and floating controls; flat controls stay flat.
- One stroke-drawn icon set; the paw is the like.
- One system type family; hierarchy from weight (900 to 400) and size.
- Japanese first, English second, in the same boxes.

## Colors

A clear-day album: cool sky ground, white paper, navy ink, one cobalt for action, one sunflower kept for joy, and soft pastel category tints that each carry their own ink.

Screens use the role names in `src/theme.ts` (`tone.action`, `tone.accentInk`, `tone.reward`, `tone.ink`…), never raw hex.

### Primary
- **Cobalt** (#3552D9): the single action colour, as a fill and as text. Primary buttons, the like paw button, the active tab pill, selected chips, the active language segment, checked checkboxes, links, the web focus ring and text selection, the "LIKE" drag stamp, loading spinners, large score numerals. Measured: white on cobalt 6.25:1; cobalt as text on the sky ground 5.43:1 and on white 6.25:1, so one hue serves fill, text, outline and focus.
- **Cobalt Soft** (#E1E6FB): the quiet cobalt surface for a cobalt-ink tag. Faint ink on it measured 4.74:1.

### Secondary
- **Sunflower** (#FFC53D): reward fill only. The compatibility sticker on a print's photo and the round paw between the two developing match prints. Content on it is always marker-navy ink, measured 9.78:1. Sunflower as text measured 1.58:1, which is why it never carries text, outlines or focus.

### Tertiary
Pastel camera-body tints for categories and tags, each paired with its own ink (every ink on its pastel measured 6.23–7.01:1):
- **Mint** (#D5EFE0) with **Mint Ink** (#1D5C3E): walks, the default friendly tag, verified pills.
- **Butter** (#FCEBB6) with **Butter Ink** (#6E5100): cafés, the Premium marker.
- **Sky Tint** (#D3E5F7) with **Sky Ink** (#1F4E85): parks. Sky Tint is also the web surround behind the phone column, the dog-profile hero backdrop and the map fallback.
- **Blossom** (#F9DCE2) with **Blossom Ink** (#8C2F45): playdates.
- **Lilac** (#E3DDF6) with **Lilac Ink** (#4A3A8C): profile stat chips.

### Neutral
- **Sky Ground** (#E7F0FA): the album page behind every screen; also the browser `theme-color`. Marker-navy on it measured 13.40:1.
- **Sky Ground Top** (#F3F8FD): the top stop of the clear-sky wash, a vertical fade into Sky Ground at the head of Discover (280px), Welcome, auth and call screens.
- **Sky Scrim** (rgba(231,240,250,0.97)): the near-opaque album page behind the match prints.
- **Print White** (#FFFFFF): prints, cards, the tab bar, dialogs, and text or icons on cobalt and danger fills.
- **Print Edge** (#DCE3EE): hairline borders on cards, fields, chips, the tab bar; dividers; scrollbars.
- **Input Mist** (#F2F6FB): in-app field fill, action-sheet rows, the photo well behind a loading image, language toggle track.
- **Marker Navy** (#1B2340): all primary text, ink buttons, content on sunflower, and the tint of every shadow.
- **Ink Muted** (#4B5670): secondary text, meta lines, inactive tab icons, ghost buttons. Measured 6.37:1 on the ground.
- **Ink Faint** (#5A6480): placeholders, group headings, the faintest text that still passes 4.5:1 on ground, print and input.

### States
- **Success Green** (#1E7A4C) and **Success Soft** (#DDF0E4): the verified tick on a print caption, confirmations.
- **Danger Red** (#BA3329) and **Danger Soft** (#FBE4E1): field errors, destructive buttons and sheet rows, the match-count badge. Measured: white on danger 5.84:1, danger on danger-soft 4.81:1.

### Named Rules
**The One Cobalt Rule.** Every pressable thing that needs colour is cobalt: fill, text, outline and focus. There is no second action hue, and no amber stand-in for links or focus.

**The Scarce Sunflower Rule.** Sunflower is a fill for reward moments only, with ink on top. Never sunflower text, outline, border or focus ring, never a sunflower button. If a screen has more than one sunflower element, one of them is wrong.

**The Ink-On-Pastel Rule.** A pastel tint always carries its own ink. Never white on a pastel, never cobalt on a mint, butter, blossom, lilac or sky chip.

**The Measured Hue Rule.** A new hue enters only after it keeps colour-vision separation at or above ΔE 44 against cobalt, sunflower and danger red under protanopia, deuteranopia and tritanopia simulation, and passes contrast in its role. The measured floor today: cobalt vs sunflower ΔE ≥ 67.7 (including tritanopia), cobalt vs danger ΔE ≥ 97, sunflower vs danger ΔE ≥ 44. Rejected by this test: an all-sunflower action (1.58:1 as text, would need a second amber for text and focus) and park green #1B7F48 (ΔE 12.1 against the delete red under protanopia).

## Typography

**Display Font:** the platform system face (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` on web; Japanese glyphs from the OS: Hiragino Sans, Yu Gothic or Noto Sans CJK JP)
**Body Font:** the same system face

**Character:** one face, spoken loudly or softly. Names and titles shout in black weight (900) with slightly tight tracking, labels speak in bold, and body text stays regular and roomy. The system stack is a product constraint (Japanese glyph coverage on every OS without multi-megabyte font bundles), not a stylistic default; the voice comes from weight, size and the print layout around it.

### Hierarchy
- **Display** (900, 30px): page titles (Matches), dog and owner names on their pages, event titles, the call screen name. Hero moments push this to 28–32px with -0.3 to -0.5px tracking: the welcome headline (28px, 39px line height), the match title (32px).
- **Print Name** (900, 28px, -0.4px): the dog's name on a print's caption strip. One line, truncated.
- **Headline** (800, 22px): empty-state titles, dialog and sheet titles (900 there), the drag stamps (900, 2px tracking).
- **Title** (800, 18px): screen header titles (900 on Discover), profile section headings, chat partner name, host name.
- **Body** (400, 15px, 22px line height): descriptions, bios, empty-state copy; 24px line height for the welcome subline. Breed lines on prints are body at 700.
- **Button** (700, 15px): all `Button` labels. The auth primary uses 16px/800 and the welcome cover CTA 20px/800.
- **Label** (700, 13px): field labels, meta lines (600), chip and tag text (600), safety copy (400, 20px line height).
- **Group Heading** (800, 13px, 0.6px tracking, uppercase in English, faint ink): the single heading of a group of settings rows or form cards (Privacy, Language, Pets, Photos). It is the group's only heading, never a line above a larger headline.
- **Caption** (800, 11px): labels under the deck buttons, badge counts, photo counts, verified pills, field errors (600).

### Named Rules
**The One Family Rule.** One system family carries everything. Hierarchy comes from weight (900 names, 800 headings, 700 labels, 400 body) and size, never from a second face, italics or decorative type.

**The Japanese First Rule.** Every string ships in Japanese and English in the same box. Lay out and test in Japanese first, break Japanese headlines by hand at phrase boundaries, keep body line height at about 1.45× or more, and let English fit the space Japanese defined.

## Layout

Phone first, one column, one decision per screen. On the web the whole app is a phone-width column (max 520px) centred on a Sky Tint surround, lifted by the card shadow, so a laptop sees the same composition rather than a stretched deck. Reading measures inside it are narrower: welcome 560px max (bounded by the column), auth 460px, match content 380px.

Spacing runs on a 4px base: 4, 8, 12, 16, 24, 32. Screen gutters are 16px on Discover and list screens and 24px on cover-like screens (welcome, auth, match, dialogs). Gaps between stacked controls are 8–16px.

Discover is the template: a header row (round filter button left, centred title, matching spacer right), the print stack filling the free height with 16px side margins that leave room for the tilted back print, then a row of round deck buttons (pass, undo, like, save) 16px apart, then the floating tab bar. The tab bar floats 24px in from each side and max(safe-area inset, 12px) + 4px above the bottom; every screen keeps that offset plus the 64px bar plus 12px clear at the bottom so content never hides behind it.

Touch targets are at least 44×44 (deck buttons 48, 60 and 64; hit slop on smaller targets). Statically rendered web pages size from percentages and aspect ratios, never from window measurement during render, so the pre-rendered layout survives hydration. Touch-screen web inputs render at 16px so iOS Safari does not zoom on focus; pinch zoom stays enabled.

### Named Rules
**The Centred Column Rule.** Wider screens get more sky, not more app. The column stops at 520px and the surround is Sky Tint.

## Elevation & Depth

Depth is physical and soft: things that are prints, or that float over the page, cast a diffuse shadow tinted with marker navy (never black); controls that sit on a surface stay flat. Prints add depth by turning slightly, the way photos lie on a table. Scrims are either the light Sky Scrim (the album page behind the match) or a deep navy veil at 50–55% (behind the action sheet, under the photo-count chip). Over dog photos there is no dark gradient; the profile hero only fades into Sky Tint at its bottom 120px where the white sheet overlaps it.

### Shadow Vocabulary
- **Print** (`box-shadow: 0 8px 16px rgba(27,35,64,0.18)`): a print lying on the table. The deck print, the welcome and auth cover prints, the match prints.
- **Card** (`box-shadow: 0 10px 18px rgba(27,35,64,0.12)`): floating emphasis. The like button, the welcome CTA, the match paw, the action sheet, the web column.
- **Tab Bar** (`box-shadow: 0 8px 18px rgba(27,35,64,0.14)`): the floating pill tab bar.
- **Soft** (`box-shadow: 0 4px 10px rgba(27,35,64,0.08)`): resting lift. Cards, round deck buttons, empty-state icon discs, the compatibility sticker.

### Named Rules
**The Prints Lift Rule.** Prints and floating controls cast navy-tinted shadows; inputs, chips, tags and rows inside a surface do not. A shadow is never black and never a hard offset.

## Shapes

Two corner languages. Prints are nearly square: a 6px outer corner, a 3px corner on the inset photo, and a frame that is even on three sides with a thick caption margin at the bottom (12px frame on the deck print, 9px on match prints, 8px on the small auth print; 44px bottom on the welcome cover print). Everything you touch is a pill: buttons, chips, tags, the tab bar and its active slot, round deck buttons, the sticker, the language toggle, badges. Containers between the two are softly rounded: 10px fields, 16px cards and sheet rows, 20px dialogs and profile inner cards, 28px top corners on the white sheet that overlaps a profile hero.

Prints turn: the welcome cover -2°, the auth print -3°, match prints -6° and +5° (overlapping by 26px), the next print in the deck 2.5° and 97% scale peeking 6px below. Drag stamps turn ±14°. Borders are hairlines: 1px Print Edge on cards and the tab bar, 1.5px on buttons, chips and in-app fields.

### Named Rules
**The Print Frame Rule.** When a dog's photo stands for the dog as an object (deck card, cover, match), it sits inside a white print frame with a 6px corner, a 3px photo corner and a thicker bottom caption margin. Thumbnails and avatars in lists, chat and the map use plain rounded crops (circles, or 10–16px corners) and are not framed as prints.

## Components

### Buttons
Confident, round-ended and quiet in motion.
- **Shape:** full pill (999px), 52px tall, 16px side padding, 1.5px border in the fill colour.
- **Primary:** cobalt fill, white 15px/700 label, optional leading icon 8px from the label. It marks the main path of a view; alternatives step down to outline and ghost.
- **Ink:** marker-navy fill, white label: the secondary call to action (also the Apple sign-in pill).
- **Outline:** transparent with a Print Edge border and ink label: the alternative path ("View profile", "Adjust filters").
- **Ghost:** no fill, no border, ink-muted label: the way out ("Keep swiping").
- **Danger / Danger Quiet:** danger fill with white label for a confirmed destructive step; danger text with no fill for the quiet entry point to one.
- **Press / Disabled:** press drops opacity to 85% and scales to 0.99; disabled sits at 45% opacity; loading swaps the label for a spinner in the label colour. Web focus is a 3px cobalt outline offset 2px.

### Chips
- **Style:** pill, 8px × 12px padding, 1.5px border, 13px/600 label.
- **State:** unselected is white with a Print Edge border and ink-muted text; selected is a cobalt fill with white text. Used for filters and multi-select choices.

### Tags
- **Style:** pill, 6px × 12px padding, no border, 13px/600, a pastel fill with its own ink (mint, butter, sky, blossom, lilac), or cobalt-soft with cobalt ink.
- **Use:** categories (walk, café, park, playdate), temperament and traits. Tags label; they are not pressable.

### Cards / Containers
- **Corner Style:** softly rounded (16px).
- **Background:** Print White on the Sky Ground.
- **Shadow Strategy:** Soft (see Elevation & Depth).
- **Border:** 1px Print Edge.
- **Internal Padding:** 16px.

### Inputs / Fields
- **Style:** in-app fields are Input Mist with a 1.5px Print Edge border, 10px corners, 12px × 16px padding, 15px ink text, a 13px/700 label 4px above, Ink Faint placeholder. Auth fields sit on the sky as white prints: 52px tall, 14px corners, 1px Print Edge, with a password eye button inside the right edge.
- **Focus:** the global web focus ring, 3px cobalt outline offset 2px; caret in ink.
- **Error:** border turns danger red, with a short danger message below (11–12px). Disabled controls drop to 45–55% opacity.

### Navigation
- **Tab bar:** a floating white pill 66px tall with a 1px Print Edge border and the Tab Bar shadow, 24px in from each side. Icon-only (23px stroke icons) with the tab titles as accessible names. The active tab is a 54×40 cobalt pill with a white icon; inactive icons are ink-muted. The match count badge is danger red with white 11px/700 numerals.
- **Headers:** a 44–48px round white back or filter button on the left (a cobalt count badge on the filter button when filters are on), a centred 18px/900 title, a matching spacer on the right.
- **Language toggle:** a segmented pill (日本語 / EN) on Input Mist with a Print Edge border; the active segment is a cobalt pill with a white 12px/700 label. Visible on welcome and auth screens and in profile settings.

### The Print Card (signature)
The discovery card. A white print with a 6px corner, a 12px frame on top and sides and the Print shadow. The photo fills the frame with a 3px corner and stays clean: only the compatibility sticker (bottom-left, 12px in: a sunflower pill with an ink paw and "相性 87%" in 13px/800, Soft shadow) and, when there are several photos, a photo-count pill (top centre, deep navy veil, white camera icon and 11px/800 count). Under the photo, the caption strip: the dog's name in Print Name type with a 20px green verified disc and a chevron, the breed and age in 15px/700 ink, the area and distance after a pin icon in 13px/600 ink-muted, and an optional one-line note. A missing photo shows a deterministic pastel gradient with a drawn ink-muted paw.

### The Deck
Prints stack: the next one peeks out, turned 2.5°, scaled to 97% and dropped 6px. Dragging turns the top print up to ±9° and fades in a stamp: "いいね / LIKE" in cobalt or "パス / PASS" in ink, 22px/900 with 2px tracking, inside a 3px border of the same colour on 92% white, turned ±14°. Past 26% of the width the print flies off in about 200ms; short of it, it springs back. Under the deck: pass (60px white circle, ink ×), undo (48px, disabled at 35%), like (64px cobalt circle, white paw, Card shadow), save (48px, cobalt when saved); pass and like carry 11px/800 labels so the choice never relies on colour. Pressing scales a round button to 0.92. Tapping like first walks a short trail of paw prints across the print, then sends it off.

### The Developing Match
The one authored motion moment. On the Sky Scrim, a 32px/900 "マッチしました！" and a one-line lead in 15px/700, then two 148px-wide prints (9px frame) turned -6° and +5° and overlapping, with a 48px sunflower paw disc (Card shadow) between them. Each photo starts behind a milky cool film (#D6DEE8) and a 6px blur and clears to full colour and focus over 1.6s with an exponential ease-out, the second print starting 450ms after the first. With reduced motion the prints appear already developed. Below, the safety line in 13px ink-muted, then primary "Send a message", outline "View profile" and ghost "Keep swiping".

### Action Sheet
In-app confirmation that replaces browser dialogs. A centred white card (20px corners, 24px padding, Card shadow) on a deep navy 50% veil, fading in. A 22px/900 centred title and a 13px ink-muted message, then rows: Input Mist with a Print Edge border, 16px corners, 12px padding, a 15px/800 label and an optional 11px sub-label. A destructive row is Danger Soft with a danger label. Cancel is a plain ink-muted text button.

## Do's and Don'ts

### Do:
- **Do** use cobalt (#3552D9) for every action: primary button, like, active tab, selected chip, link, focus ring.
- **Do** keep sunflower (#FFC53D) to the compatibility sticker and the match paw, with marker-navy ink on it.
- **Do** set a dog's photo inside a print frame (6px corner, 3px photo corner, thick caption margin) when the photo stands for the dog, and turn prints a few degrees.
- **Do** write all text in marker navy, ink-muted or ink-faint; each passes 4.5:1 on the ground, on print white and on input mist.
- **Do** pair every pastel tag with its own ink (mint with mint ink, butter with butter ink, and so on).
- **Do** draw icons from the one stroke set: 24px grid, 2px round-capped strokes (2.2–3.5px only when drawn small), filled paw for like and reward.
- **Do** give like and pass a label and a distinct icon as well as a colour.
- **Do** keep the web app a 520px phone column centred on the Sky Tint surround.
- **Do** tint every shadow with marker navy (rgba(27,35,64,…)) and keep it soft.
- **Do** show the developed print immediately when reduced motion is on, and keep content visible if an animation never runs.
- **Do** measure a new hue for contrast and for ΔE ≥ 44 against cobalt, sunflower and danger under colour-vision simulation before adding it.

### Don't:
- **Don't** build the full-bleed swipe card with a dark gradient over the photo and the name printed on it; the photo stays clean and the facts live on the caption strip.
- **Don't** fall back to the cream-and-coral "friendly app" palette.
- **Don't** use sunflower as text, outline, border or focus ring (1.58:1), and don't add a second amber or gold to cover for it.
- **Don't** introduce a second action hue; park green (#1B7F48) was rejected for collapsing into the delete red under protanopia.
- **Don't** use emoji as interface icons: in action rows, badges, category tags, placeholders or avatars. Emoji typed by people in chats and bios are their content, not the interface.
- **Don't** use hearts, flames or romance cues; PawPair is not a dating app and the like is a paw.
- **Don't** put white or cobalt text on a pastel tint.
- **Don't** set a small uppercase line above a headline; a group heading is the only heading of its group.
- **Don't** use hard offset shadows or black shadows.
- **Don't** stretch the deck or any screen across a laptop width.
- **Don't** reach for the legacy aliases (`night.pink`, `night.coral`, `brand.*`, `colors.coral`) in new code; use the `tone` roles.
