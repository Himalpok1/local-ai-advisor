"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { PRIMARY_NAV, TOOL_GROUPS, sectionFor } from "./nav";

export function SiteHeader() {
  const pathname = usePathname();
  const section = sectionFor(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 rounded-lg font-semibold tracking-tight text-foreground">
          <Image src="/brand/logo-mark.svg" width={32} height={32} alt="" loading="eager" className="size-8 transition-transform group-hover:-rotate-6 group-hover:scale-105" />
          <span className="whitespace-nowrap text-[15px] font-bold leading-none sm:text-base">Local AI Advisor</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {PRIMARY_NAV.map((n) => (
            <NavLink key={n.href} href={n.href} active={section === n.href}>
              {n.label}
            </NavLink>
          ))}
          <ToolsMenu active={section === "tools"} pathname={pathname} />
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle compact className="hidden lg:flex" />
          <UserMenu />
          <Link
            href="/check"
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-[0.98] lg:inline-flex"
          >
            Start here <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />}
    </Link>
  );
}

/** Desktop "Tools" mega-menu: every tool, grouped and described in plain words. */
function ToolsMenu({ active, pathname }: { active: boolean; pathname: string }) {
  // The menu remembers the path it was opened on, so navigating closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpenedOn(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpenedOn(open ? null : pathname)}
        className={cn(
          "relative inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active || open ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Tools
        <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
        {active && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-12 w-[46rem] -translate-x-1/2 origin-top rounded-2xl border border-border/70 bg-card p-3 shadow-xl"
          >
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {TOOL_GROUPS.map((g) => (
                <div key={g.title} className="p-1">
                  <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
                  <ul>
                    {g.items.map((t) => {
                      const Icon = t.icon;
                      const current = pathname === t.href;
                      return (
                        <li key={t.href}>
                          <Link
                            href={t.href}
                            className={cn("group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted", current && "bg-accent")}
                          >
                            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                              <Icon className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-foreground">{t.label}</span>
                              <span className="block text-xs leading-snug text-muted-foreground">{t.description}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
