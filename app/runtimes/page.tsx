import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { RUNTIMES } from "@/data";
import type { ApiKind, BackendSupport, ComputeApi, OS, Runtime } from "@/lib/schemas";
import { BACKEND_LABEL, apiLabel, osLabel } from "@/lib/compatibility";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExplorePage, ExploreSectionBlock } from "@/components/explore/explore-nav";
import { MATURITY_CELL, MaturityBadge } from "@/components/explore/badges";
import { ExternalA, SourceLink } from "@/components/explore/source-link";

export const metadata: Metadata = {
  title: "Inference runtimes",
  description:
    "Ollama, llama.cpp, LM Studio, MLX-LM, vLLM and more: which platforms and GPU backends each supports, which APIs they expose, and how well they handle concurrent requests.",
  alternates: { canonical: "/runtimes" },
};

const OSES: OS[] = ["macos", "linux", "windows"];
const BACKENDS: ComputeApi[] = ["metal", "cuda", "rocm", "vulkan", "sycl", "cpu"];
const BACKEND_SHORT: Record<ComputeApi, string> = { metal: "Metal", cuda: "CUDA", rocm: "ROCm", vulkan: "Vulkan", sycl: "SYCL", cpu: "CPU" };
const APIS: ApiKind[] = ["openai", "anthropic", "ollama"];
const API_SHORT: Record<ApiKind, string> = { openai: "OpenAI", anthropic: "Anthropic", ollama: "Ollama" };
const KIND_LABEL: Record<Runtime["kind"], string> = { engine: "Inference engine", app: "Desktop app", server: "Model server" };
const AUDIENCE_LABEL: Record<Runtime["audience"], string> = { beginner: "Beginner-friendly", intermediate: "Intermediate", advanced: "Advanced users" };
const FORMAT_LABEL = { gguf: "GGUF", mlx: "MLX", safetensors: "safetensors" } as const;
const MATURITY_RANK = { mature: 3, good: 2, experimental: 1 } as const;

function concurrencyWords(p: number): { label: string; detail: string; tone: "good" | "primary" | "warn" } {
  if (p <= 0.2) return { label: "Excellent batching", detail: "Continuous batching: parallel requests and agents barely slow each other down.", tone: "good" };
  if (p <= 0.6) return { label: "Moderate", detail: "Parallel slots work, but each extra request noticeably slows every stream.", tone: "primary" };
  return { label: "Mostly sequential", detail: "Concurrent requests largely queue up; best for one user at a time.", tone: "warn" };
}

function cacheWords(r: number) {
  if (r >= 0.9) return "Excellent — shared prompt prefixes are almost always reused";
  if (r >= 0.8) return "Good — follow-up turns usually skip re-reading the history";
  if (r >= 0.7) return "Fair — reused within a session, sometimes re-processed";
  return "Limited";
}

/** Best backend entry for an API on an OS (a runtime may list one per engine). */
function backendFor(rt: Runtime, api: ComputeApi, os?: OS): BackendSupport | undefined {
  return rt.backends
    .filter((b) => b.api === api && (!os || b.os.includes(os)))
    .sort((a, b) => MATURITY_RANK[b.maturity] - MATURITY_RANK[a.maturity])[0];
}

