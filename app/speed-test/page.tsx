import type { Metadata } from "next";
import { SpeedTest } from "@/components/speed-test/speed-test";

export const metadata: Metadata = {
  title: "Browser speed test for local AI",
  description:
    "Measure your GPU's real memory bandwidth in the browser in about five seconds, with no download, and see the generation-speed ceiling it sets for popular open models.",
  alternates: { canonical: "/speed-test" },
};

export default function SpeedTestPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Browser speed test</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          How fast a local model writes is limited mostly by <strong className="text-foreground">memory bandwidth</strong>: how quickly your GPU can read
          the model&apos;s weights. This test measures it directly with WebGPU, right here in your browser.
        </p>
      </header>
      <SpeedTest />
      <p className="text-xs text-muted-foreground">
        The test streams a large random buffer through a WebGPU compute shader and times it. Browsers add overhead, so results are usually below
        what native runtimes reach on the same machine. Prompt processing speed (how fast long inputs are read) depends on compute instead and
        isn&apos;t measured here.
      </p>
    </div>
  );
}
