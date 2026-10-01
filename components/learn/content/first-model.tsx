import Link from "next/link";
import { ArrowRight, Download, MessageSquareText, MousePointerClick, Terminal } from "lucide-react";
import { runCommands } from "@/lib/downloads";
import { RunCommands } from "@/components/advisor/run-commands";
import { LinkButton } from "@/components/ui/button";
import { Analogy, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

const APPS = [
  {
    icon: MousePointerClick,
    name: "LM Studio",
    tag: "Easiest · recommended",
    text: "A normal desktop app for Mac, Windows and Linux. Search for a model, click download, start chatting. No terminal needed.",
    href: "https://lmstudio.ai",
  },
  {
    icon: Terminal,
    name: "Ollama",
    tag: "Great for tinkerers",
    text: "Runs quietly in the background and is controlled with short terminal commands. Many apps and coding tools connect to it.",
    href: "https://ollama.com",
  },
];

export default function Lesson() {
  const commands = runCommands({ modelId: "qwen3.5-9b", quant: "q4", contextTokens: 8192, apple: true });
  return (
    <>
      <Step n={1} title="Find out what your computer can handle">
        <p>
          Before downloading anything, check which models will run well on your machine. It takes about a minute and saves you downloading a 20 GB file that
          crawls.
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/check" size="lg">
            Check my computer <ArrowRight className="size-4" />
          </LinkButton>
        </div>
        <p className="text-base text-muted-foreground">
          Not sure? A 9B model like <strong className="text-foreground">Qwen3.5 9B</strong> (about 6 GB) is a great first try on most computers with 16 GB of
          memory or more. On 8 GB, start with a 4B model.
        </p>
      </Step>

      <Step n={2} title="Install an app">
        <ul className="grid gap-3 sm:grid-cols-2">
          {APPS.map((a) => (
            <li key={a.name} className="flex flex-col rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <a.icon className="size-5" />
                </span>
                <div>
                  <p className="font-bold">{a.name}</p>
                  <p className="text-xs font-semibold text-primary">{a.tag}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{a.text}</p>
              <a href={a.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <Download className="size-4" /> Get {a.name}
              </a>
            </li>
          ))}
        </ul>
        <Analogy title="Which one?">
          <p>
            If you’ve never used a terminal, pick <strong>LM Studio</strong>. You can always add Ollama later; they can live side by side.
          </p>
        </Analogy>
      </Step>

      <Step n={3} title="Download your first model">
        <p>
          In <strong>LM Studio</strong>, open the search tab, type <em>Qwen3.5 9B</em>, and pick the version marked <strong>Q4_K_M</strong> (or “4-bit” MLX on a
          Mac). It even warns you if a model is too big for your computer.
        </p>
        <p>Prefer the terminal? Copy one of these:</p>
        <RunCommands commands={commands} />
      </Step>

      <Step n={4} title="Say hello, and check the speed">
        <p>
          Ask it something. Most apps show the speed in tokens per second under each answer. Compare it with what you learned in{" "}
          <Link href="/learn/speed" className="font-medium text-primary hover:underline">
            the speed lesson
          </Link>
          : 10+ tok/s is fine for chat, 30+ feels fast.
        </p>
        <div className="flex gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <MessageSquareText className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Too slow?</strong> Try a smaller model or a lower quant, close heavy apps, or shorten the context in the app’s
            settings. <strong className="text-foreground">Fast and comfy?</strong> Try the next size up.
          </p>
        </div>
      </Step>

      <KeyIdea>Check your computer, install LM Studio, download a Q4 model that fits comfortably, and start chatting. You’re running local AI!</KeyIdea>

      <QuickCheck
        question="You have a laptop with 16 GB of memory and want a first model. Which is the sensible pick?"
        options={[
          { text: "A 70B model, for the best answers", why: "A 70B model needs around 42 GB even at Q4, far more than 16 GB." },
          { text: "A 9B model at Q4 (≈6 GB)", correct: true, why: "It fits with plenty of room to spare for your system and apps, and runs at a comfortable speed." },
          { text: "A 9B model at full FP16 (≈18 GB)", why: "Full precision wastes memory and wouldn’t even fit. Q4 is nearly as good at a third of the size." },
        ]}
      />
    </>
  );
}
