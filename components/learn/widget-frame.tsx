import { Activity } from "lucide-react";

/** Shared chrome for the live widgets on /learn. */
export function WidgetFrame({
  title,
  description,
  controls,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure className="rounded-xl border-2 bg-card shadow-brutal-sm">
      <div className="flex flex-col gap-3 border-b-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-link">
            <Activity className="size-3.5" /> Live · uses the real engine
          </p>
          <p className="mt-1 font-semibold">{title}</p>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {controls && <div className="flex shrink-0 flex-wrap gap-2">{controls}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </figure>
  );
}
