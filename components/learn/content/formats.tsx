import { Apple, Cpu, FileText, Monitor } from "lucide-react";
import { Code } from "../prose";
import { KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

const GPUS = [
  { icon: Monitor, title: "NVIDIA → CUDA", id: "cuda", text: "The most mature option. Every runtime supports it first, so things generally just work." },
  { icon: Cpu, title: "AMD → ROCm or Vulkan", id: "rocm", text: "ROCm works well on supported cards, especially on Linux. Vulkan runs on almost any GPU and is easy to set up." },
  { icon: Apple, title: "Mac → Metal", id: "metal", text: "Built into macOS. llama.cpp and MLX use it automatically; you don’t install anything." },
  { icon: Monitor, title: "Intel → Vulkan / SYCL", id: "intel", text: "Intel Arc and newer laptop chips work through Vulkan or Intel’s own backends." },
];

export default function Lesson() {
  return (
    <>
      <Step n={1} id="gguf" title="GGUF: the format that runs everywhere">
        <div className="flex gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <FileText className="mt-0.5 size-6 shrink-0 text-primary" />
          <div>
            <p>
              <strong>GGUF</strong> is a single-file model format used by llama.cpp, and therefore by Ollama, LM Studio, Jan and many others. It runs on Mac,
              Windows and Linux, on a CPU or any GPU.
            </p>
            <p className="mt-2 text-muted-foreground">
              Quantization names like <Code>Q4_K_M</Code> and <Code>Q8_0</Code> come from GGUF. <strong className="text-foreground">If in doubt, pick GGUF.</strong>
            </p>
          </div>
        </div>
      </Step>

      <Step n={2} id="mlx" title="MLX: Apple’s fast lane for Macs">
        <p>
          <strong>MLX</strong> is Apple’s own machine-learning framework and format, built only for Apple Silicon. LM Studio can use it, and so can{" "}
          <Code>mlx-lm</Code> on the command line.
        </p>
        <p>
          On a Mac it’s often 10–30% faster than GGUF, especially for reading prompts and for MoE models. MLX models are labelled “4-bit”, “8-bit” and so on.
        </p>
      </Step>

      <Step n={3} title="GPU software: the driver that does the heavy lifting">
        <p>Runtimes talk to your graphics chip through a low-level platform. Which one depends on your hardware:</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {GPUS.map((g) => (
            <li key={g.id} className="flex gap-3 rounded-2xl border border-border/70 bg-card p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <g.icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{g.title}</span>
                <span className="block text-sm text-muted-foreground">{g.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p>Good news: apps like LM Studio and Ollama pick the right one for you.</p>
      </Step>

      <KeyIdea>On a Mac, try MLX for extra speed. Everywhere else (and when unsure), use GGUF. Your app picks the GPU software for you.</KeyIdea>

      <QuickCheck
        question="You have a Windows PC with an NVIDIA card. Which combo is the safe default?"
        options={[
          { text: "MLX format with Metal", why: "MLX and Metal are Apple-only, so they won’t run on Windows." },
          { text: "GGUF format with CUDA", correct: true, why: "GGUF runs everywhere and CUDA is NVIDIA’s mature GPU platform, supported first by every runtime." },
          { text: "Any format, it doesn’t matter", why: "Format matters: MLX only runs on Macs. GGUF is the universal choice." },
        ]}
      />
    </>
  );
}