export default function RuntimesPage() {
  return (
    <ExplorePage
      current="runtimes"
      title="Inference runtimes"
      intro="The runtime is the software that actually loads the model and runs it on your GPU or CPU; your AI tool talks to it over an API."
    >
      <ExploreSectionBlock
        id="matrix"
        title="Compatibility matrix"
        description="Which GPU backends each runtime supports (best maturity on any OS) and which APIs it exposes to AI tools."
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <caption className="sr-only">Runtimes by compute backend and API</caption>
              <thead className="border-b bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" rowSpan={2} className="px-3 py-2 text-left font-medium">
                    Runtime
                  </th>
                  <th scope="colgroup" colSpan={BACKENDS.length} className="border-l px-3 pt-2 pb-1 text-center font-medium">
                    Compute backends
                  </th>
                  <th scope="colgroup" colSpan={APIS.length} className="border-l px-3 pt-2 pb-1 text-center font-medium">
                    APIs exposed
                  </th>
                  <th scope="col" rowSpan={2} className="border-l px-3 py-2 text-left font-medium">
                    Formats
                  </th>
                </tr>
                <tr>
                  {BACKENDS.map((b, i) => (
                    <th key={b} scope="col" title={BACKEND_LABEL[b]} className={cn("px-2 pb-2 text-center font-medium", i === 0 && "border-l")}>
                      {BACKEND_SHORT[b]}
                    </th>
                  ))}
                  {APIS.map((a, i) => (
                    <th key={a} scope="col" title={apiLabel(a)} className={cn("px-2 pb-2 text-center font-medium", i === 0 && "border-l")}>
                      {API_SHORT[a]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {RUNTIMES.map((rt) => (
                  <tr key={rt.id} className="hover:bg-muted/40">
                    <th scope="row" className="px-3 py-2.5 text-left font-medium">
                      <a href={`#rt-${rt.id}`} className="hover:underline">
                        {rt.name}
                      </a>
                    </th>
                    {BACKENDS.map((api, i) => {
                      const b = backendFor(rt, api);
                      return (
                        <td key={api} className={cn("px-1.5 py-2 text-center", i === 0 && "border-l")}>
                          {b ? (
                            <span
                              className={cn("inline-block rounded px-1.5 py-0.5 text-xs font-medium capitalize", MATURITY_CELL[b.maturity])}
                              title={`${BACKEND_LABEL[api]}: ${b.maturity} on ${b.os.map(osLabel).join(", ")}`}
                            >
                              {b.maturity}
                            </span>
                          ) : (
                            <span role="img" className="text-muted-foreground" aria-label="Not supported">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {APIS.map((a, i) => (
                      <td key={a} className={cn("px-2 py-2 text-center", i === 0 && "border-l")}>
                        {rt.apis.includes(a) ? (
                          <Check className="mx-auto size-4 text-comfortable" aria-label="Yes" />
                        ) : (
                          <Minus className="mx-auto size-4 text-muted-foreground/60" aria-label="No" />
                        )}
                      </td>
                    ))}
                    <td className="border-l px-3 py-2 text-xs whitespace-nowrap">{rt.formats.map((f) => FORMAT_LABEL[f]).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Maturity: <MaturityBadge maturity="mature" /> production-ready <MaturityBadge maturity="good" /> works well, fewer users
          <MaturityBadge maturity="experimental" /> expect rough edges. These are editorial assessments.
        </p>
      </ExploreSectionBlock>

      <ExploreSectionBlock id="runtimes" title="All runtimes">
        <ul className="grid gap-5 lg:grid-cols-2">
          {RUNTIMES.map((rt) => (
            <li key={rt.id} id={`rt-${rt.id}`} className="scroll-mt-20">
              <RuntimeCard rt={rt} />
            </li>
          ))}
        </ul>
      </ExploreSectionBlock>
    </ExplorePage>
  );
}

function RuntimeCard({ rt }: { rt: Runtime }) {
  const conc = concurrencyWords(rt.concurrencyPenalty);
  const apis = [...new Set(rt.backends.map((b) => b.api))].sort((a, b) => BACKENDS.indexOf(a) - BACKENDS.indexOf(b));
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-lg">{rt.name}</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{KIND_LABEL[rt.kind]}</Badge>
            <Badge tone={rt.audience === "beginner" ? "good" : rt.audience === "advanced" ? "warn" : "primary"}>{AUDIENCE_LABEL[rt.audience]}</Badge>
          </div>
        </div>
        <CardDescription>{rt.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Item label="Engine">{rt.engine}</Item>
          <Item label="Model formats">{rt.formats.map((f) => FORMAT_LABEL[f]).join(", ")}</Item>
          <Item label="APIs">{rt.apis.map((a) => API_SHORT[a]).join(", ")}</Item>
          <Item label="Concurrency">
            <Badge tone={conc.tone}>{conc.label}</Badge>
          </Item>
          <Item label="KV cache quantization">{rt.supportsKvQuant ? "Supported" : "Not supported"}</Item>
          <Item label="Local API server">{rt.apiServer ? "Yes" : "No"}</Item>
        </dl>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Concurrency:</span> {conc.detail}{" "}
          <span className="font-medium text-foreground">Prompt cache reuse:</span> {cacheWords(rt.promptCacheReuse)}.
        </p>
        {(rt.appleSiliconOnly || rt.hardwareVendors) && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Hardware restriction:</span>{" "}
            {rt.appleSiliconOnly ? "Apple Silicon Macs only." : `${rt.hardwareVendors?.map((v) => v.toUpperCase()).join(" / ")} hardware only.`}
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <caption className="sr-only">{rt.name}: backend maturity per operating system</caption>
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th scope="col" className="px-2.5 py-1.5 text-left font-medium">
                  Backend
                </th>
                {OSES.map((os) => (
                  <th key={os} scope="col" className="px-2.5 py-1.5 text-center font-medium">
                    {osLabel(os)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {apis.map((api) => (
                <tr key={api}>
                  <th scope="row" className="px-2.5 py-1.5 text-left font-medium">
                    {BACKEND_LABEL[api]}
                    {rt.backends.some((b) => b.api === api && b.usesAccelerators) && (
                      <span className="ml-1 font-normal text-muted-foreground" title="Uses in-GPU matrix accelerators (e.g. Apple M5 Neural Accelerators)">
                        · accel.
                      </span>
                    )}
                  </th>
                  {OSES.map((os) => {
                    const b = backendFor(rt, api, os);
                    return (
                      <td key={os} className="px-2.5 py-1.5 text-center">
                        {b ? <MaturityBadge maturity={b.maturity} /> : <span role="img" className="text-muted-foreground" aria-label="Not available">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-auto flex flex-col gap-1.5 border-t pt-3 text-xs">
          <ExternalA href={rt.docsUrl}>Documentation</ExternalA>
          <SourceLink source={rt.source} />
          {rt.source.note && <p className="text-muted-foreground">{rt.source.note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
