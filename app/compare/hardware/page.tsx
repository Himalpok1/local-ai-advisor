import type { Metadata } from "next";
import { CompareHardware } from "@/components/advisor/compare-hardware";
import { decodeState } from "@/lib/share";
import { HARDWARE_MAP } from "@/data";

export const metadata: Metadata = {
  title: "Compare hardware for my workload",
  description: "See how different Macs, PCs and AI boxes handle the same model and workload — with tradeoffs, not an opaque winner.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const state = decodeState(params);
  const ids = (typeof params.hws === "string" ? params.hws : "").split(",").filter((id) => HARDWARE_MAP.has(id)).slice(0, 6);
  return <CompareHardware initial={state} initialHardware={ids} />;
}
