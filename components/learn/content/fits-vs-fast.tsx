import { MemoryFill } from "@/components/explainers/memory-fill";
import { COMFORT_DESCRIPTION } from "@/lib/schemas/results";
import { ComfortBadge } from "@/components/advisor/comfort";
import { SpillFigure } from "../figures";
import { Analogy, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

const LEVELS = ["excellent", "comfortable", "acceptable", "borderline", "technically-runs"] as const;

export default function Lesson() {
  return (
    <>
      <Step n={1} id="fits-is-not-fast" title="“It fits” is the minimum, not the goal">
        <p>
          Most calculators only ask one question: does the model fit in memory? But your operating system, browser and other apps need memory too. A model that
          leaves no room for them makes the whole computer stutter.
        </p>
        <MemoryFill />
        <Analogy>
          <p>A suitcase you can only close by sitting on it technically “fits”. But you can’t get anything else in, and good luck finding your toothbrush.</p>
        </Analogy>
      </Step>

      <Step n={2} title="Fitting in the wrong kind of memory">
        <p>
          On a PC with a graphics card there’s a second trap. If the model is slightly too big for the card’s fast VRAM, the extra layers spill into slow system
          RAM. It still runs, but every word now waits for the slow part.
        </p>
        <SpillFigure />
      </Step>

      <Step n={3} title="So we rate how it will feel, not just whether it fits">
        <p>Every result on this site uses the same five-step scale:</p>
        <ul className="space-y-2">
          {LEVELS.map((l) => (
            <li key={l} className="flex flex-col gap-1.5 rounded-2xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:gap-3">
              <ComfortBadge level={l} size="sm" className="w-fit" />
              <span className="text-sm text-muted-foreground">{COMFORT_DESCRIPTION[l]}</span>
            </li>
          ))}
        </ul>
      </Step>

      <KeyIdea>Leave a few GB free for your computer, and keep the model inside fast memory. That’s the difference between “runs” and “runs well”.</KeyIdea>

      <QuickCheck
        question="A 16 GB laptop runs a 15 GB model. What’s most likely?"
        options={[
          { text: "Perfect: it fits with 1 GB to spare.", why: "The operating system and apps need several GB too, so the computer has to start swapping to disk." },
          { text: "Everything gets sluggish, including the AI.", correct: true, why: "With no room left for the system and apps, the computer swaps to disk and slows down badly." },
          { text: "The laptop shuts down.", why: "It won’t crash outright; it just becomes painfully slow as memory runs out." },
        ]}
      />
    </>
  );
}
