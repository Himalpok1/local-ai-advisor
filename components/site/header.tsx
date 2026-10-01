"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Compass, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/check", label: "Check my computer" },
  { href: "/hardware-for-model", label: "Find hardware" },
  { href: "/hugging-face", label: "Any HF model" },
  { href: "/stack", label: "Build a stack" },
  { href: "/compare/models", label: "Compare" },
  { href: "/models", label: "Explore" },
  { href: "/learn", label: "Learn" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) =>
    pathname === href ||
    (href === "/compare/models" && pathname.startsWith("/compare")) ||
    (href === "/models" && ["/models", "/hardware", "/tools", "/runtimes", "/methodology"].some((p) => pathname === p || pathname.startsWith(p + "/")));
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-4" />
          </span>
          Local AI Advisor
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn("rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground", active(n.href) && "bg-muted text-foreground")}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button className="ml-auto rounded-md p-2 md:hidden" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t px-4 py-2 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn("block rounded-md px-3 py-2 text-sm", active(n.href) && "bg-muted font-medium")}>
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
