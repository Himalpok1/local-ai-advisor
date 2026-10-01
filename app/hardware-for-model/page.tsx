import type { Metadata } from "next";
import { HardwareSearch } from "@/components/advisor/hardware-search";
import { decodeState } from "@/lib/share";

export const metadata: Metadata = {
  title: "What hardware do I need?",
  description: "Pick a model, tool and workload; see which computers deliver a comfortable experience — grouped by your target, not by whether the model merely loads.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const state = decodeState(params, { useCase: "agentic-coding", toolId: "opencode", repositorySize: "medium", priority: "balanced", devEnv: "normal" });
  return <HardwareSearch initial={state} />;
}
