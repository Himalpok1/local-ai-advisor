"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { saveItem } from "@/lib/me/actions";
import { SAVEABLE_PATHS } from "@/lib/me/shared";
import { Button } from "@/components/ui/button";

function defaultLabel() {
  const h1 = document.querySelector("h1")?.textContent?.trim();
  return (h1 || document.title.replace(/ · Local AI Advisor$/, "")).slice(0, 120);
}

/** Bookmark the current configuration (the URL's query string) to the user's account. */
export function SaveButton({ label }: { label?: string }) {
  const pathname = usePathname();
  const { status } = useSession();
  const [naming, setNaming] = useState<string>();
  const [state, setState] = useState<"idle" | "busy" | "saved">("idle");
  const [error, setError] = useState<string>();

  if (!(SAVEABLE_PATHS as readonly string[]).includes(pathname) || status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn("google", { redirectTo: window.location.href })}>
        <Bookmark className="size-4" /> Sign in to save
      </Button>
    );
  }

  if (state === "saved") {
    return (
      <Link href="/me#saved" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-medium text-comfortable sm:text-sm">
        <BookmarkCheck className="size-4" /> Saved · view
      </Link>
    );
  }

  const save = async (name: string) => {
    setState("busy");
    setError(undefined);
    try {
      const res = await saveItem({ label: name, path: pathname, query: window.location.search });
      if (res.ok) {
        setState("saved");
        setNaming(undefined);
      } else {
        setState("idle");
        setError(res.error);
      }
    } catch {
      setState("idle");
      setError("Couldn't save. Try again.");
    }
  };

  if (naming !== undefined) {
    return (
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save(naming);
        }}
      >
        <input
          autoFocus
          value={naming}
          onChange={(e) => setNaming(e.target.value)}
          maxLength={120}
          aria-label="Name for this saved item"
          className="h-8 w-56 rounded-lg border border-border/80 bg-card px-2.5 text-sm"
        />
        <Button type="submit" size="sm" disabled={state === "busy" || !naming.trim()}>
          {state === "busy" && <Loader2 className="size-3.5 animate-spin" aria-hidden />} Save
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setNaming(undefined)}>
          Cancel
        </Button>
        {error && (
          <span role="alert" className="text-xs text-borderline">
            {error}
          </span>
        )}
      </form>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setNaming(label ?? defaultLabel())}>
      <Bookmark className="size-4" /> Save
    </Button>
  );
}
