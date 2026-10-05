"use client";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { BookmarkPlus, Check, HardDrive, Loader2, Star } from "lucide-react";
import type { WorkloadProfileInput } from "@/lib/schemas";
import { DEFAULT_WORKLOAD, encodeState, resolveHardware } from "@/lib/share";
import { decodeRig, type DecodedRig } from "@/lib/me/shared";
import { useMyRigs } from "@/lib/me/use-my-rigs";
import { saveRig } from "@/lib/me/actions";
import { cn } from "@/lib/utils";
import type { HardwareValue } from "@/components/advisor/hardware-picker";

const sameHardware = (a: HardwareValue, b: HardwareValue) =>
  a.hardwareId === b.hardwareId && (a.hardwareId !== "custom" || JSON.stringify(a.custom) === JSON.stringify(b.custom));

/**
 * "Your rigs" chips above the hardware picker, plus saving the current selection as a rig.
 * With `applyDefault`, the default rig is selected once when the rigs first load.
 */
export function MyRigsBar({
  value,
  workload,
  onPick,
  applyDefault,
}: {
  value: HardwareValue;
  workload?: WorkloadProfileInput;
  onPick: (rig: DecodedRig) => void;
  applyDefault?: boolean;
}) {
  const { rigs, signedIn, status, refresh } = useMyRigs();
  const applied = useRef(!applyDefault);
  useEffect(() => {
    if (applied.current || !rigs.length) return;
    applied.current = true;
    const preferred = rigs.find((r) => r.isDefault) ?? rigs[0];
    const decoded = decodeRig(preferred);
    if (decoded) onPick(decoded);
  }, [rigs, onPick]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [justSaved, setJustSaved] = useState(false);

  if (status === "loading") return null;
  const selected = resolveHardware(value);
  if (!signedIn) {
    return (
      <p className="text-xs text-muted-foreground">
        <button type="button" onClick={() => signIn("google", { redirectTo: window.location.href })} className="font-medium text-link hover:underline cursor-pointer">
          Sign in
        </button>{" "}
        to save this computer as a rig and pick it in one tap next time.
      </p>
    );
  }

  const decoded = rigs.map(decodeRig).filter((r) => !!r);
  const isSaved = decoded.some((r) => sameHardware(r.state, value));

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const query = encodeState({ hardwareId: value.hardwareId, custom: value.custom, os: value.os, workload: workload ?? DEFAULT_WORKLOAD });
      const res = await saveRig({ name, query });
      if (!res.ok) return setError(res.error);
      await refresh();
      setNaming(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {decoded.length > 0 && <span className="text-xs font-medium text-muted-foreground">Your rigs:</span>}
        {decoded.map((r) => {
          const active = sameHardware(r.state, value);
          return (
            <button
              key={r.rig.id}
              type="button"
              onClick={() => onPick(r)}
              aria-pressed={active}
              title={r.hardware.name}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-xs font-medium transition cursor-pointer",
                active ? "border-ink bg-accent text-accent-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {r.rig.isDefault ? <Star className="size-3 fill-current" aria-label="Default" /> : <HardDrive className="size-3" aria-hidden />}
              {r.rig.name}
            </button>
          );
        })}
        {selected && !isSaved && !naming && (
          <button
            type="button"
            onClick={() => {
              setName(value.hardwareId === "custom" ? (value.custom?.name ?? "My custom rig") : selected.name);
              setNaming(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <BookmarkPlus className="size-3.5" aria-hidden /> Save as my rig
          </button>
        )}
        {justSaved && (
          <span role="status" className="inline-flex items-center gap-1 text-xs text-comfortable">
            <Check className="size-3.5" aria-hidden /> Saved
          </span>
        )}
      </div>
      {naming && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            aria-label="Rig name"
            className="h-8 min-w-0 flex-1 rounded-lg border-2 border-ink bg-card px-2.5 text-sm sm:max-w-xs"
          />
          <button type="submit" disabled={busy || !name.trim()} className="inline-flex h-8 items-center gap-1.5 bg-primary px-3 text-xs text-primary-foreground disabled:opacity-50 cursor-pointer rounded-full border-2 border-ink font-bold shadow-brutal press">
            {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />} Save rig
          </button>
          <button type="button" onClick={() => setNaming(false)} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
            Cancel
          </button>
          {workload && <span className="basis-full text-xs text-muted-foreground">Saves this computer with the workload you&apos;ve chosen on this page.</span>}
        </form>
      )}
      {error && (
        <p role="alert" className="text-xs text-borderline">
          {error}
        </p>
      )}
    </div>
  );
}
