"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { TAB_NAV, TOOL_GROUPS, sectionFor } from "./nav";

/**
 * App-style bottom navigation for phones (hidden from lg up). Adapted from the
 * 21st.dev "Bottom Nav Bar": a spring-animated pill marks the active tab, but
 * every tab keeps its label so nothing relies on recognising an icon.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const section = sectionFor(pathname);
  // The sheet remembers the path it was opened on, so navigating closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const sheetOpen = openedOn === pathname;
  const reduce = useReducedMotion();

  const tabs = [...TAB_NAV.map((t) => ({ ...t, active: section === t.href })), { href: "#more", label: "More", icon: LayoutGrid, active: sheetOpen || section === "tools" }];

  return (
    <>
      <nav aria-label="Main" className="bottom-safe fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-lg lg:hidden">
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5 px-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const inner = (
              <>
                <span className="relative grid h-8 w-14 place-items-center">
                  {t.active && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-full bg-primary/12"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative size-5" strokeWidth={t.active ? 2.4 : 2} aria-hidden />
                </span>
                <span className={cn("text-[11px] leading-none", t.active ? "font-semibold" : "font-medium")}>{t.label}</span>
              </>
            );
            const cls = cn(
              "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 transition-colors active:scale-95",
              t.active ? "text-primary" : "text-muted-foreground",
            );
            return (
              <li key={t.href}>
                {t.href === "#more" ? (
                  <button type="button" className={cls} aria-expanded={sheetOpen} aria-haspopup="dialog" onClick={() => setOpenedOn(sheetOpen ? null : pathname)}>
                    {inner}
                  </button>
                ) : (
                  <Link href={t.href} className={cls} aria-current={t.active ? "page" : undefined}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <MoreSheet open={sheetOpen} onClose={() => setOpenedOn(null)} pathname={pathname} />
    </>
  );
}

function MoreSheet({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  // Only the grab handle starts a drag, so scrolling the list still works.
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="All tools">
          <motion.button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            onClick={onClose}
          />
          <motion.div
            className="bottom-safe absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-border/60 bg-background shadow-2xl"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            drag={reduce ? false : "y"}
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 600) && onClose()}
          >
            <div className="sticky top-0 z-10 touch-none bg-background/95 px-5 pb-2 pt-3 backdrop-blur" onPointerDown={(e) => drag.start(e)}>
              <div className="mx-auto h-1.5 w-10 rounded-full bg-border" aria-hidden />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-bold tracking-tight">All tools</p>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="grid size-10 cursor-pointer place-items-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="space-y-5 px-4 pb-6">
              {TOOL_GROUPS.map((g, gi) => (
                <section key={g.title}>
                  <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {g.items.map((t, i) => {
                      const Icon = t.icon;
                      return (
                        <motion.li
                          key={t.href}
                          initial={reduce ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * (gi * 2 + i), duration: 0.3 }}
                        >
                          <Link
                            href={t.href}
                            onClick={onClose}
                            className={cn(
                              "flex h-full min-h-[5.5rem] flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3 transition active:scale-[0.98]",
                              pathname === t.href && "border-primary/50 bg-accent",
                            )}
                          >
                            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="size-4" />
                            </span>
                            <span className="text-sm font-semibold leading-tight text-foreground">{t.label}</span>
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                </section>
              ))}
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3">
                <span className="text-sm font-medium">Appearance</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
