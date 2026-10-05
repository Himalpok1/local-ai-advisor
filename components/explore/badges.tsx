import type { BackendSupport, SupportLevel } from "@/lib/schemas";
import { SUPPORT_LABEL } from "@/lib/compatibility";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TIER_CHIP, type Tone } from "@/components/ui/tones";

export const SUPPORT_TONE: Record<SupportLevel, Tone> = {
  official: "good",
  community: "primary",
  bridge: "warn",
  experimental: "warn",
  unsupported: "bad",
};

/** Cell background for matrix tables, keyed by support level. */
export const SUPPORT_CELL: Record<SupportLevel, string> = {
  official: TIER_CHIP.comfortable,
  community: TIER_CHIP.excellent,
  bridge: TIER_CHIP.acceptable,
  experimental: TIER_CHIP.borderline,
  unsupported: "bg-muted text-muted-foreground",
};

export const SUPPORT_SHORT: Record<SupportLevel, string> = {
  official: "Official",
  community: "Community",
  bridge: "Bridge",
  experimental: "Experimental",
  unsupported: "—",
};

export function SupportBadge({ level, className }: { level: SupportLevel; className?: string }) {
  return (
    <Badge tone={SUPPORT_TONE[level]} className={className}>
      {SUPPORT_LABEL[level]}
    </Badge>
  );
}

type Maturity = BackendSupport["maturity"];
export const MATURITY_TONE: Record<Maturity, Tone> = { mature: "good", good: "primary", experimental: "warn" };
export const MATURITY_CELL: Record<Maturity, string> = {
  mature: TIER_CHIP.comfortable,
  good: "bg-sticker-blue text-on-fill",
  experimental: TIER_CHIP.acceptable,
};

export function MaturityBadge({ maturity, className }: { maturity: Maturity; className?: string }) {
  return (
    <Badge tone={MATURITY_TONE[maturity]} className={cn("capitalize", className)}>
      {maturity}
    </Badge>
  );
}

/** Five-dot bar for editorial 0–5 tiers (supports half steps). */
export function TierDots({ value, label, className }: { value: number; label: string; className?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${label}: ${rounded} of 5`} title={`${label}: ${rounded} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative size-2.5 overflow-hidden rounded-full border-[1.5px] border-ink bg-muted">
            {fill > 0 && <span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${fill * 100}%` }} />}
          </span>
        );
      })}
    </span>
  );
}

/** Small yes/no indicator. */
export function YesNo({ value, yes = "Yes", no = "No" }: { value: boolean; yes?: string; no?: string }) {
  return value ? <span className="font-medium text-comfortable">{yes}</span> : <span className="text-muted-foreground">{no}</span>;
}
