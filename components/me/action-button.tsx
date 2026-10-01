"use client";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/me/actions";
import { cn } from "@/lib/utils";

/** Small button that runs a bound Server Action, with an optional confirm step. */
export function ActionButton({ action, confirm, className, children }: { action: () => Promise<ActionResult>; confirm?: string; className?: string; children: React.ReactNode }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            try {
              const res = await action();
              setError(res.ok ? undefined : res.error);
            } catch {
              setError("Something went wrong.");
            }
          });
        }}
        className={cn("inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50 cursor-pointer", className)}
      >
        {children}
      </button>
      {error && (
        <span role="alert" className="text-xs text-borderline">
          {error}
        </span>
      )}
    </>
  );
}
