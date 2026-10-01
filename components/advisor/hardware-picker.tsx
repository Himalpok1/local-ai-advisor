"use client";
import { useMemo, useState } from "react";
import { Apple, Cpu, Laptop, Monitor, Wrench } from "lucide-react";
import { HARDWARE, buildCustomHardware, type CustomHardwareInput } from "@/data";
import type { HardwareConfiguration, OS } from "@/lib/schemas";
import { osLabel } from "@/lib/compatibility";
import { cn } from "@/lib/utils";
import { Field, NumberInput, Segmented, Select, Switch } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

export interface HardwareValue {
  hardwareId?: string;
  custom?: CustomHardwareInput;
  os?: OS;
}

type Tab = "apple" | "nvidia" | "amd" | "intel" | "custom";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "apple", label: "Mac", icon: <Apple className="size-4" /> },
  { id: "nvidia", label: "NVIDIA", icon: <Monitor className="size-4" /> },
  { id: "amd", label: "AMD", icon: <Cpu className="size-4" /> },
  { id: "intel", label: "Intel", icon: <Laptop className="size-4" /> },
  { id: "custom", label: "Custom", icon: <Wrench className="size-4" /> },
];

const DEFAULT_CUSTOM: CustomHardwareInput = { architecture: "discrete", gpuVendor: "nvidia", vramGB: 16, ramGB: 32, bandwidthGBs: 500, os: "windows" };

function chipLabel(h: HardwareConfiguration) {
  return `${h.cpu.name} · ${h.gpu?.cores ?? "?"}-core GPU (${h.year})`;
}

export function hardwareSpecLine(h: HardwareConfiguration): string {
  if (h.memoryArchitecture === "discrete") return `${h.gpu?.vramGB} GB VRAM (${h.gpu?.bandwidthGBs} GB/s) + ${h.systemRamGB} GB RAM`;
  if (h.memoryArchitecture === "unified") return `${h.systemRamGB} GB unified memory · ${h.gpu?.bandwidthGBs} GB/s`;
  return `${h.systemRamGB} GB RAM · ${h.systemRamBandwidthGBs} GB/s · CPU only`;
}

