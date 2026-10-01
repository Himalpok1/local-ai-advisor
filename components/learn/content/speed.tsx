import { SpeedFeel } from "@/components/explainers/speed-feel";
import { TtftFigure } from "../figures";
import { Analogy, GoDeeper, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

export default function Lesson() {
  return (
    <>
      <Step n={1} id="tokens-per-second" title="Tokens per second: how fast it writes">
        <p>
          Speed is measured in <strong>tokens per second</strong> (tok/s): how many chunks of text the model writes each second once it gets going. Tap the
          speeds below to feel the difference:
        </p>
        <SpeedFeel />
        <p>
          As a rough guide: under 5 tok/s feels painful, 10–20 is about reading speed, 30+ feels fast. Coding agents want 40+ because they produce lots of text
          that nobody reads.
        </p>
      </Step>

      <Step n={2} title="What decides the speed">
        <p>
          Remember lesson 2: for every token the computer re-reads the model. So a simple estimate is{" "}
          <strong>memory bandwidth ÷ model size</strong>.
        </p>
        <p>
          A 17 GB model on a Mac with 273 GB/s tops out around 16 tok/s (nearer 12 in practice). The same model on a 1,000 GB/s graphics card: 40–50 tok/s.
        </p>
      </Step>

      <Step n={3} id="prompt-processing" title="Reading speed: before it can answer">
        <p>
          Before writing anything, the model has to read your whole prompt. This is called <strong>prefill</strong> or prompt processing, and it’s measured
          separately.
        </p>
        <Analogy>
          <p>
            Writing speed is how fast someone talks. Reading speed is how long they take to read the letter you handed them before they can reply. Hand them a
            50-page letter and you’ll wait.
          </p>
        </Analogy>
        <p>
          Pasting a 20,000-token file at 200 tok/s of reading speed means 100 seconds of silence. At 2,000 tok/s it’s 10 seconds. Graphics cards are very good
          at this; laptops much less so.
        </p>
      </Step>

      <Step n={4} id="time-to-first-token" title="Time to first token">
        <p>
          <strong>Time to first token</strong> (TTFT) is how long you stare at a blank reply after pressing Enter. It’s the loading time (first message only)
          plus the reading time.
        </p>
        <TtftFigure />
        <GoDeeper>
          <p>
            Runtimes reuse the unchanged start of a conversation (a “prompt cache”), so only new text has to be read again. That makes follow-up messages much
            faster than the first one.
          </p>
        </GoDeeper>
      </Step>

      <KeyIdea>Two speeds matter: how fast it reads your prompt, and how fast it writes the answer. Chat cares about the second; big prompts care about the first.</KeyIdea>

      <QuickCheck
        question="You paste a long document and wait 90 seconds before the first word appears. Which speed is the bottleneck?"
        options={[
          { text: "Writing speed (tok/s)", why: "Writing hasn’t started yet. The wait before the first word is all about reading the prompt." },
          { text: "Reading speed (prefill)", correct: true, why: "The model has to read the whole document before it can answer. That’s prefill." },
          { text: "Internet speed", why: "Nothing is downloaded. It’s your computer reading the long prompt." },
        ]}
      />
    </>
  );
}
