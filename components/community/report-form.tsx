"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { CheckCircle2, Clock, Loader2, Send, TriangleAlert } from "lucide-react";
import { HARDWARE, HARDWARE_MAP, MODELS, MODEL_MAP, QUANTIZATIONS, RUNTIMES } from "@/data";
import type { OS, QuantId } from "@/lib/schemas";
import { defaultOs, osLabel } from "@/lib/compatibility";
import { runtimesFor } from "@/lib/community/reports";
import { submitSpeedReport, type ReportResult } from "@/lib/me/actions";
import { Card } from "@/components/ui/card";
import { Field, NumberInput, Segmented, Select } from "@/components/ui/form";
import { Button, buttonClass } from "@/components/ui/button";

export interface ReportDefaults {
  hardwareId?: string;
  modelId?: string;
  quant?: QuantId;
  runtimeId?: string;
  os?: OS;
}

const hardwareGroup = (vendor: string, device: string) => (vendor === "apple" ? device : vendor === "nvidia" ? "NVIDIA" : vendor === "amd" ? "AMD" : vendor === "intel" ? "Intel" : "Other");

export function ReportForm({ defaults }: { defaults: ReportDefaults }) {
  const { status } = useSession();
  const [hardwareId, setHardwareId] = useState(defaults.hardwareId && HARDWARE_MAP.has(defaults.hardwareId) ? defaults.hardwareId : undefined);
  const [modelId, setModelId] = useState(defaults.modelId && MODEL_MAP.has(defaults.modelId) && !defaults.modelId.startsWith("hf:") ? defaults.modelId : undefined);
  const [quant, setQuant] = useState<QuantId | undefined>(defaults.quant);
  const [runtimeId, setRuntimeId] = useState(defaults.runtimeId);
  const [os, setOs] = useState<OS | undefined>(defaults.os);
  const [gen, setGen] = useState<number>();
  const [prefill, setPrefill] = useState<number>();
  const [contextTokens, setContextTokens] = useState<number | undefined>(0);
  const [promptTokens, setPromptTokens] = useState<number | undefined>(512);
  const [outputTokens, setOutputTokens] = useState<number | undefined>(128);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReportResult>();

  const hw = hardwareId ? HARDWARE_MAP.get(hardwareId) : undefined;
  const model = modelId ? MODEL_MAP.get(modelId) : undefined;
  const effectiveOs: OS | undefined = hw ? (os && hw.os.includes(os) ? os : defaultOs(hw)) : undefined;
  const runtimes = hw && effectiveOs ? runtimesFor(hw, effectiveOs, RUNTIMES) : [];
  const effectiveRuntime = runtimes.some((r) => r.id === runtimeId) ? runtimeId : runtimes[0]?.id;
  const effectiveQuant = model && quant && model.supportedQuantizations.includes(quant) ? quant : model?.supportedQuantizations.includes("q4") ? "q4" : model?.supportedQuantizations[0];

  if (status === "loading") return <Card className="h-64 animate-pulse p-6" aria-hidden />;
  if (status !== "authenticated") {
    return (
      <Card className="space-y-3 p-6">
        <h2 className="font-semibold">Sign in to report a speed</h2>
        <p className="text-sm text-muted-foreground">Reports are tied to an account so each person counts once per setup and spam can be removed. Your name is never shown next to a report.</p>
        <Button onClick={() => signIn("google", { redirectTo: window.location.href })}>Sign in with Google</Button>
      </Card>
    );
  }

  if (result?.ok) {
    return (
      <Card className="space-y-3 p-6" role="status">
        {result.status === "approved" ? (
          <p className="flex items-center gap-2 font-semibold text-comfortable">
            <CheckCircle2 className="size-5" aria-hidden /> Thanks! Your report is live.
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2 font-semibold">
              <Clock className="size-5 text-acceptable" aria-hidden /> Thanks! Your report is waiting for review.
            </p>
            <p className="text-sm text-muted-foreground">It looks unusual, so a person will check it before it counts:</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {result.flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setResult(undefined)}>
            Report another
          </Button>
          <Link href="/me#reports" className={buttonClass("ghost", "sm")}>
            My reports
          </Link>
          <Link href="/community" className={buttonClass("ghost", "sm")}>
            All community speeds
          </Link>
        </div>
      </Card>
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      setResult(
        await submitSpeedReport({
          hardwareId,
          modelId,
          quant: effectiveQuant,
          runtimeId: effectiveRuntime,
          os: effectiveOs,
          contextTokens: contextTokens ?? 0,
          promptTokens: promptTokens ?? 512,
          outputTokens: outputTokens ?? 128,
          generationTps: gen,
          prefillTps: prefill,
          notes: notes.trim() || undefined,
        }),
      );
    } catch {
      setResult({ ok: false, error: "Couldn't submit. Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Computer">
            <Select
              ariaLabel="Computer"
              value={hardwareId}
              onChange={setHardwareId}
              options={[{ value: "", label: "Select your computer…", disabled: true }, ...HARDWARE.filter((h) => h.id !== "custom").map((h) => ({ value: h.id, label: h.name, group: hardwareGroup(h.vendor, h.device) }))]}
            />
          </Field>
          {hw && hw.os.length > 1 && (
            <Field label="Operating system">
              <Segmented ariaLabel="Operating system" value={effectiveOs!} onChange={setOs} options={hw.os.map((o) => ({ value: o, label: osLabel(o) }))} />
            </Field>
          )}
          <Field label="Model">
            <Select
              ariaLabel="Model"
              value={modelId}
              onChange={setModelId}
              options={[{ value: "", label: "Select the model…", disabled: true }, ...MODELS.map((m) => ({ value: m.id, label: m.name, group: m.organization }))]}
            />
          </Field>
          {model && (
            <Field label="Quantization">
              <Select ariaLabel="Quantization" value={effectiveQuant} onChange={setQuant} options={model.supportedQuantizations.map((q) => ({ value: q, label: QUANTIZATIONS[q].label }))} />
            </Field>
          )}
          {hw && (
            <Field label="Runtime">
              <Select ariaLabel="Runtime" value={effectiveRuntime} onChange={setRuntimeId} options={runtimes.map((r) => ({ value: r.id, label: r.name }))} />
            </Field>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Generation speed" hint="“tg” in llama-bench, “eval rate” in ollama --verbose.">
            <NumberInput ariaLabel="Generation tokens per second" value={gen} onChange={setGen} min={0.1} max={10000} step={0.1} suffix="tok/s" />
          </Field>
          <Field label="Prompt processing (optional)" hint="“pp” in llama-bench, “prompt eval rate” in Ollama.">
            <NumberInput ariaLabel="Prompt processing tokens per second" value={prefill} onChange={setPrefill} min={0.1} max={1000000} step={0.1} suffix="tok/s" />
          </Field>
          <Field label="Prompt length" hint="Tokens in the prompt you timed. llama-bench's default is 512.">
            <NumberInput ariaLabel="Prompt tokens" value={promptTokens} onChange={setPromptTokens} min={1} max={1048576} suffix="tokens" />
          </Field>
          <Field label="Generated tokens" hint="llama-bench's default is 128.">
            <NumberInput ariaLabel="Output tokens" value={outputTokens} onChange={setOutputTokens} min={1} max={100000} suffix="tokens" />
          </Field>
          <Field label="Context already filled" hint="0 for a fresh chat; llama-bench -d sets this.">
            <NumberInput ariaLabel="Context depth" value={contextTokens} onChange={setContextTokens} min={0} max={1048576} suffix="tokens" />
          </Field>
          <Field label="Notes (optional)" hint="Runtime version, flags, power mode…">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} aria-label="Notes" className="h-10 w-full rounded-xl border border-border/80 bg-card px-3.5 text-sm shadow-2xs" />
          </Field>
        </div>

        {result && !result.ok && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-borderline/10 p-3 text-sm text-borderline">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {result.error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !hw || !model || !effectiveRuntime || !gen}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} Submit report
          </Button>
          <p className="text-xs text-muted-foreground">Reports are anonymous on the site. Implausible numbers are held for review.</p>
        </div>
      </form>
    </Card>
  );
}
