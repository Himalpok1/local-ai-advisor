import type { Metadata } from "next";
import { CheckFlow } from "@/components/advisor/check-flow";
import { decodeState } from "@/lib/share";

export const metadata: Metadata = {
  title: "What can my computer comfortably run?",
  description: "Tell us your hardware, what you want to do and which tool you use — get local AI models that will actually be comfortable for that workload.",
  alternates: { canonical: "/check" },
};

export default async function CheckPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const state = decodeState(params);
  const startWithResults = !!state.hardwareId && typeof params.uc === "string";
  return <CheckFlow key={startWithResults ? "r" : "w"} initial={state} startWithResults={startWithResults} />;
}
