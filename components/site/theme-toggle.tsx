"use client";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("laa-theme") as Theme | null;
    if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      setTheme("system");
      applyTheme("system");
    }

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      const current = localStorage.getItem("laa-theme");
      if (!current || current === "system") {
        applyTheme("system");
      }
    };
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else if (t === "light") {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    }
  }

  function handleSelect(next: Theme) {
    setTheme(next);
    localStorage.setItem("laa-theme", next);
    applyTheme(next);
  }

  // Cycle toggle for compact navbar display
  function cycleTheme() {
    const next: Theme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    handleSelect(next);
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={cn("flex size-9 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition", className)}
      >
        <Sun className="size-4" />
      </button>
    );
  }

  return (
    <div className={cn("inline-flex items-center rounded-lg border bg-muted/70 p-0.5 text-xs font-medium", className)}>
      <button
        type="button"
        onClick={() => handleSelect("light")}
        aria-label="Light mode"
        title="Light theme"
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition",
          theme === "light" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleSelect("dark")}
        aria-label="Dark mode"
        title="Dark theme"
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition",
          theme === "dark" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleSelect("system")}
        aria-label="System theme"
        title="Follow system preference"
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition",
          theme === "system" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Monitor className="size-3.5" />
      </button>
    </div>
  );
}
