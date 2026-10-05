"use client";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { selectableModels, modelGroup, QUANTIZATIONS, TOOLS, getModel } from "@/data";
import type { QuantId, WorkloadProfileInput } from "@/lib/schemas";
import { bestQuantFor, evaluate, recommendModels } from "@/lib/recommendations";
import { encodeState, resolveHardware, type AppState } from "@/lib/share";
import { useUrlSync } from "@/lib/use-url-state";
import { recHref } from "@/lib/links";
import { USE_CASE_LIST } from "@/lib/workloads/profiles";
import { CONTEXT_STEPS } from "@/lib/workloads/resolve";
import { DEV_ENV_LIST } from "@/lib/workloads/dev-env";
import { fmtCtx } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Segmented, Select } from "@/components/ui/form";
import { HardwarePicker, hardwareSpecLine } from "./hardware-picker";
import { defaultsForUseCase, workloadLabel } from "./workload-form";
import { ModelsTable } from "./models-table";
import { ShareButton } from "./share-button";
import { CompareNav } from "./compare-nav";
import { DimensionGauges } from "./gauges";
import { ComfortBadge } from "./comfort";
import { quantName } from "./recommendation-card";

export interface ModelPick {
  id: string;
  quant?: QuantId;
}

export function CompareModels({ initial, initialModels }: { initial: AppState; initialModels: ModelPick[] }) {
  const [state, setState] = useState<AppState>({ hardwareId: "mbp-m4-pro-20c-48", ...initial });
  const hardware = resolveHardware(state)!;
  const [picks, setPicks] = useState<ModelPick[]>(() => {
    if (initialModels.length >= 2) return initialModels;
    // Fill up with the best candidates for this machine and workload.
    const r = recommendModels({ hardware: resolveHardware({ hardwareId: "mbp-m4-pro-20c-48", ...initial })!, workload: initial.workload });
    const extra = r.all.filter((x) => !initialModels.some((p) => p.id === x.model.id)).slice(0, 4 - initialModels.length);
    return [...initialModels, ...extra.map((x) => ({ id: x.model.id }))];
  });
  const [editHw, setEditHw] = useState(false);
  const setWorkload = (p: Partial<WorkloadProfileInput>) => setState((s) => ({ ...s, workload: { ...s.workload, ...p } }));
  useUrlSync(`${encodeState(state)}&models=${picks.map((p) => (p.quant ? `${p.id}:${p.quant}` : p.id)).join(",")}`);

  const recs = useMemo(
    () =>
      picks.map((p) => {
        const base = { hardware, modelId: p.id, os: state.os, runtimeId: state.runtimeId, workload: state.workload };
        return p.quant ? evaluate({ ...base, quant: p.quant }) : bestQuantFor(base);
      }),
    [picks, hardware, state.os, state.runtimeId, state.workload],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <CompareNav />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Compare models on your machine</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Not generic leaderboards: every model is rated for your hardware, your tool and your workload — so you can see which one will actually feel better to use.</p>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Hardware">
            <button type="button" onClick={() => setEditHw(!editHw)} className="rounded-lg border-2 bg-card px-3 py-2 text-left text-sm hover:bg-muted">
              <span className="block truncate font-medium">{hardware.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{hardwareSpecLine(hardware)}</span>
            </button>
          </Field>
          <Field label="Use case">
            <Select ariaLabel="Use case" value={state.workload.useCase} onChange={(u) => setWorkload(defaultsForUseCase(u, state.workload))} options={USE_CASE_LIST.map((u) => ({ value: u.id, label: u.label, group: u.group }))} />
          </Field>
          <Field label="Tool">
            <Select ariaLabel="Tool" value={state.workload.toolId} onChange={(t) => setWorkload({ toolId: t })} options={TOOLS.map((t) => ({ value: t.id, label: t.name }))} />
          </Field>
          <Field label="Other apps">
            <Select ariaLabel="Other apps" value={state.workload.devEnv ?? "normal"} onChange={(d) => setWorkload({ devEnv: d })} options={DEV_ENV_LIST.filter((d) => d.preset !== "custom").map((d) => ({ value: d.preset, label: `${d.label} (${d.reserveGB} GB)` }))} />
          </Field>
          <Field label="Context" className="md:col-span-2">
            <Segmented ariaLabel="Context" size="sm" value={state.workload.desiredContextWindow ?? 0} onChange={(c) => setWorkload({ desiredContextWindow: c || undefined })} options={[{ value: 0, label: "Auto" }, ...CONTEXT_STEPS.filter((c) => c >= 8192).map((c) => ({ value: c, label: fmtCtx(c) }))]} />
          </Field>
          <div className="flex flex-wrap items-end justify-end gap-2 md:col-span-2">
            <ShareButton saveLabel={`Model comparison on ${hardware.name}`} />
          </div>
          {editHw && (
            <div className="rounded-xl border-2 p-4 md:col-span-2 lg:col-span-4">
              <HardwarePicker value={{ hardwareId: state.hardwareId, custom: state.custom, os: state.os }} onChange={(v) => setState((s) => ({ ...s, ...v }))} workload={state.workload} />
              <Button className="mt-4" size="sm" onClick={() => setEditHw(false)}>
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {picks.map((p, i) => {
          const m = getModel(p.id);
          return (
            <span key={p.id} className="inline-flex items-center gap-1 rounded-lg border-2 bg-card py-1 pl-3 pr-1 text-sm">
              {m.name}
              <select
                aria-label={`Quantization for ${m.name}`}
                className="ml-1 rounded bg-muted px-1 py-0.5 text-xs"
                value={p.quant ?? "best"}
                onChange={(e) => setPicks((ps) => ps.map((x, j) => (j === i ? { ...x, quant: e.target.value === "best" ? undefined : (e.target.value as QuantId) } : x)))}
              >
                <option value="best">Best quant</option>
                {m.supportedQuantizations.map((q) => (
                  <option key={q} value={q}>
                    {QUANTIZATIONS[q].label}
                  </option>
                ))}
              </select>
              <button aria-label={`Remove ${m.name}`} className="rounded p-1 hover:bg-muted" onClick={() => setPicks((ps) => ps.filter((_, j) => j !== i))}>
                <X className="size-3.5" />
              </button>
            </span>
          );
        })}
        {picks.length < 8 && (
          <span className="inline-flex items-center gap-1 text-sm">
            <Plus className="size-4 text-muted-foreground" />
            <Select
              ariaLabel="Add model"
              className="w-64"
              value={""}
              onChange={(id) => id && !picks.some((p) => p.id === id) && setPicks((ps) => [...ps, { id }])}
              options={[{ value: "", label: "Add a model…", disabled: true }, ...selectableModels().filter((m) => !picks.some((p) => p.id === m.id)).map((m) => ({ value: m.id, label: m.name, group: modelGroup(m) }))]}
            />
          </span>
        )}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {hardware.name} · {workloadLabel(state.workload)}
      </p>
      <div className="mt-2">
        <ModelsTable recs={recs} hrefFor={(r) => recHref(r, state.workload, state.custom)} />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {recs.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{r.model.name}</p>
                <p className="text-xs text-muted-foreground">
                  {quantName(r)} · {r.runtime.name}
                </p>
              </div>
              <ComfortBadge level={r.level} size="sm" />
            </div>
            <p className="mt-3 text-sm">{r.verdict}</p>
            {r.dimensions.length > 0 && (
              <div className="mt-4">
                <DimensionGauges dims={r.dimensions} compact keys={["memory", "generation", "prefill", "context", "tool", "suitability"]} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
