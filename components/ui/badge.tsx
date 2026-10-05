import { cn } from "@/lib/utils";
import { TONE_CHIP, type Tone } from "./tones";

export function Badge({ className, tone = "neutral", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink px-2.5 py-0.5 text-xs font-bold", TONE_CHIP[tone], className)} {...props} />;
}
