import { AnimatedBars } from "@/components/explainers/lesson-visuals";
import { MemoryPoolsFigure } from "../figures";
import { Code } from "../prose";
import { Analogy, GoDeeper, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

export default function Lesson() {
  return (
    <>
      <Step n={1} title="A model has to sit in memory while it runs">
        <p>
          A model is a big file: often 5 to 40 GB. To use it, your computer loads the whole thing into <strong>memory</strong>, and to write every single word
          it has to read through (almost) all of it again.
        </p>
        <Analogy>
          <p>
            It’s like a cook who re-reads the entire recipe book before adding each ingredient. The book has to be on the counter (in memory), and how fast the
            cook can flip pages decides how fast dinner arrives.
          </p>
        </Analogy>
      </Step>

      <Step n={2} id="ram" title="RAM: your computer’s main memory">
        <p>
          <strong>RAM</strong> is the working memory every computer has, shared by the operating system and all your apps. It’s plentiful and cheap, but
          comparatively slow to read: a typical desktop manages 60–100 GB per second.
        </p>
        <p>That “GB per second” number is called <strong>memory bandwidth</strong>, and for AI it matters more than how fast your processor is.</p>
      </Step>

      <Step n={3} id="vram" title="VRAM: the graphics card’s own memory">
        <p>
          A graphics card (GPU) has its own memory soldered onto it, called <strong>VRAM</strong>. It is small and expensive, but very fast: often 10× faster
          than RAM.
        </p>
        <AnimatedBars
          title="How fast each kind of memory can be read"
          bars={[
            { label: "Desktop RAM (DDR5)", value: 80, display: "≈80 GB/s", className: "bg-sticker-teal" },
            { label: "MacBook Pro M4 Pro", value: 273, display: "≈273 GB/s", className: "bg-sticker-blue" },
            { label: "Mac Studio M4 Max", value: 546, display: "≈546 GB/s", className: "bg-sticker-orange" },
            { label: "RTX 4090 graphics card", value: 1008, display: "≈1,008 GB/s", className: "bg-primary" },
          ]}
          caption="Faster memory means the model can be “re-read” more times per second, which means more words per second."
        />
        <p>
          If the model fits entirely in VRAM, it runs fast. If it’s too big, the extra part spills into slower RAM and everything slows down sharply. An RTX
          4090 has 24 GB of VRAM: a 20 GB model flies, a 30 GB model crawls, even if the PC has 64 GB of RAM.
        </p>
      </Step>

      <Step n={4} id="unified-memory" title="Unified memory: one big shared pool">
        <p>
          Apple Silicon Macs (and a few PCs like AMD Ryzen AI Max and NVIDIA DGX Spark) use <strong>unified memory</strong>: one pool shared by the
          processor and the graphics chip. There’s no small VRAM limit to overflow, so a 64 GB Mac can run models that would never fit on a 24 GB graphics
          card.
        </p>
        <MemoryPoolsFigure />
        <GoDeeper title="The fine print on Macs">
          <p>
            The graphics chip isn’t allowed to use all of unified memory. By default macOS lets it use about two-thirds on smaller Macs and about three-quarters on
            bigger ones. So a 48 GB MacBook Pro gives the GPU roughly 36 GB.
          </p>
          <p>
            Advanced users can raise the limit with <Code>sudo sysctl iogpu.wired_limit_mb=…</Code>, at the cost of leaving less memory for macOS and your
            apps.
          </p>
        </GoDeeper>
      </Step>

      <KeyIdea>The model must fit in fast memory, and the faster that memory, the faster the AI writes. Bandwidth beats raw power.</KeyIdea>

      <QuickCheck
        question="A gaming PC has a 12 GB graphics card and 64 GB of RAM. You load a 20 GB model. What happens?"
        options={[
          { text: "It runs fast, because 64 GB is plenty.", why: "The RAM is big but slow. The part of the model that doesn’t fit in the 12 GB of fast VRAM makes every word wait." },
          { text: "It runs, but much slower than you’d hope.", correct: true, why: "About 8 GB spills from fast VRAM into slow RAM, and the slow part sets the pace for every word." },
          { text: "It refuses to start.", why: "Most runtimes will happily split the model between VRAM and RAM. It starts, just slowly." },
        ]}
      />
    </>
  );
}
