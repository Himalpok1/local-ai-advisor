import { cn } from "@/lib/utils";

/** Browser-style window: title bar with three coloured dots, outlined body, hard shadow. */
export function WindowFrame({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-brutal-xl", className)}>
      <div className="flex items-center gap-3 border-b-2 border-ink bg-muted px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full border-[1.5px] border-ink bg-fill-technical" />
          <span className="size-3 rounded-full border-[1.5px] border-ink bg-primary" />
          <span className="size-3 rounded-full border-[1.5px] border-ink bg-sticker-teal" />
        </span>
        {title && <span className="min-w-0 truncate text-xs font-bold text-foreground/70">{title}</span>}
        {right && <span className="ml-auto shrink-0">{right}</span>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
