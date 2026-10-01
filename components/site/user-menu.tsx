"use client";
import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

function Avatar({ name, image, className }: { name?: string | null; image?: string | null; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar; no next/image domain config needed
    return <img src={image} alt="" referrerPolicy="no-referrer" className={cn("rounded-full object-cover", className)} />;
  }
  return (
    <span className={cn("grid place-items-center rounded-full bg-primary/15 font-semibold text-primary", className)}>
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

/** Sign-in button, or the signed-in user's avatar with a small account menu. */
export function UserMenu({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") {
    return <span className={cn("size-9 animate-pulse rounded-full bg-muted", className)} aria-hidden />;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-muted/70 active:scale-[0.98] cursor-pointer",
          className,
        )}
      >
        <LogIn className="size-3.5" />
        <span>Sign in</span>
      </button>
    );
  }

  const { name, email, image } = session.user;
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full ring-2 ring-transparent transition hover:ring-border cursor-pointer"
      >
        <Avatar name={name} image={image} className="size-8 text-sm" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-60 overflow-hidden rounded-xl border border-border/70 bg-card shadow-lg">
          <div className="flex items-center gap-3 border-b border-border/60 p-3">
            <Avatar name={name} image={image} className="size-9 shrink-0 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted/60 hover:text-foreground cursor-pointer"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
