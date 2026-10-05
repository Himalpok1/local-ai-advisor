import type { Metadata } from "next";
import Link from "next/link";
import { ReportForm } from "@/components/community/report-form";
import { decodeState } from "@/lib/share";

export const metadata: Metadata = {
  title: "Report your local AI speed",
  description: "Share the tokens per second you measured for a local model on your computer. Community reports calibrate the speed estimates for everyone with the same chip.",
  alternates: { canonical: "/community/submit" },
};

export default async function SubmitReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = decodeState(await searchParams);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-medium text-link">
          <Link href="/community" className="hover:underline">
            Community speeds
          </Link>
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Report your speed</h1>
        <p className="mt-3 text-muted-foreground">
          The fastest way to get comparable numbers is llama.cpp&apos;s benchmark: <code className="rounded bg-muted px-1.5 py-0.5 text-sm">llama-bench -m model.gguf</code>{" "}
          prints prompt processing (pp512) and generation (tg128). With Ollama, run <code className="rounded bg-muted px-1.5 py-0.5 text-sm">ollama run model --verbose</code> and copy the eval rates.
        </p>
      </header>
      <ReportForm defaults={{ hardwareId: s.hardwareId, modelId: s.modelId, quant: s.quant, runtimeId: s.runtimeId, os: s.os }} />
    </div>
  );
}
