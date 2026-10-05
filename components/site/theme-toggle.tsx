"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const KEY = "laa-theme";
const EVENT = "laa-theme-change";

function readTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const noop = () => () => {};

function applyTheme(t: Theme) {
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.setAttribute("data-theme", dark ? "dark" : "light");
}

/** `compact` renders one button that cycles light → dark → system. */
export function ThemeToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  // Follow the OS setting live while the theme is "system".
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => readTheme() === "system" && applyTheme("system");
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  function handleSelect(next: Theme) {
    localStorage.setItem(KEY, next);
    applyTheme(next);
    window.dispatchEvent(new Event(EVENT));
  }

  function cycleTheme() {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    handleSelect(next);
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={cn("flex size-9 items-center justify-center rounded-full border-2 border-ink bg-card text-foreground transition hover:bg-muted", className)}
      >
        <Sun className="size-4" />
      </button>
    );
  }

  if (compact) {
    const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
    return (
      <button
        type="button"
        onClick={cycleTheme}
        aria-label={`Theme: ${theme}. Click to change`}
        title={`Theme: ${theme}`}
        className={cn("flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-transparent text-foreground transition hover:border-ink hover:bg-muted", className)}
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-full border-2 border-ink bg-card p-0.5 text-xs font-medium", className)}>
      <button
        type="button"
        onClick={() => handleSelect("light")}
        aria-label="Light mode"
        title="Light theme"
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition",
          theme === "light" ? "bg-primary text-on-fill font-bold" : "text-muted-foreground hover:text-foreground"
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
          "flex size-7 items-center justify-center rounded-full transition",
          theme === "dark" ? "bg-primary text-on-fill font-bold" : "text-muted-foreground hover:text-foreground"
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
          "flex size-7 items-center justify-center rounded-full transition",
          theme === "system" ? "bg-primary text-on-fill font-bold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Monitor className="size-3.5" />
      </button>
    </div>
  );
}
