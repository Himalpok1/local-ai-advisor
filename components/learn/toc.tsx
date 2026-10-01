"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ALL_LEARN_SECTIONS, LEARN_GROUPS } from "./sections";

/** Sticky table of contents with scroll-spy (large screens). */
export function LearnToc() {
  const [active, setActive] = useState<string>(ALL_LEARN_SECTIONS[0].id);

  useEffect(() => {
    const els = ALL_LEARN_SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        if (visible.size > 0) {
          // The top-most visible section wins.
          const [id] = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
          setActive(id);
        }
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
      <ol className="space-y-4">
        {LEARN_GROUPS.map((g) => (
          <li key={g.id}>
            <p className="mb-1 font-medium">{g.title}</p>
            <ol className="space-y-0.5 border-l">
              {g.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={active === s.id ? "location" : undefined}
                    className={cn(
                      "-ml-px block border-l-2 border-transparent py-1 pl-3 text-muted-foreground transition hover:text-foreground",
                      active === s.id && "border-primary font-medium text-primary hover:text-primary",
                    )}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Compact jump menu for small screens. */
export function LearnTocMobile() {
  return (
    <details className="group rounded-xl border bg-card lg:hidden">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium">
        Jump to a topic
        <span className="text-muted-foreground transition group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="grid gap-4 border-t px-4 py-3 sm:grid-cols-2">
        {LEARN_GROUPS.map((g) => (
          <div key={g.id}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {g.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-primary hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
