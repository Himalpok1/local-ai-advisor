"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Bell, Gauge, HardDrive, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

function Avatar({ name, image, className }: { name?: string | null; image?: string | null; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar; no next/image domain config needed
    return <img src={image} alt="" referrerPolicy="no-referrer" className={cn("rounded-full border-2 border-ink object-cover", className)} />;
  }
  return (
    <span className={cn("grid place-items-center rounded-full border-2 border-ink bg-primary font-bold text-on-fill", className)}>
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

/** Sign-in button, or the signed-in user's avatar with a small account menu. */
export function UserMenu({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = useUnreadAlerts(session?.user?.id);

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
          "press inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-ink bg-card px-3.5 text-xs font-bold text-foreground shadow-brutal-sm cursor-pointer",
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
        aria-label={unread ? `Account menu, ${unread} new model${unread === 1 ? "" : "s"} for your rigs` : "Account menu"}
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-full cursor-pointer"
      >
        <Avatar name={name} image={image} className="size-8 text-sm" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full border-2 border-ink bg-sticker-pink px-1 text-[10px] font-bold leading-3.5 text-on-fill">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-60 overflow-hidden rounded-xl border-2 border-ink bg-card shadow-brutal">
          <div className="flex items-center gap-3 border-b-2 border-ink p-3">
            <Avatar name={name} image={image} className="size-9 shrink-0 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <nav className="border-b-2 border-ink py-1" aria-label="Account">
            <MenuLink href="/me" icon={<HardDrive className="size-4" />} onClick={() => setOpen(false)}>
              My rigs &amp; saved
            </MenuLink>
            <MenuLink href="/me#alerts" icon={<Bell className="size-4" />} onClick={() => setOpen(false)}>
              New models for my rigs
              {unread > 0 && <span className="ml-auto rounded-full border-[1.5px] border-ink bg-sticker-pink px-1.5 text-[11px] font-bold text-on-fill">{unread}</span>}
            </MenuLink>
            <MenuLink href="/community/submit" icon={<Gauge className="size-4" />} onClick={() => setOpen(false)}>
              Report a speed
            </MenuLink>
          </nav>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary hover:text-on-fill cursor-pointer"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, onClick, children }: { href: string; icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-primary hover:text-on-fill">
      {icon}
      {children}
    </Link>
  );
}

/** Unread new-model alerts for the signed-in user's rigs (rating runs on the server). */
function useUnreadAlerts(userId: string | undefined): number {
  const [state, setState] = useState<{ userId?: string; unread: number }>({ unread: 0 });
  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetch("/api/me/alerts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { unread: 0 }))
      .then((d: { unread: number }) => live && setState({ userId, unread: d.unread }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [userId]);
  return state.userId === userId ? state.unread : 0;
}
