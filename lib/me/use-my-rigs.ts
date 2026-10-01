"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import type { RigDto } from "./shared";

/* One shared fetch of the user's rigs for every hardware picker on the page. */

let rigs: RigDto[] = [];
let loadedFor: string | undefined;
let inflight: Promise<void> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load(userId: string, force = false): Promise<void> {
  if (!force && (loadedFor === userId || inflight)) return inflight ?? Promise.resolve();
  inflight = fetch("/api/me/rigs", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { rigs: [] }))
    .then((d: { rigs: RigDto[] }) => {
      rigs = d.rigs;
      loadedFor = userId;
      emit();
    })
    .catch(() => {})
    .finally(() => (inflight = undefined));
  return inflight;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const EMPTY: RigDto[] = [];

export function useMyRigs() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) void load(userId);
  }, [userId]);
  const list = useSyncExternalStore(subscribe, () => (userId && loadedFor === userId ? rigs : EMPTY), () => EMPTY);
  const refresh = useCallback(() => (userId ? load(userId, true) : Promise.resolve()), [userId]);
  return { rigs: list, signedIn: status === "authenticated", status, refresh };
}
