import { AnimatedBars, MoeAnimated } from "@/components/explainers/lesson-visuals";
import { Code } from "../prose";
import { Analogy, FactGrid, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

export default function Lesson() {
  return (
    <>
      <Step n={1} id="parameters" title="“7B” means 7 billion parameters">
        <p>
          A model is made of <strong>parameters</strong>: billions of numbers it learned during training. The “B” in a name like <Code>Qwen3.5 9B</Code> is
          how many billions it has.
        </p>
        <p>More parameters usually means a smarter model, and always means a bigger, slower one.</p>
        <Analogy>
          <p>Parameters are like the knowledge in a library. A bigger library knows more, but it takes up more space and longer to search.</p>
        </Analogy>
      </Step>

      <Step n={2} title="From parameters to gigabytes">
        <p>
          At full precision every parameter takes 2 bytes. So a quick rule: <strong>full-size model ≈ parameters × 2 GB</strong>. Shrunk to the usual 4-bit
          version (next lesson), it’s roughly <strong>parameters × 0.6 GB</strong>.
        </p>
        <AnimatedBars
          title="Typical download size at 4-bit (Q4)"
          bars={[
            { label: "4B model", value: 2.7, display: "≈3 GB", note: "phones, any laptop" },
            { label: "9B model", value: 5.7, display: "≈6 GB", note: "8–16 GB computers" },
            { label: "27B model", value: 17, display: "≈17 GB", note: "32 GB+" },
            { label: "70B model", value: 42, display: "≈42 GB", note: "64 GB+" },
          ]}
        />
        <FactGrid
          items={[
            { label: "16 GB computer", value: "up to ~9B", note: "comfortably" },
            { label: "32–48 GB", value: "~27–32B", note: "the sweet spot" },
            { label: "64 GB+", value: "70B and up", note: "big models" },
          ]}
        />
      </Step>

      <Step n={3} id="moe" title="Mixture of Experts: big, but fast">
        <p>
          Some models are split into many smaller “experts”. For each word, a router picks just a few of them to do the work. These are called{" "}
          <strong>MoE</strong> models.
        </p>
        <MoeAnimated />
      </Step>

      <Step n={4} id="active-parameters" title="Reading names like “35B-A3B”">
        <p>
          MoE names show two numbers: <Code>35B-A3B</Code> means 35 billion parameters in total, about 3 billion <strong>active</strong> for each word.
        </p>
        <ul className="space-y-2">
          <li className="rounded-2xl bg-muted px-4 py-3">
            <strong>Memory</strong> follows the total (35B): it needs as much room as any 35B model.
          </li>
          <li className="rounded-2xl bg-primary/10 px-4 py-3">
            <strong>Speed</strong> follows the active part (3B): it writes almost as fast as a tiny 3B model.
          </li>
        </ul>
        <p>That makes MoE models a great match for Macs and other unified-memory machines: lots of room, moderate speed.</p>
      </Step>

      <KeyIdea>Size (B) tells you how much memory a model needs. For MoE models, the active part (A…B) tells you how fast it will be.</KeyIdea>

      <QuickCheck
        question="Which will usually write faster on the same computer?"
        options={[
          { text: "A 27B normal (dense) model", why: "A dense model reads all 27B parameters for every word. The MoE only reads about 3B." },
          { text: "A 35B-A3B MoE model", correct: true, why: "Only ~3B parameters are read per word, so it is much faster, even though it needs more memory." },
          { text: "They’re the same speed", why: "Speed depends on how many parameters are read per word, and that is very different here." },
        ]}
      />
    </>
  );
}
