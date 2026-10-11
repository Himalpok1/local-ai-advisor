"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ArrowRight, BadgeCheck, RotateCcw } from "lucide-react";
import type { HardwareConfiguration, OS } from "@/lib/schemas";
import { fmtUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Segmented, Select } from "@/components/ui/form";

const VENDOR_LABEL: Record<HardwareConfiguration["vendor"], string> = { apple: "Apple", nvidia: "NVIDIA", amd: "AMD", intel: "Intel", custom: "Custom" };
const FORM_LABEL: Record<HardwareConfiguration["formFactor"], string> = {
  laptop: "Laptop",
  "fanless-laptop": "Fanless laptop",
  desktop: "Desktop",
  mini: "Mini PC",
  workstation: "Workstation",
};
const ARCH_LABEL: Record<HardwareConfiguration["memoryArchitecture"], string> = { unified: "Unified", discrete: "Discrete GPU", "cpu-only": "CPU only" };
const OS_SHORT: Record<OS, string> = { macos: "macOS", linux: "Linux", windows: "Windows" };

type SortKey = "memory" | "bandwidth" | "price" | "year" | "name";

/** Memory a model can live in at GPU speed (unified pool, VRAM, or RAM for CPU-only). */
function modelMemoryGB(h: HardwareConfiguration) {
  return h.memoryArchitecture === "discrete" ? (h.gpu?.vramGB ?? 0) : h.systemRamGB;
}
function bandwidth(h: HardwareConfiguration) {
  return h.gpu?.bandwidthGBs ?? h.systemRamBandwidthGBs;
}

const EVIDENCE_FIELD_LABEL: Record<string, string> = {
  "gpu.vramGB": "GPU memory", "gpu.bandwidthGBs": "Memory bandwidth", "gpu.architecture": "GPU architecture",
  "gpu.fp16Tflops": "Compute estimate", "cpu": "CPU", "systemRamGB": "Installed RAM", "systemRamBandwidthGBs": "RAM bandwidth",
  "gpu.apis": "Runtime backends", "os": "Operating systems", "year": "Release year", "approxPriceUSD": "Price",
};
const MIN_MEMORY = [0, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 512];

