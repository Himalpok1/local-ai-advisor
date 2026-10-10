import type { PerformanceBasis } from "@/lib/schemas/results";

/** Round to a "human" precision so we never imply false accuracy. */
export function roundNice(x: number): number {
  if (x >= 100) return Math.round(x / 10) * 10;
  if (x >= 20) return Math.round(x / 5) * 5;
  if (x >= 5) return Math.round(x);
  return Math.round(x * 10) / 10;
}

export function fmtGB(x: number): string {
  if (Math.abs(x) >= 10) return `${Math.round(x)} GB`;
  return `${(Math.round(x * 10) / 10).toFixed(1)} GB`;
}

/** Heuristic display bands: ±15% with benchmarks, ±25% without; not validated intervals. */
export function fmtTps(x: number, basis: PerformanceBasis = "estimated"): string {
  if (!Number.isFinite(x) || x <= 0) return "—";
  const spread = basis !== "estimated" ? 0.15 : 0.25;
  const lo = roundNice(x * (1 - spread));
  const hi = roundNice(x * (1 + spread));
  return lo === hi ? `≈${lo} tok/s` : `${lo}–${hi} tok/s`;
}

export function fmtSec(s: number): string {
  if (!Number.isFinite(s)) return "—";
  if (s < 1) return "under 1 s";
  if (s < 10) return `≈${Math.round(s)} s`;
  if (s < 90) return `≈${Math.round(s / 5) * 5} s`;
  if (s < 3600) return `≈${Math.round(s / 60)} min`;
  return `≈${(s / 3600).toFixed(1)} h`;
}

export function fmtMinutes(m: number): string {
  return fmtSec(m * 60);
}

export function fmtCtx(tokens: number): string {
  if (tokens >= 1048576) return `${Math.round(tokens / 1048576)}M`;
  return `${Math.round(tokens / 1024)}K`;
}

export function fmtTokens(tokens: number): string {
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K tokens`;
  return `${Math.round(tokens)} tokens`;
}

export function fmtParams(b: number): string {
  if (b >= 1000) return `${(b / 1000).toFixed(1)}T`;
  return b >= 10 ? `${Math.round(b)}B` : `${b.toFixed(1)}B`;
}

export function fmtUSD(x?: number): string {
  if (!x) return "—";
  return `$${x.toLocaleString("en-US")}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
