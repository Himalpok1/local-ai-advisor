"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function CompareNav() {
  const path = usePathname();
  const items = [
    { href: "/compare/models", label: "Compare models for my hardware" },
    { href: "/compare/hardware", label: "Compare hardware for my workload" },
  ];
  return (
    <nav aria-label="Compare" className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted p-1">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", path === i.href ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
