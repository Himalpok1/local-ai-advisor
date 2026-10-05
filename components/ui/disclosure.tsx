import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclosure({ summary, children, defaultOpen, className }: { summary: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; className?: string }) {
  return (
    <details open={defaultOpen} className={cn("group rounded-lg", className)}>
      <summary className="flex cursor-pointer select-none items-center gap-1.5 text-sm font-bold text-link underline decoration-primary decoration-2 underline-offset-4">
        <ChevronRight className="size-4 transition group-open:rotate-90" />
        {summary}
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
