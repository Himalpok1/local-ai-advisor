/**
 * One place for the flat, outlined "chip" colours used by badges, matrix cells and tier labels.
 * Every chip is a bright fill with ink text, so contrast holds in light and dark mode.
 */
export type Tone = "neutral" | "primary" | "good" | "warn" | "bad";
export type Confidence = "high" | "medium" | "low";

const ON_FILL = "text-on-fill";

export const TONE_CHIP: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  primary: `bg-sticker-blue ${ON_FILL}`,
  good: `bg-fill-comfortable ${ON_FILL}`,
  warn: `bg-fill-acceptable ${ON_FILL}`,
  bad: `bg-fill-technical ${ON_FILL}`,
};

export const TIER_CHIP = {
  excellent: `bg-fill-excellent ${ON_FILL}`,
  comfortable: `bg-fill-comfortable ${ON_FILL}`,
  acceptable: `bg-fill-acceptable ${ON_FILL}`,
  borderline: `bg-fill-borderline ${ON_FILL}`,
  technical: `bg-fill-technical ${ON_FILL}`,
  nofit: `bg-fill-nofit ${ON_FILL}`,
  unsupported: "bg-fill-unsupported text-white",
} as const;

export const CONFIDENCE_CHIP: Record<Confidence, string> = {
  high: TIER_CHIP.comfortable,
  medium: TIER_CHIP.acceptable,
  low: "bg-muted text-muted-foreground",
};
