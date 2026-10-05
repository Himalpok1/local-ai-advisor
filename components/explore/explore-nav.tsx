import Link from "next/link";
import { cn } from "@/lib/utils";

export type ExploreSection = "models" | "hardware" | "runtimes" | "tools" | "methodology";

export const EXPLORE_SECTIONS: { id: ExploreSection; href: string; label: string }[] = [
  { id: "models", href: "/models", label: "Models" },
  { id: "hardware", href: "/hardware", label: "Hardware" },
  { id: "runtimes", href: "/runtimes", label: "Runtimes" },
  { id: "tools", href: "/tools", label: "AI tools" },
  { id: "methodology", href: "/methodology", label: "Methodology" },
];

/** Sub-navigation shared by the explorer pages. */
export function ExploreNav({ current }: { current: ExploreSection }) {
  return (
    <nav aria-label="Explore" className="-mx-1 overflow-x-auto">
      <ul className="flex w-max items-center gap-1 rounded-lg border-2 bg-muted p-1">
        {EXPLORE_SECTIONS.map((s) => {
          const active = s.id === current;
          return (
            <li key={s.id}>
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-ring",
                  active ? "bg-card text-foreground shadow-brutal-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Page container + sub-nav + H1 + intro used by every explorer page. */
export function ExplorePage({
  current,
  title,
  intro,
  children,
}: {
  current: ExploreSection;
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <ExploreNav current={current} />
      <header className="mt-6 mb-8 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">{intro}</p>
      </header>
      <div className="flex flex-col gap-10">{children}</div>
    </div>
  );
}

/** A titled section within an explorer page. */
export function ExploreSectionBlock({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("scroll-mt-20", className)}>
      <h2 id={headingId} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>
      {description && <div className="mt-1.5 max-w-3xl text-sm text-muted-foreground">{description}</div>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Informational callout. */
export function Callout({ title, children, icon, className }: { title?: React.ReactNode; children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <aside className={cn("flex gap-3 rounded-xl border-2 border-ink bg-accent/50 p-4 text-sm", className)}>
      {icon && <span className="mt-0.5 shrink-0 text-link">{icon}</span>}
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-muted-foreground [&_strong]:text-foreground">{children}</div>
      </div>
    </aside>
  );
}
