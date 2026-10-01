import { cn } from "@/lib/utils";

export function Badge({ className, tone = "neutral", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "primary" | "good" | "warn" | "bad" }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-accent text-accent-foreground",
    good: "bg-comfortable/15 text-comfortable",
    warn: "bg-acceptable/20 text-[color-mix(in_oklch,var(--c-acceptable)_70%,black)] dark:text-acceptable",
    bad: "bg-technical/15 text-technical",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", tones[tone], className)} {...props} />;
}
