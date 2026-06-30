import type { DogProfile, Energy, Size } from '@/types';

/**
 * Deterministic compatibility score between MY dog and ANOTHER dog.
 *
 * This is a transparent heuristic, NOT a safety guarantee. It returns a 5-99
 * score plus the specific reasons that pushed it up, so the UI can explain
 * itself ("Similar energy levels", "Both enjoy gentle play", ...).
 *
 * Design notes:
 *  - Pure function: same inputs -> same output. Easy to unit test.
 *  - Starts at a neutral baseline and adjusts by weighted factors.
 *  - Never claims safety; reasons are descriptive, not reassuring.
 */

const ORDER_SIZE: Record<Size, number> = { small: 0, medium: 1, large: 2 };
const ORDER_ENERGY: Record<Energy, number> = { low: 0, moderate: 1, high: 2 };

export interface CompatibilityResult {
  score: number;
  reasons: string[];
}

function overlap(a: string[], b: string[]): string[] {
  const set = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => set.has(x.toLowerCase()));
}

export function computeCompatibility(mine: DogProfile, theirs: DogProfile): CompatibilityResult {
  let score = 50;
  const reasons: string[] = [];

  // Distance — closer is better.
  if (theirs.distanceKm <= 3) {
    score += 15;
    reasons.push(`Very close by (${theirs.distanceKm} km away)`);
  } else if (theirs.distanceKm <= 8) {
    score += 8;
    reasons.push(`Nearby (${theirs.distanceKm} km away)`);
  } else if (theirs.distanceKm > 15) {
    score -= 10;
  }

  // Size compatibility.
  const sizeGap = Math.abs(ORDER_SIZE[mine.size] - ORDER_SIZE[theirs.size]);
  if (sizeGap === 0) {
    score += 10;
    reasons.push(`Both ${mine.size}-sized dogs`);
  } else if (sizeGap === 1) {
    score += 4;
  } else {
    score -= 8;
  }

  // Energy compatibility.
  const energyGap = Math.abs(ORDER_ENERGY[mine.energy] - ORDER_ENERGY[theirs.energy]);
  if (energyGap === 0) {
    score += 12;
    reasons.push('Similar energy levels');
  } else if (energyGap === 1) {
    score += 5;
  } else {
    score -= 8;
  }

  // Play-style overlap.
  const sharedPlay = overlap(mine.playStyle, theirs.playStyle);
  if (sharedPlay.length > 0) {
    score += Math.min(sharedPlay.length, 3) * 5;
    reasons.push(`Both enjoy ${sharedPlay.slice(0, 2).map((s) => s.toLowerCase()).join(' and ')}`);
  }

  // Personality overlap (lighter weight).
  const sharedTraits = overlap(mine.personality, theirs.personality);
  if (sharedTraits.length > 0) {
    score += Math.min(sharedTraits.length, 2) * 3;
  }

  // Social levels — both confident, or a mismatch penalty.
  const social = new Set([mine.social, theirs.social]);
  if (mine.social === theirs.social) {
    score += 6;
  }
  if (social.has('shy') && social.has('very social')) {
    score -= 6;
  }

  // Preferred meetup type.
  if (mine.meetupPref === theirs.meetupPref) {
    score += 8;
    reasons.push(`Both prefer a ${mine.meetupPref.toLowerCase()}`);
  }

  // Size tolerance — does their dog get on with dogs my size?
  const wantsMine =
    (mine.size === 'small' && theirs.goodWith.smallDogs) ||
    (mine.size === 'large' && theirs.goodWith.largeDogs) ||
    mine.size === 'medium';
  if (wantsMine) {
    score += 5;
    reasons.push(`Comfortable with ${mine.size}-sized dogs`);
  }

  const clamped = Math.max(5, Math.min(99, Math.round(score)));
  return { score: clamped, reasons: reasons.slice(0, 4) };
}
