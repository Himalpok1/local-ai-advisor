import { AnimatedBars } from "@/components/explainers/lesson-visuals";
import { QuantCalculator } from "../quant-calculator";
import { Code } from "../prose";
import { Analogy, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

export default function Lesson() {
  return (
    <>
      <Step n={1} title="Storing each number with fewer bits">
        <p>
          <strong>Quantization</strong> shrinks a model by storing each of its billions of numbers less precisely. Instead of 16 bits per number, you might use
          8 or 4.
        </p>
        <Analogy>
          <p>
            It’s like saving a photo as a JPEG. The file gets much smaller, and unless you zoom right in you barely notice the difference. Squeeze too hard,
            though, and it starts to look blocky.
          </p>
        </Analogy>
      </Step>

      <Step n={2} title="The labels you’ll see">
        <p>
          When you download a model you’ll pick a version like <Code>Q4_K_M</Code> or “4-bit”. The number is roughly the bits per parameter:
        </p>
        <AnimatedBars
          title="Size of the same 9B model"
          bars={[
            { label: "FP16 / BF16", value: 18, display: "≈18 GB", note: "full precision", className: "bg-sticker-teal" },
            { label: "Q8", value: 9.5, display: "≈9.5 GB", note: "practically no loss", className: "bg-sticker-blue" },
            { label: "Q4", value: 5.7, display: "≈5.7 GB", note: "the sweet spot", className: "bg-primary" },
            { label: "Q3", value: 4.7, display: "≈4.7 GB", note: "starts to hurt", className: "bg-primary" },
          ]}
          caption="Sizes of the real Qwen3.5 9B downloads. Q4 is about a third of full size."
        />
        <ul className="space-y-2 text-base">
          <li>
            <strong>Q8:</strong> half the size of full precision, quality basically identical.
          </li>
          <li>
            <strong>Q4:</strong> the usual choice. About 30% of full size with a small quality loss.
          </li>
          <li>
            <strong>Q3 and below:</strong> saves more memory but quality drops, especially for coding and small models.
          </li>
        </ul>
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">MXFP4</strong> is a 4-bit format some models (like gpt-oss) are released in directly, so it carries no extra
          loss.
        </p>
      </Step>

      <Step n={3} title="Try it: how big will a model be?">
        <QuantCalculator />
      </Step>

      <Step n={4} title="Smaller is also faster">
        <p>
          Remember: the computer re-reads the model for every word. A Q4 file is a quarter the size of FP16, so there are far fewer bytes to read and words come
          out faster.
        </p>
        <p>
          That’s why a <strong>bigger model at Q4 usually beats a smaller model at Q8</strong>: similar memory, but more knowledge.
        </p>
      </Step>

      <KeyIdea>Download the Q4 version unless you have memory to spare. It’s about a third of the size, faster, and almost as good.</KeyIdea>

      <QuickCheck
        question="You have room for about 18 GB. Which is usually the better choice?"
        options={[
          { text: "A 14B model at Q8 (≈15 GB)", why: "It would fit, but at the same memory a bigger model at Q4 usually gives better answers." },
          { text: "A 27B model at Q4 (≈17 GB)", correct: true, why: "A bigger model at Q4 usually beats a smaller one at Q8, for about the same memory." },
          { text: "A 9B model at full FP16 (≈18 GB)", why: "Full precision wastes memory: Q8 or Q4 of a bigger model would be smarter for the same space." },
        ]}
      />
    </>
  );
}
