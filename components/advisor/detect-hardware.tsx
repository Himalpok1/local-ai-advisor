"use client";
import { useState } from "react";
import { Loader2, ScanSearch, X } from "lucide-react";
import { HARDWARE } from "@/data";
import type { HardwareConfiguration } from "@/lib/schemas";
import { detectHardware, readSignals, type DetectionResult } from "@/lib/detect-hardware";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Short label for a candidate: "MacBook Pro · 48 GB" or "64 GB RAM". */
function candidateLabel(h: HardwareConfiguration, all: HardwareConfiguration[]) {
  if (h.vendor === "apple") return `${h.device} · ${h.systemRamGB} GB`;
  const sameGpu = all.every((o) => o.gpu?.name === h.gpu?.name);
  return sameGpu ? `${h.systemRamGB} GB system RAM` : h.name;
}

/**
 * "Detect my computer": reads the GPU / chip name the browser exposes and
 * offers the matching catalog configurations. Nothing leaves the browser.
 */
export function DetectHardware({ onPick, selectedId, className }: { onPick: (h: HardwareConfiguration) => void; selectedId?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [result, setResult] = useState<DetectionResult>();

  const run = async () => {
    setState("busy");
    const r = detectHardware(await readSignals(), HARDWARE);
    setResult(r);
    setState("done");
    if (r.candidates.length === 1) onPick(r.candidates[0]);
  };

  if (state !== "done" || !result) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={run} disabled={state === "busy"} className={className}>
        {state === "busy" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ScanSearch className="size-3.5" aria-hidden />}
        Detect my computer
      </Button>
    );
  }

  return (
    <div role="status" className={cn("rounded-lg border bg-accent/40 p-3 text-sm", className)}>
      <div className="flex items-start justify-between gap-2">
        <p>
          {result.label ? (
            <>
              Detected <strong>{result.label}</strong>.{" "}
            </>
          ) : null}
          <span className="text-muted-foreground">{result.hint}</span>
        </p>
        <button type="button" aria-label="Dismiss" onClick={() => setState("idle")} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      {result.candidates.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {result.candidates.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => onPick(h)}
              aria-pressed={h.id === selectedId}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                h.id === selectedId ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {candidateLabel(h, result.candidates)}
              {h.vendor === "apple" && result.candidates.some((o) => o.device === h.device && o.year !== h.year) ? ` (${h.year})` : ""}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Detection runs in your browser; nothing is sent to us.</p>
    </div>
  );
}
