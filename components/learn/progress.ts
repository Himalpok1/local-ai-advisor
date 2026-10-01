"use client";
import { useCallback, useSyncExternalStore } from "react";

const KEY = "laa-learn-done";
const EVENT = "laa-learn-progress";
const EMPTY: string[] = [];

let cache: { raw: string | null; value: string[] } = { raw: null, value: EMPTY };

function read(): string[] {
  const raw = localStorage.getItem(KEY);
  if (raw === cache.raw) return cache.value;
  let value: string[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) value = parsed.filter((x): x is string => typeof x === "string");
  } catch {}
  cache = { raw, value };
  return value;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Lessons the reader has finished, stored in this browser only. Empty during SSR. */
export function useLearnProgress() {
  const done = useSyncExternalStore(subscribe, read, () => EMPTY);
  const markDone = useCallback((slug: string) => {
    const cur = read();
    if (cur.includes(slug)) return;
    localStorage.setItem(KEY, JSON.stringify([...cur, slug]));
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { done, markDone, reset };
}
