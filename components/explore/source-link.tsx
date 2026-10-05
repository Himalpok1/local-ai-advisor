import { ExternalLink } from "lucide-react";
import type { Confidence, Source } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { CONFIDENCE_CHIP } from "@/components/ui/tones";

export function ConfidencePill({ level, className }: { level: Confidence; className?: string }) {
  return (
    <span
      title={`${level[0].toUpperCase() + level.slice(1)} confidence in this data`}
      className={cn("inline-flex items-center rounded-full border-2 border-ink px-1.5 py-0.5 text-[11px] font-bold leading-none", CONFIDENCE_CHIP[level], className)}
    >
      {level} confidence
    </span>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** External link that opens in a new tab with an accessible hint. */
export function ExternalA({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-1 font-semibold text-link underline decoration-primary decoration-2 underline-offset-2 hover:bg-primary hover:text-on-fill", className)}>
      {children}
      <ExternalLink className="size-3 shrink-0" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Source link with last-verified date and confidence. */
export function SourceLink({ source, compact, className }: { source: Source; compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", className)}>
      <ExternalA href={source.url} className="max-w-full">
        <span className={cn(compact ? "max-w-[14rem] truncate" : "")} title={source.title ?? source.url}>
          {compact ? hostOf(source.url) : (source.title ?? hostOf(source.url))}
        </span>
      </ExternalA>
      <span className="text-muted-foreground">verified {source.lastVerified}</span>
      <ConfidencePill level={source.confidence} />
    </span>
  );
}