export function HardwarePicker({ value, onChange }: { value: HardwareValue; onChange: (v: HardwareValue) => void }) {
  const current = value.hardwareId && value.hardwareId !== "custom" ? HARDWARE.find((h) => h.id === value.hardwareId) : undefined;
  const initialTab: Tab = value.hardwareId === "custom" ? "custom" : current ? (current.vendor === "custom" ? "custom" : (current.vendor as Tab)) : "apple";
  const [tab, setTab] = useState<Tab>(initialTab);

  const apple = useMemo(() => HARDWARE.filter((h) => h.vendor === "apple"), []);
  const devices = useMemo(() => [...new Set(apple.map((h) => h.device))], [apple]);
  const [device, setDevice] = useState<string>(current?.vendor === "apple" ? current.device : "MacBook Pro");
  const chips = useMemo(() => {
    const m = new Map<string, HardwareConfiguration>();
    for (const h of apple.filter((x) => x.device === device)) if (!m.has(h.chipKey + h.year)) m.set(h.chipKey + h.year, h);
    return [...m.values()].sort((a, b) => b.year - a.year || b.systemRamGB - a.systemRamGB);
  }, [apple, device]);
  const currentChip = current?.vendor === "apple" && current.device === device ? current.chipKey + current.year : undefined;
  const [chip, setChip] = useState<string | undefined>(currentChip);
  const chipKey = chip ?? chips[0]?.chipKey + chips[0]?.year;
  const memories = apple.filter((h) => h.device === device && h.chipKey + h.year === chipKey);

  const pick = (h: HardwareConfiguration) => onChange({ hardwareId: h.id, os: h.os.includes(value.os as OS) ? value.os : h.os[0] });

  const pcList = (vendor: string) =>
    HARDWARE.filter((h) => h.vendor === vendor).map((h) => ({
      value: h.id,
      label: h.name,
      group: h.formFactor === "laptop" ? "Laptops" : h.memoryArchitecture === "unified" ? "Unified memory systems" : h.memoryArchitecture === "cpu-only" ? "CPU only" : "Desktop GPUs",
    }));

  const custom = value.custom ?? DEFAULT_CUSTOM;
  const setCustom = (patch: Partial<CustomHardwareInput>) => onChange({ hardwareId: "custom", custom: { ...custom, ...patch }, os: (patch.os ?? custom.os) as OS });
  const selected = value.hardwareId === "custom" ? buildCustomHardware(custom) : current;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Hardware vendor">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === "custom") onChange({ hardwareId: "custom", custom, os: custom.os });
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
              tab === t.id ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "apple" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Which Mac?">
            <Select
              ariaLabel="Mac model"
              value={device}
              onChange={(d) => {
                setDevice(d);
                setChip(undefined);
                const first = apple.filter((h) => h.device === d).sort((a, b) => b.year - a.year)[0];
                if (first) pick(first);
              }}
              options={devices.map((d) => ({ value: d, label: d }))}
            />
          </Field>
          <Field label="Chip">
            <Select
              ariaLabel="Chip"
              value={chipKey}
              onChange={(k) => {
                setChip(k);
                const first = apple.find((h) => h.device === device && h.chipKey + h.year === k);
                if (first) pick(first);
              }}
              options={chips.map((h) => ({ value: h.chipKey + h.year, label: chipLabel(h) }))}
            />
          </Field>
          <Field label="Memory">
            <Segmented
              ariaLabel="Unified memory"
              value={current?.vendor === "apple" && memories.some((m) => m.id === current.id) ? current.id : ""}
              onChange={(id) => pick(HARDWARE.find((h) => h.id === id)!)}
              options={memories.map((m) => ({ value: m.id, label: `${m.systemRamGB} GB` }))}
            />
          </Field>
        </div>
      )}

      {(tab === "nvidia" || tab === "amd" || tab === "intel") && (
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="System" hint="Desktop configurations assume a typical CPU; pick Custom to enter exact specs.">
            <Select ariaLabel="PC configuration" value={current?.vendor === tab ? current.id : undefined} onChange={(id) => pick(HARDWARE.find((h) => h.id === id)!)} options={[{ value: "" as string, label: "Select a configuration…", disabled: true }, ...pcList(tab)]} />
          </Field>
          {current && current.os.length > 1 && (
            <Field label="Operating system">
              <Segmented ariaLabel="Operating system" value={value.os ?? current.os[0]} onChange={(os) => onChange({ ...value, os })} options={current.os.map((o) => ({ value: o, label: osLabel(o) }))} />
            </Field>
          )}
        </div>
      )}

      {tab === "custom" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Memory architecture">
            <Select
              ariaLabel="Memory architecture"
              value={custom.architecture}
              onChange={(a) => setCustom({ architecture: a, gpuVendor: a === "cpu-only" ? undefined : custom.gpuVendor ?? "nvidia" })}
              options={[
                { value: "discrete", label: "Discrete GPU (separate VRAM)" },
                { value: "unified", label: "Unified memory (Apple / Ryzen AI Max / DGX Spark)" },
                { value: "cpu-only", label: "CPU only" },
              ]}
            />
          </Field>
          {custom.architecture !== "cpu-only" && (
            <Field label="GPU vendor">
              <Select ariaLabel="GPU vendor" value={custom.gpuVendor ?? "nvidia"} onChange={(v) => setCustom({ gpuVendor: v, os: v === "apple" ? "macos" : custom.os === "macos" ? "linux" : custom.os })} options={[{ value: "nvidia", label: "NVIDIA" }, { value: "amd", label: "AMD" }, { value: "intel", label: "Intel" }, { value: "apple", label: "Apple" }]} />
            </Field>
          )}
          <Field label="Operating system">
            <Select ariaLabel="Operating system" value={custom.os} onChange={(os) => setCustom({ os })} options={(custom.gpuVendor === "apple" ? ["macos"] : ["windows", "linux", "macos"]).map((o) => ({ value: o as OS, label: osLabel(o as OS) }))} />
          </Field>
          {custom.architecture === "discrete" && (
            <Field label="GPU VRAM">
              <NumberInput ariaLabel="VRAM" value={custom.vramGB} onChange={(v) => setCustom({ vramGB: v ?? 8 })} min={1} max={512} suffix="GB" />
            </Field>
          )}
          <Field label={custom.architecture === "unified" ? "Unified memory" : "System RAM"}>
            <NumberInput ariaLabel="RAM" value={custom.ramGB} onChange={(v) => setCustom({ ramGB: v ?? 16 })} min={2} max={2048} suffix="GB" />
          </Field>
          <Field label={custom.architecture === "discrete" ? "VRAM bandwidth" : "Memory bandwidth"} hint="The biggest driver of generation speed.">
            <NumberInput ariaLabel="Bandwidth" value={custom.bandwidthGBs} onChange={(v) => setCustom({ bandwidthGBs: v ?? 100 })} min={10} max={10000} suffix="GB/s" />
          </Field>
          <Field label="GPU FP16 compute (optional)" hint="Drives prompt-processing speed.">
            <NumberInput ariaLabel="TFLOPS" value={custom.tflops} onChange={(v) => setCustom({ tflops: v })} min={0.5} max={5000} suffix="TFLOPS" placeholder="auto" />
          </Field>
          <div className="flex items-end pb-2">
            <Switch checked={!!custom.laptop} onChange={(v) => setCustom({ laptop: v })} label="Laptop" hint="Affects thermals & battery" />
          </div>
        </div>
      )}

      {selected && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selected.name}</span>
          <span className="text-muted-foreground">· {hardwareSpecLine(selected)}</span>
          {selected.gpu?.acceleratedFp16Tflops && <Badge tone="primary">GPU neural accelerators</Badge>}
          {selected.source.confidence === "low" && <Badge>Specs partly unverified</Badge>}
        </div>
      )}
    </div>
  );
}
