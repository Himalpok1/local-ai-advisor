import { CheckCircle2, CircleAlert, CircleSlash, CircleX, Gauge, ShieldCheck, TriangleAlert } from "lucide-react";
import { COMFORT_DESCRIPTION, COMFORT_LABEL, type ComfortLevel } from "@/lib/schemas/results";
import type { Confidence } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export const COMFORT_STYLE: Record<ComfortLevel, { text: string; bg: string; border: string; dot: string; Icon: typeof CheckCircle2 }> = {
  excellent: { text: "text-excellent", bg: "bg-excellent/12", border: "border-excellent/40", dot: "bg-excellent", Icon: ShieldCheck },
  comfortable: { text: "text-comfortable", bg: "bg-comfortable/12", border: "border-comfortable/40", dot: "bg-comfortable", Icon: CheckCircle2 },
  acceptable: { text: "text-[color-mix(in_oklch,var(--c-acceptable)_75%,black)] dark:text-acceptable", bg: "bg-acceptable/15", border: "border-acceptable/50", dot: "bg-acceptable", Icon: Gauge },
  borderline: { text: "text-borderline", bg: "bg-borderline/12", border: "border-borderline/40", dot: "bg-borderline", Icon: TriangleAlert },
  "technically-runs": { text: "text-technical", bg: "bg-technical/10", border: "border-technical/40", dot: "bg-technical", Icon: CircleAlert },
  "does-not-fit": { text: "text-nofit", bg: "bg-nofit/12", border: "border-nofit/40", dot: "bg-nofit", Icon: CircleX },
  unsupported: { text: "text-unsupported", bg: "bg-unsupported/12", border: "border-unsupported/40", dot: "bg-unsupported", Icon: CircleSlash },
};

export function ComfortBadge({ level, size = "md", className }: { level: ComfortLevel; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = COMFORT_STYLE[level];
  return (
    <span
      title={COMFORT_DESCRIPTION[level]}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold",
        s.text,
        s.bg,
        s.border,
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
        <span key={l} title={COMFORT_LABEL[l]} className={cn("h-1.5 w-6 rounded-full", i <= idx && idx >= 0 ? COMFORT_STYLE[level].dot : "bg-border")} />
      ))}
    </div>
  );
}

export function ConfidenceBadge({ level, className }: { level: Confidence; className?: string }) {
  const map = { high: "bg-comfortable/12 text-comfortable", medium: "bg-acceptable/15 text-[color-mix(in_oklch,var(--c-acceptable)_75%,black)] dark:text-acceptable", low: "bg-muted text-muted-foreground" };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", map[level], className)}>{level[0].toUpperCase() + level.slice(1)} confidence</span>;
}
