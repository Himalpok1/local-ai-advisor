import type { MemoryBreakdown } from "@/lib/schemas/results";
import { fmtGB } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { key: "osReserveGB", label: "Reserved for OS", color: "bg-sticker-teal" },
  { key: "devEnvReserveGB", label: "Other apps / dev environment", color: "bg-sticker-blue" },
  { key: "toolOverheadGB", label: "AI tool", color: "bg-sticker-orange" },
  { key: "runtimeOverheadGB", label: "Runtime overhead & buffers", color: "bg-primary" },
  { key: "weightsGB", label: "Model weights", color: "bg-primary" },
  { key: "kvCacheGB", label: "KV cache (context)", color: "bg-sticker-pink" },
  { key: "visionEncoderGB", label: "Vision encoder", color: "bg-sticker-green" },
] as const;

function Bar({ parts, total, label }: { parts: { label: string; value: number; color: string }[]; total: number; label: string }) {
  const used = parts.reduce((a, p) => a + p.value, 0);
  const over = used > total;
  const scale = Math.max(total, used);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
        <span className={cn(over && "font-medium text-technical")}>
          {fmtGB(used)} of {fmtGB(total)} {over ? "— over capacity" : `· ${fmtGB(total - used)} free`}
        </span>
      </div>
      <div className="relative flex h-5 overflow-hidden rounded-md border-2 border-ink bg-muted" role="img" aria-label={`${label}: ${fmtGB(used)} used of ${fmtGB(total)}`}>
        {parts.map((p) => (
          <div key={p.label} className={cn("h-full border-r-2 border-ink", p.color)} style={{ width: `${(p.value / scale) * 100}%` }} title={`${p.label}: ${fmtGB(p.value)}`} />
        ))}
        {over && <div className="absolute inset-y-0 border-l-2 border-ink" style={{ left: `${(total / scale) * 100}%` }} />}
      </div>
    </div>
  );
}

export function MemoryBreakdownView({ m }: { m: MemoryBreakdown & { gpuResidentGB?: number; cpuResidentGB?: number } }) {
  const val = (k: (typeof SEGMENTS)[number]["key"]) => m[k] as number;
  if (m.architecture === "discrete" && m.vramGB) {
    const f = m.gpuOffloadFraction;
    const gpuParts = [
      { label: "Model weights (in VRAM)", value: m.weightsGB * f, color: "bg-primary" },
      { label: "KV cache", value: m.kvCacheGB * f, color: "bg-sticker-pink" },
      { label: "Runtime overhead", value: m.runtimeOverheadGB, color: "bg-primary" },
      { label: "Vision encoder", value: m.visionEncoderGB * f, color: "bg-sticker-green" },
    ];
    const ramParts = [
      { label: "Reserved for OS", value: m.osReserveGB, color: "bg-sticker-teal" },
      { label: "Other apps", value: m.devEnvReserveGB, color: "bg-sticker-blue" },
      { label: "AI tool", value: m.toolOverheadGB, color: "bg-sticker-orange" },
      { label: "Spilled model layers", value: (m.weightsGB + m.kvCacheGB + m.visionEncoderGB) * (1 - f), color: "bg-primary" },
    ];
    return (
      <div className="space-y-4">
        <Bar parts={gpuParts} total={m.vramGB} label={`GPU VRAM (${m.vramGB} GB)`} />
        <Bar parts={ramParts} total={m.installedGB} label={`System RAM (${m.installedGB} GB)`} />
        <Legend />
        <Table m={m} />
      </div>
    );
  }
  const parts = SEGMENTS.map((s) => ({ label: s.label, value: val(s.key), color: s.color })).filter((p) => p.value > 0.01);
  return (
    <div className="space-y-4">
      <Bar parts={parts} total={m.installedGB} label={m.architecture === "unified" ? `Unified memory (${m.installedGB} GB, shared by CPU and GPU)` : `System RAM (${m.installedGB} GB)`} />
      {m.gpuLimitGB && (
        <p className="text-xs text-muted-foreground">
          GPU may use up to ≈{fmtGB(m.gpuLimitGB)} of unified memory at the current setting.
        </p>
      )}
      <Legend />
      <Table m={m} />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {SEGMENTS.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-sm border-[1.5px] border-ink", s.color)} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

function Table({ m }: { m: MemoryBreakdown }) {
  const rows: [string, number, string?][] = [
    ["Installed memory", m.installedGB],
    ...(m.vramGB ? ([["GPU VRAM", m.vramGB]] as [string, number][]) : []),
    ["Reserved for OS", m.osReserveGB],
    ["Other apps / dev environment", m.devEnvReserveGB],
    ["AI tool process", m.toolOverheadGB],
    ["Runtime overhead & buffers", m.runtimeOverheadGB],
    ["Model weights", m.weightsGB],
    ["KV cache", m.kvCacheGB],
    ...(m.visionEncoderGB ? ([["Vision encoder", m.visionEncoderGB]] as [string, number][]) : []),
    ["Estimated peak (inference)", m.inferencePeakGB, "font-medium"],
    ["Remaining headroom", m.headroomGB, m.headroomGB < 1 ? "font-semibold text-technical" : "font-semibold text-comfortable"],
  ];
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
      {rows.map(([k, v, cls]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className={cn("text-right tabular-nums", cls)}>{k === "Remaining headroom" && v < 0 ? `−${fmtGB(-v)}` : fmtGB(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