export function HardwareExplorer({ hardware, benchmarkedChips }: { hardware: HardwareConfiguration[]; benchmarkedChips: string[] }) {
  const benchmarked = useMemo(() => new Set(benchmarkedChips), [benchmarkedChips]);
  const [query, setQuery] = useState("");
  const [reviewedOnly, setReviewedOnly] = useState(false);
  const [chartMetric, setChartMetric] = useState<"memory" | "bandwidth">("bandwidth");
  const [vendor, setVendor] = useState("all");
  const [form, setForm] = useState("all");
  const [arch, setArch] = useState<"all" | HardwareConfiguration["memoryArchitecture"]>("all");
  const [minMem, setMinMem] = useState("0");
  const [os, setOs] = useState<"all" | OS>("all");
  const [onlyBench, setOnlyBench] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "memory", dir: "desc" });

  const vendors = useMemo(() => [...new Set(hardware.map((h) => h.vendor))], [hardware]);
  const forms = useMemo(() => [...new Set(hardware.map((h) => h.formFactor))], [hardware]);

  const filtered = useMemo(() => {
    const min = Number(minMem);
    const out = hardware.filter((h) => {
      if (query.trim() && !`${h.name} ${h.gpu?.architecture ?? ""} ${h.chipKey} ${h.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
      if (reviewedOnly && !h.evidence) return false;
      if (vendor !== "all" && h.vendor !== vendor) return false;
      if (form !== "all" && h.formFactor !== form) return false;
      if (arch !== "all" && h.memoryArchitecture !== arch) return false;
      if (os !== "all" && !h.os.includes(os)) return false;
      if (modelMemoryGB(h) < min) return false;
      if (onlyBench && !benchmarked.has(h.chipKey)) return false;
      return true;
    });
    const val: Record<SortKey, (h: HardwareConfiguration) => number | string> = {
      memory: (h) => modelMemoryGB(h) * 1000 + h.systemRamGB / 1000,
      bandwidth,
      price: (h) => h.approxPriceUSD ?? (sort.dir === "asc" ? Infinity : -Infinity),
      year: (h) => h.year,
      name: (h) => h.name,
    };
    const f = val[sort.key];
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...out].sort((a, b) => {
      const x = f(a);
      const y = f(b);
      const c = typeof x === "string" ? x.localeCompare(String(y)) : (x as number) - (y as number);
      return sign * c || a.name.localeCompare(b.name);
    });
  }, [hardware, query, reviewedOnly, vendor, form, arch, os, minMem, onlyBench, benchmarked, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "price" ? "asc" : "desc" }));

  const reset = () => {
    setQuery("");
    setReviewedOnly(false);
    setVendor("all");
    setForm("all");
    setArch("all");
    setMinMem("0");
    setOs("all");
    setOnlyBench(false);
    setSort({ key: "memory", dir: "desc" });
  };

  const chartRows = useMemo(() => {
    const chips = new Map<string, HardwareConfiguration>();
    for (const h of filtered) {
      const old = chips.get(h.chipKey);
      if (!old || modelMemoryGB(h) > modelMemoryGB(old)) chips.set(h.chipKey, h);
    }
    return [...chips.values()].sort((a, b) => (chartMetric === "memory" ? modelMemoryGB(b) - modelMemoryGB(a) : bandwidth(b) - bandwidth(a))).slice(0, 12);
  }, [filtered, chartMetric]);
  const chartValue = (h: HardwareConfiguration) => chartMetric === "memory" ? modelMemoryGB(h) : bandwidth(h);
  const chartMax = Math.max(1, ...chartRows.map(chartValue));

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4 sm:p-5">
        <form aria-label="Filter hardware" onSubmit={(e) => e.preventDefault()} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Field label="Search devices" className="sm:col-span-2 lg:col-span-3 xl:col-span-6">
            <input type="search" aria-label="Search devices" placeholder="GPU, Mac, architecture or model name…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-lg border-2 bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Vendor">
            <Select ariaLabel="Vendor" value={vendor} onChange={setVendor} options={[{ value: "all", label: "All vendors" }, ...vendors.map((v) => ({ value: v, label: VENDOR_LABEL[v] }))]} />
          </Field>
          <Field label="Form factor">
            <Select ariaLabel="Form factor" value={form} onChange={setForm} options={[{ value: "all", label: "Any form factor" }, ...forms.map((f) => ({ value: f, label: FORM_LABEL[f] }))]} />
          </Field>
          <Field label="Memory architecture" className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <Segmented
              ariaLabel="Memory architecture"
              size="sm"
              value={arch}
              onChange={setArch}
              options={[
                { value: "all", label: "All" },
                { value: "unified", label: "Unified" },
                { value: "discrete", label: "Discrete GPU" },
                { value: "cpu-only", label: "CPU only" },
              ]}
            />
          </Field>
          <Field label="Min. model memory" hint="Unified pool, or VRAM on discrete GPUs">
            <Select
              ariaLabel="Minimum model memory"
              value={minMem}
              onChange={setMinMem}
              options={MIN_MEMORY.map((g) => ({ value: String(g), label: g === 0 ? "Any amount" : `${g} GB or more` }))}
            />
          </Field>
          <Field label="Operating system">
            <Select
              ariaLabel="Operating system"
              value={os}
              onChange={(v) => setOs(v)}
              options={[
                { value: "all", label: "Any OS" },
                { value: "macos", label: "macOS" },
                { value: "windows", label: "Windows" },
                { value: "linux", label: "Linux" },
              ]}
            />
          </Field>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing <strong className="text-foreground">{filtered.length}</strong> of {hardware.length} configurations
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyBench} onChange={(e) => setOnlyBench(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            Benchmarked chips only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reviewedOnly} onChange={(e) => setReviewedOnly(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            Field-level evidence available
          </label>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden /> Reset
          </Button>
        </div>
      </div>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Compare hardware specifications</h2>
        <Segmented ariaLabel="Hardware specifications chart metric" value={chartMetric} onChange={setChartMetric} options={[{ value: "bandwidth", label: "Memory bandwidth" }, { value: "memory", label: "Model memory" }]} size="sm" />
        <p className="my-3 text-xs text-muted-foreground">Top 12 matching chip families. Memory uses the largest matching configuration per chip: VRAM on discrete GPUs, total shared RAM on unified systems. Figures are catalog values, including legacy approximations; expand rows for evidence. They are not measured inference speeds or usable model capacity.</p>
        <ul className="space-y-3" aria-label="Hardware specification chart">
          {chartRows.map((h) => <li key={h.chipKey}>
            <div className="mb-1 flex flex-wrap justify-between gap-x-4 text-sm"><Link href={`/check?hw=${encodeURIComponent(h.id)}`} className="underline">{h.gpu?.name ?? h.cpu.name}</Link><strong>{chartValue(h)} {chartMetric === "memory" ? "GB" : "GB/s"}</strong></div>
            <div className="h-3 overflow-hidden rounded border bg-muted" aria-hidden="true"><div className="h-full bg-link" style={{ width: `${chartValue(h) / chartMax * 100}%` }} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{h.evidence ? "Source-reviewed GPU memory/bandwidth; example machine assumptions apply." : "Legacy record: individual fields still need evidence review."}</p>
          </li>)}
        </ul>
        {!chartRows.length && <p className="text-sm text-muted-foreground">No matching devices.</p>}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <caption className="sr-only">Hardware configurations. Column headers with buttons can be sorted.</caption>
            <thead className="border-b-2 bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <SortHeader label="Configuration" k="name" sort={sort} onSort={toggleSort} />
                <SortHeader label="Memory" k="memory" sort={sort} onSort={toggleSort} />
                <SortHeader label="Bandwidth" k="bandwidth" sort={sort} onSort={toggleSort} />
                <th scope="col" className="px-3 py-2.5 font-medium">GPU</th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Compute TFLOPS <span className="font-normal">(approx.)</span>
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">NPU</th>
                <th scope="col" className="px-3 py-2.5 font-medium">OS</th>
                <SortHeader label="Indicative price" k="price" sort={sort} onSort={toggleSort} />
                <SortHeader label="Year" k="year" sort={sort} onSort={toggleSort} />
                <th scope="col" className="px-3 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((h) => (
                <tr key={h.id} className="align-top transition hover:bg-muted/40">
                  <th scope="row" className="max-w-[280px] px-3 py-3 text-left font-normal">
                    <span className="block font-medium">{h.name}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <Badge>{FORM_LABEL[h.formFactor]}</Badge>
                      <Badge tone={h.memoryArchitecture === "unified" ? "primary" : "neutral"}>{ARCH_LABEL[h.memoryArchitecture]}</Badge>
                      {benchmarked.has(h.chipKey) && (
                        <Badge tone="good" title="Verified public llama.cpp benchmarks exist for this chip">
                          <BadgeCheck className="size-3" aria-hidden /> Benchmarked
                        </Badge>
                      )}
                    </span>
                    <details className="mt-2 text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Sources and assumptions</summary>
                      <p className="mt-2"><a className="underline" href={h.source.url} target="_blank" rel="noopener noreferrer">{h.source.title ?? "Specification source"}</a> · checked {h.source.lastVerified} · {h.source.confidence} source confidence</p>
                      {h.source.note && <p className="mt-1">{h.source.note}</p>}
                      {h.evidence ? <ul className="mt-2 space-y-2">{h.evidence.map((e, i) => <li key={i}><strong>{e.kind === "vendor-spec" ? "Vendor specification" : e.kind === "derived" ? "Derived" : "Assumption"}:</strong> {e.fields.map((f) => EVIDENCE_FIELD_LABEL[f] ?? f).join(", ")}. {e.detail} <a href={e.source.url} className="underline" target="_blank" rel="noopener noreferrer">Source</a> · {e.source.lastVerified}</li>)}</ul> : <p className="mt-2">Legacy record: individual field evidence has not been recorded. Compute, CPU/RAM defaults and prices may be approximations. A chip benchmark does not verify this entire configuration.</p>}
                    </details>
                  </th>
                  <td className="px-3 py-3 tabular-nums">
                    {h.memoryArchitecture === "discrete" ? (
                      <>
                        <span className="block font-medium">{h.gpu?.vramGB} GB VRAM</span>
                        <span className="text-xs text-muted-foreground">+ {h.systemRamGB} GB system RAM</span>
                      </>
                    ) : (
                      <>
                        <span className="block font-medium">{h.systemRamGB} GB</span>
                        <span className="text-xs text-muted-foreground">{h.memoryArchitecture === "unified" ? "unified memory" : "system RAM"}</span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums whitespace-nowrap">{bandwidth(h)} GB/s</td>
                  <td className="px-3 py-3">
                    {h.gpu ? (
                      <>
                        <span className="block">{h.gpu.name}</span>
                        <span className="text-xs text-muted-foreground">{h.gpu.apis.map((a) => a.toUpperCase()).join(" · ")}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">None ({h.cpu.name})</span>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {h.gpu ? (
                      <>
                        ≈{h.gpu.fp16Tflops}
                        {h.gpu.acceleratedFp16Tflops && (
                          <span className="block text-xs text-muted-foreground" title="With in-GPU neural accelerators, for runtimes that use them (MLX)">
                            ≈{h.gpu.acceleratedFp16Tflops} w/ accel.
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{h.npu ? `${h.npu.name} (${h.npu.tops} TOPS)` : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{h.os.map((o) => OS_SHORT[o]).join(", ")}</td>
                  <td className="px-3 py-3 tabular-nums whitespace-nowrap">{h.approxPriceUSD ? `≈${fmtUSD(h.approxPriceUSD)}` : "—"}</td>
                  <td className="px-3 py-3 tabular-nums">{h.year}</td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/check?hw=${encodeURIComponent(h.id)}`} className={buttonClass("secondary", "sm")} aria-label={`What can the ${h.name} run?`}>
                      What can it run? <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">
                    No configurations match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">
        Legacy prices are indicative USD estimates, including assumed PC build costs; they are not verified current offers. New additions omit unsourced prices. Compute values feed the prediction engine: source details identify vendor FP16 figures or explicit FP32 proxies.
      </p>
    </div>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className="px-3 py-2.5 font-medium">
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn("inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring", active && "text-foreground")}
      >
        {label}
        <Icon className="size-3" aria-hidden />
      </button>
    </th>
  );
}
