"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { Recommendation } from "@/lib/schemas/results";
import { COMFORT_RANK } from "@/lib/schemas/results";
import { fmtCtx, fmtGB, fmtTps } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ComfortBadge, ConfidenceBadge } from "./comfort";
import { quantName } from "./recommendation-card";

const LEVEL_WORD = { excellent: "Excellent", good: "Comfortable", fair: "Adequate", poor: "Slow", inadequate: "Too slow" } as const;

export function tierWord(t: number) {
  return t >= 4.3 ? "Excellent" : t >= 3.7 ? "Strong" : t >= 3.1 ? "Good" : t >= 2.5 ? "Fair" : "Weak";
}

type SortKey = "rating" | "memory" | "headroom" | "generation" | "prefill" | "context" | "coding" | "agent";

export function ModelsTable({
  recs,
  hrefFor,
  selectable,
  selected,
  onToggle,
}: {
  recs: Recommendation[];
  hrefFor: (r: Recommendation) => string;
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?: (modelId: string) => void;
}) {
  const [sort, setSort] = useState<SortKey>("rating");
  const [dir, setDir] = useState<1 | -1>(-1);
  const sorted = useMemo(() => {
    const val = (r: Recommendation): number => {
      switch (sort) {
        case "rating":
          return COMFORT_RANK[r.level] * 10 + r.composite;
        case "memory":
          return r.memory.inferencePeakGB;
        case "headroom":
          return r.memory.headroomGB;
        case "generation":
          return r.performance?.perStreamGenerationTps ?? -1;
        case "prefill":
          return r.performance?.prefillTps ?? -1;
        case "context":
          return r.context.maxPractical;
        case "coding":
          return r.model.capabilities.coding - r.quant.qualityLoss * 10;
        case "agent":
          return r.model.capabilities.agentic - r.quant.qualityLoss * 10;
      }
    };
    return [...recs].sort((a, b) => (val(a) - val(b)) * dir);
  }, [recs, sort, dir]);


  const onSort = (k: SortKey) => {
    if (sort === k) setDir(dir === 1 ? -1 : 1);
    else {
      setSort(k);
      setDir(-1);
    }
  };

  return (
    <>
      {/* Phones: one card per model, sorted by the same control. */}
      <div className="md:hidden">
        <label className="mb-2 flex items-center justify-end gap-2 text-sm text-muted-foreground">
          Sort by
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setDir(-1);
            }}
            className="h-10 rounded-xl border-2 border-ink bg-card px-3 text-sm font-medium text-foreground"
          >
            <option value="rating">Rating</option>
            <option value="generation">Speed</option>
            <option value="headroom">Free memory</option>
            <option value="memory">Memory used</option>
            <option value="coding">Coding skill</option>
          </select>
        </label>
        <ul className="space-y-2">
          {sorted.map((r) => {
            const blocked = r.level === "unsupported" || r.level === "does-not-fit";
            return (
              <li key={r.id} className="flex items-stretch gap-1 rounded-2xl border-2 border-ink bg-card">
                {selectable && (
                  <label className="grid w-11 shrink-0 cursor-pointer place-items-center rounded-l-2xl">
                    <input type="checkbox" aria-label={`Compare ${r.model.name}`} checked={selected?.has(r.model.id) ?? false} onChange={() => onToggle?.(r.model.id)} className="size-5 accent-[var(--primary)]" />
                  </label>
                )}
                <Link href={hrefFor(r)} className={cn("min-w-0 flex-1 py-3 pr-3 active:opacity-70", !selectable && "pl-4")}>
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug">{r.model.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {quantName(r)} · {r.runtime.name}
                      </span>
                    </span>
                    <ComfortBadge level={r.level} size="sm" />
                  </span>
                  {!blocked && (
                    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {r.performance && (
                        <span>
                          Speed <strong className="font-semibold text-foreground">{fmtTps(r.performance.perStreamGenerationTps, r.performance.basis)}</strong>
                        </span>
                      )}
                      <span>
                        Uses <strong className="font-semibold text-foreground">{fmtGB(r.memory.inferencePeakGB || r.memory.weightsGB)}</strong>
                      </span>
                      <span className={cn(r.memory.headroomGB < 1 && "text-technical")}>
                        Free <strong className="font-semibold text-foreground">{fmtGB(r.memory.headroomGB)}</strong>
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border-2 bg-card md:block">
        <table className="w-full text-sm">
          <thead className="border-b-2 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {selectable && <th className="py-2 pl-4 pr-2 font-medium"><span className="sr-only">Compare</span></th>}
              <th className="py-2 pl-4 pr-4 font-medium">Model</th>
              <Th sort={sort} dir={dir} onSort={onSort} k="rating">Comfort rating</Th>
              <Th sort={sort} dir={dir} onSort={onSort} k="memory">Memory</Th>
              <Th sort={sort} dir={dir} onSort={onSort} k="headroom">Headroom</Th>
              <Th sort={sort} dir={dir} onSort={onSort} k="generation">Generation</Th>
              <Th sort={sort} dir={dir} onSort={onSort} k="prefill">Prompt processing</Th>
              <Th sort={sort} dir={dir} onSort={onSort} k="context">Max practical context</Th>
              <Th sort={sort} dir={dir} onSort={onSort} k="coding">Coding</Th>
              <Th sort={sort} dir={dir} onSort={onSort} k="agent">Agent use</Th>
              <th className="py-2 pr-4 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const blocked = r.level === "unsupported" || r.level === "does-not-fit";
              const gen = r.dimensions.find((d) => d.key === "generation");
              const pp = r.dimensions.find((d) => d.key === "prefill");
              return (
                <tr key={r.id} className="border-b-2 last:border-0 hover:bg-muted/30">
                  {selectable && (
                    <td className="py-2 pl-4 pr-2">
                      <input type="checkbox" aria-label={`Compare ${r.model.name}`} checked={selected?.has(r.model.id) ?? false} onChange={() => onToggle?.(r.model.id)} className="size-4 accent-[var(--primary)]" />
                    </td>
                  )}
                  <td className="py-2 pl-4 pr-4">
                    <Link href={hrefFor(r)} className="font-medium hover:text-link hover:underline">
                      {r.model.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {quantName(r)} · {r.runtime.name}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <ComfortBadge level={r.level} size="sm" />
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4 tabular-nums">{blocked && r.level !== "does-not-fit" ? "—" : fmtGB(r.memory.inferencePeakGB || r.memory.weightsGB)}</td>
                  <td className={cn("whitespace-nowrap py-2 pr-4 tabular-nums", r.memory.headroomGB < 1 && "text-technical")}>{blocked ? "—" : fmtGB(r.memory.headroomGB)}</td>
                  <td className="whitespace-nowrap py-2 pr-4">
                    {gen && r.performance ? (
                      <>
                        {LEVEL_WORD[gen.level]}
                        <span className="block text-xs text-muted-foreground">{fmtTps(r.performance.perStreamGenerationTps, r.performance.basis)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4">{pp ? LEVEL_WORD[pp.level] : "—"}</td>
                  <td className="whitespace-nowrap py-2 pr-4 tabular-nums">{r.context.maxPractical ? fmtCtx(r.context.maxPractical) : "—"}</td>
                  <td className="whitespace-nowrap py-2 pr-4">{tierWord(r.model.capabilities.coding - r.quant.qualityLoss * 10)}</td>
                  <td className="whitespace-nowrap py-2 pr-4">{r.model.toolCalling === "none" ? "No tool calling" : tierWord(r.model.capabilities.agentic - r.quant.qualityLoss * 10)}</td>
                  <td className="py-2 pr-4">{!blocked && <ConfidenceBadge level={r.confidence.level} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ k, sort, dir, onSort, children, className }: { k: SortKey; sort: SortKey; dir: 1 | -1; onSort: (k: SortKey) => void; children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("whitespace-nowrap py-2 pr-4 font-medium", className)} aria-sort={sort === k ? (dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort(k)}>
        {children}
        <ArrowUpDown className="size-3" />
      </button>
    </th>
  );
}
