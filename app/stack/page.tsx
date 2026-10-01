import type { Metadata } from "next";
import { GatedStackBuilder } from "@/components/advisor/gated-views";
import { decodeState } from "@/lib/share";

export const metadata: Metadata = {
  title: "Build my local AI stack",
  description: "Hardware → runtime → model → local API → AI tool: get a complete, explained local AI setup for your workload.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const state = decodeState(await searchParams);
  return <GatedStackBuilder initial={state} />;
}
