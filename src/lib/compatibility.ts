import { JP_MEETUP, JP_PLAY_STYLE, JP_SIZE, jp } from '@/lib/jp';
import type { DogProfile, Energy, Size } from '@/types';

/**
 * Deterministic compatibility score between MY dog and ANOTHER dog.
 *
 * This is a transparent heuristic, NOT a safety guarantee. It returns a 5-99
 * score plus the specific reasons (in Japanese) that pushed it up, so the UI
 * can explain itself (「エネルギーレベルが近い」「遊び方の相性◎」...).
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
    reasons.push(`とても近い（${theirs.distanceKm}km先）`);
  } else if (theirs.distanceKm <= 8) {
    score += 8;
    reasons.push(`わりと近い（${theirs.distanceKm}km先）`);
  } else if (theirs.distanceKm > 15) {
    score -= 10;
  }

  // Size compatibility.
  const sizeGap = Math.abs(ORDER_SIZE[mine.size] - ORDER_SIZE[theirs.size]);
  if (sizeGap === 0) {
    score += 10;
    reasons.push(`どちらも${jp(JP_SIZE, mine.size)}犬`);
  } else if (sizeGap === 1) {
    score += 4;
  } else {
    score -= 8;
  }

  // Energy compatibility.
  const energyGap = Math.abs(ORDER_ENERGY[mine.energy] - ORDER_ENERGY[theirs.energy]);
  if (energyGap === 0) {
    score += 12;
    reasons.push('エネルギーレベルが近い');
  } else if (energyGap === 1) {
    score += 5;
  } else {
    score -= 8;
  }

  // Play-style overlap.
  const sharedPlay = overlap(mine.playStyle, theirs.playStyle);
  if (sharedPlay.length > 0) {
    score += Math.min(sharedPlay.length, 3) * 5;
    reasons.push(`遊び方の相性◎（${sharedPlay.slice(0, 2).map((s) => jp(JP_PLAY_STYLE, s)).join('・')}）`);
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
    reasons.push(`お互い「${jp(JP_MEETUP, mine.meetupPref)}」が好み`);
  }

  // Size tolerance — does their dog get on with dogs my size?
  const wantsMine =
    (mine.size === 'small' && theirs.goodWith.smallDogs) ||
    (mine.size === 'large' && theirs.goodWith.largeDogs) ||
    mine.size === 'medium';
  if (wantsMine) {
    score += 5;
    reasons.push(`${jp(JP_SIZE, mine.size)}犬にもフレンドリー`);
  }

  const clamped = Math.max(5, Math.min(99, Math.round(score)));
  return { score: clamped, reasons: reasons.slice(0, 4) };
}
