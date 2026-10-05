import { CheckCircle2, CircleAlert, CircleSlash, CircleX, Gauge, ShieldCheck, TriangleAlert } from "lucide-react";
import { COMFORT_DESCRIPTION, COMFORT_LABEL, type ComfortLevel } from "@/lib/schemas/results";
import type { Confidence } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { CONFIDENCE_CHIP, TIER_CHIP } from "@/components/ui/tones";

type ComfortStyle = {
  /** Strong tone that stays readable as text on a plain background. */
  text: string;
  /** Soft tint for panels that also carry `text`. */
  bg: string;
  border: string;
  dot: string;
  /** Flat bright fill with ink text, for badges and labels. */
  chip: string;
  Icon: typeof CheckCircle2;
};

export const COMFORT_STYLE: Record<ComfortLevel, ComfortStyle> = {
  excellent: { text: "text-excellent", bg: "bg-excellent/12", border: "border-ink", dot: "bg-excellent", chip: TIER_CHIP.excellent, Icon: ShieldCheck },
  comfortable: { text: "text-comfortable", bg: "bg-comfortable/12", border: "border-ink", dot: "bg-comfortable", chip: TIER_CHIP.comfortable, Icon: CheckCircle2 },
  acceptable: { text: "text-acceptable", bg: "bg-acceptable/15", border: "border-ink", dot: "bg-acceptable", chip: TIER_CHIP.acceptable, Icon: Gauge },
  borderline: { text: "text-borderline", bg: "bg-borderline/12", border: "border-ink", dot: "bg-borderline", chip: TIER_CHIP.borderline, Icon: TriangleAlert },
  "technically-runs": { text: "text-technical", bg: "bg-technical/10", border: "border-ink", dot: "bg-technical", chip: TIER_CHIP.technical, Icon: CircleAlert },
  "does-not-fit": { text: "text-nofit", bg: "bg-nofit/12", border: "border-ink", dot: "bg-nofit", chip: TIER_CHIP.nofit, Icon: CircleX },
  unsupported: { text: "text-unsupported", bg: "bg-unsupported/12", border: "border-ink", dot: "bg-unsupported", chip: TIER_CHIP.unsupported, Icon: CircleSlash },
};

export function ComfortBadge({ level, size = "md", className }: { level: ComfortLevel; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = COMFORT_STYLE[level];
  return (
    <span
      title={COMFORT_DESCRIPTION[level]}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink font-bold",
        s.chip,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3.5 py-1.5 text-base",
        className,
      )}
    >
      <s.Icon className={size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3.5"} />
      {COMFORT_LABEL[level]}
    </span>
  );
}

const SCALE: ComfortLevel[] = ["technically-runs", "borderline", "acceptable", "comfortable", "excellent"];

/** Five-step scale showing where a rating sits. */
export function ComfortScale({ level }: { level: ComfortLevel }) {
  const idx = SCALE.indexOf(level);
  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${COMFORT_LABEL[level]}`}>
      {SCALE.map((l, i) => (
        <span key={l} title={COMFORT_LABEL[l]} className={cn("h-2.5 w-6 rounded-full border-[1.5px] border-ink", i <= idx && idx >= 0 ? "bg-ink" : "bg-card")} />
      ))}
    </div>
  );
}

export function ConfidenceBadge({ level, className }: { level: Confidence; className?: string }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border-[1.5px] border-ink px-2 py-0.5 text-xs font-bold", CONFIDENCE_CHIP[level], className)}>{level[0].toUpperCase() + level.slice(1)} confidence</span>;
}
