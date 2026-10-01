import type { ComfortLevel, DimensionLevel } from "@/lib/schemas/results";
import type { Ladder } from "@/lib/workloads/profiles";

/**
 * Map a value onto a continuous 0–4 score using a four-step ladder
 * [excellent, comfortable, acceptable, borderline].
 */
export function ladderScore(value: number, l: Ladder, higherIsBetter = true): number {
  if (!Number.isFinite(value)) return higherIsBetter ? 0 : 0;
  const [e, c, a, b] = l;
  if (higherIsBetter) {
    if (value >= e) return 4;
    if (value >= c) return 3 + (value - c) / (e - c);
    if (value >= a) return 2 + (value - a) / (c - a);
    if (value >= b) return 1 + (value - b) / (a - b);
    return Math.max(0, value / b);
  }
  if (value <= e) return 4;
  if (value <= c) return 3 + (c - value) / (c - e);
  if (value <= a) return 2 + (a - value) / (a - c);
  if (value <= b) return 1 + (b - value) / (b - a);
  return Math.max(0, 1 - (value - b) / b);
}

export function dimensionLevel(score: number): DimensionLevel {
  if (score >= 3.5) return "excellent";
  if (score >= 2.6) return "good";
  if (score >= 1.8) return "fair";
  if (score >= 1) return "poor";
  return "inadequate";
}

/** Composite thresholds. Shared so explanations can say what the next level needs. */
export const LEVEL_THRESHOLDS: { level: ComfortLevel; min: number }[] = [
  { level: "excellent", min: 3.4 },
  { level: "comfortable", min: 2.6 },
  { level: "acceptable", min: 1.8 },
  { level: "borderline", min: 1.0 },
  { level: "technically-runs", min: -Infinity },
];

export function levelFromComposite(composite: number): ComfortLevel {
  return LEVEL_THRESHOLDS.find((t) => composite >= t.min)!.level;
}

export function nextLevelThreshold(level: ComfortLevel): { level: ComfortLevel; min: number } | null {
  const i = LEVEL_THRESHOLDS.findIndex((t) => t.level === level);
  return i > 0 ? LEVEL_THRESHOLDS[i - 1] : null;
}

export const clamp = (x: number, lo = 0, hi = 4) => Math.min(hi, Math.max(lo, x));
