"use client";
import { useEffect } from "react";

/** Mirror state into the query string (replaceState) so every view is shareable. */
export function useUrlSync(query: string) {
  useEffect(() => {
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, "", url);
  }, [query]);
}
