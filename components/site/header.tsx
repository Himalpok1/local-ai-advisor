"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Compass,
  Menu,
  X,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  BookOpen,
  Boxes,
  Scale,
  Search,
  HelpCircle,
  Gauge,
  Rss,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const NAV = [
  { href: "/check", label: "Check My Computer", icon: Compass },
  { href: "/can-i-run", label: "Can I Run It?", icon: HelpCircle },
  { href: "/hugging-face", label: "Any HF Model", icon: Search },
  { href: "/new-models", label: "New Models", icon: Rss },
  { href: "/compare/models", label: "Compare", icon: Scale },
  { href: "/models", label: "Explore", icon: Boxes },
  { href: "/learn", label: "Learn", icon: BookOpen },
];

/** Extra tools listed in the mobile drawer (the desktop bar has no room). */
const MORE = [
  { href: "/speed-test", label: "Browser Speed Test", icon: Gauge },
  { href: "/hardware-for-model", label: "Find Hardware", icon: Cpu },
  { href: "/stack", label: "Build Stack", icon: Layers },
];

export function SiteHeader() {
  const pathname = usePathname();
  // The drawer remembers the path it was opened on, so navigating closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const active = (href: string) =>
    pathname === href ||
    (href === "/can-i-run" && (pathname.startsWith("/can-i-run/") || pathname.startsWith("/what-runs-on/"))) ||
    (href === "/compare/models" && pathname.startsWith("/compare")) ||
    (href === "/models" &&
      ["/models", "/hardware", "/tools", "/runtimes", "/methodology"].some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      ));

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold tracking-tight text-foreground transition"
        >
          <span className="relative grid size-8 place-items-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-primary-foreground shadow-sm shadow-primary/20 transition group-hover:scale-105">
            <Compass className="size-4.5 transition-transform duration-300 group-hover:rotate-45" />
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-background" />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-bold leading-none tracking-tight">
              Local AI Advisor
            </span>
            <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
              Workload &amp; Hardware Engine
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => {
            const isActive = active(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  isActive
                    ? "bg-muted text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />

          {/* Quick CTA on Desktop */}
          <Link
            href="/check"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-105 active:scale-[0.98] transition"
          >
            <Sparkles className="size-3.5" />
            <span>Check My Computer</span>
          </Link>

          <UserMenu />

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle className="sm:hidden" />
            <button
              className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="size-5 text-foreground" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/70 overflow-y-auto lg:hidden animate-in fade-in-0 duration-200">
          <div className="flex flex-col p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
            {/* Primary Action Hero in Mobile Menu */}
            <Link
              href="/check"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary to-indigo-600 p-4 text-primary-foreground shadow-md transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-white/20">
                  <Compass className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-sm">Check My Computer</p>
                  <p className="text-xs text-white/80">60-second wizard for your rig</p>
                </div>
              </div>
              <ArrowRight className="size-5" />
            </Link>

            {/* Nav list */}
            <div className="rounded-xl border border-border/70 bg-card/60 divide-y divide-border/50 overflow-hidden shadow-2xs">
              {[...NAV, ...MORE].map((n) => {
                const Icon = n.icon;
                const isActive = active(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 text-sm transition",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted/60"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={cn("size-4.5", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span>{n.label}</span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground/60" />
                  </Link>
                );
              })}
            </div>

            {/* Secondary links & info */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <Link
                href="/methodology"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border/60 bg-muted/40 p-3 text-center text-muted-foreground hover:text-foreground transition"
              >
                Methodology &amp; Benchmarks
              </Link>
              <Link
                href="/compare/hardware"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border/60 bg-muted/40 p-3 text-center text-muted-foreground hover:text-foreground transition"
              >
                Compare Hardware
              </Link>
            </div>

            {/* Theme switcher footer in mobile drawer */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3.5 mt-2">
              <span className="text-xs font-medium text-muted-foreground">Color Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
