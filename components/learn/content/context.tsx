import { ContextFill, TokenChips } from "@/components/explainers/lesson-visuals";
import { KvCacheChart } from "../kv-cache-chart";
import { Analogy, FactGrid, GoDeeper, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

export default function Lesson() {
  return (
    <>
      <Step n={1} id="context" title="Models read and write in tokens">
        <p>
          Models don’t see letters or whole words. They see <strong>tokens</strong>: chunks of text about ¾ of an English word long (or about 4 characters of
          code).
        </p>
        <TokenChips />
      </Step>

      <Step n={2} title="The context window: how much it can keep in mind">
        <p>
          The <strong>context window</strong> is how many tokens the model can consider at once: your messages, its replies, any files you paste, all of it.
        </p>
        <ContextFill />
        <FactGrid
          items={[
            { label: "8K tokens", value: "≈ an article", note: "casual chat" },
            { label: "32K tokens", value: "≈ a few dozen files", note: "coding help" },
            { label: "128K tokens", value: "≈ a short book", note: "long documents" },
          ]}
        />
        <Analogy>
          <p>Context is the model’s desk. A bigger desk holds more papers at once, but it takes up more room in the office (memory).</p>
        </Analogy>
      </Step>

      <Step n={3} id="kv-cache" title="Context costs memory: the KV cache">
        <p>
          To avoid re-reading the whole conversation for every word, the model keeps notes on each token it has seen. These notes are called the{" "}
          <strong>KV cache</strong>, and they live in memory right next to the model.
        </p>
        <p>The longer the context, the bigger the cache. At long contexts it can grow to several gigabytes, on top of the model itself.</p>
        <KvCacheChart />
        <GoDeeper>
          <p>
            Newer “hybrid” models use sliding-window or linear attention in some layers, so their cache grows much more slowly. Runtimes like llama.cpp can also
            store the cache at 8-bit (“Q8 KV”), roughly halving it with minor quality impact.
          </p>
        </GoDeeper>
      </Step>

      <Step n={4} title="Don’t max it out">
        <p>
          A model might advertise a 256K context. That’s the most it <em>can</em> handle, not what you should run. Every token of context costs memory and slows
          down reading your prompt. Pick what your task needs: 8–16K for chat, 32–64K for coding agents.
        </p>
      </Step>

      <KeyIdea>Context is the model’s short-term memory. Longer context needs more memory, so use as much as your task needs and no more.</KeyIdea>

      <QuickCheck
        question="Your chat app gets slow and runs out of memory during a very long conversation. Why?"
        options={[
          { text: "The model gets tired.", why: "Models don’t tire, but their KV cache grows with every message in the conversation." },
          { text: "The growing conversation fills the KV cache.", correct: true, why: "Every token in the chat adds to the KV cache, which uses memory and slows things down." },
          { text: "The internet connection dropped.", why: "Local models don’t use the internet. The growing context is what uses up memory." },
        ]}
      />
    </>
  );
}
