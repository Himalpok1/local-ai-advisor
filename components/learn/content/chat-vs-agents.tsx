import { Bot, MessageCircle } from "lucide-react";
import { AgentStepsFigure } from "../figures";
import { WorkloadCompare } from "../workload-compare";
import { Analogy, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

export default function Lesson() {
  return (
    <>
      <Step n={1} id="chat-is-not-agent" title="Chat: one question, one answer">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="flex items-center gap-2 font-semibold">
              <MessageCircle className="size-5 text-primary" /> Chat
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">You ask, it answers, you read. A short prompt, one wait, then you take your time.</p>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
            <p className="flex items-center gap-2 font-semibold">
              <Bot className="size-5 text-primary" /> Coding agent
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Tools like OpenCode, Cline or Claude Code-style agents call the model <strong>dozens of times in a row</strong>, each time with thousands of tokens
              of files and instructions.
            </p>
          </div>
        </div>
      </Step>

      <Step n={2} title="Every step means reading a big prompt again">
        <p>
          Each agent step sends a big prompt (files, tool descriptions, history) that the model must <strong>read</strong> before replying. That’s prefill from
          the last lesson, and on laptops it’s often the slow part.
        </p>
        <AgentStepsFigure />
        <Analogy>
          <p>A 60-second wait is fine once. Thirty of them in a row is half an hour of watching a progress bar.</p>
        </Analogy>
      </Step>

      <Step n={3} title="Same computer, same model, different verdict">
        <p>Here’s the real engine rating one MacBook Pro and one model for three different jobs. Switch the model to see how an MoE changes things:</p>
        <WorkloadCompare />
      </Step>

      <Step n={4} title="Smaller can finish first">
        <p>
          For agents, a smaller or MoE model with fast steps often <strong>finishes the whole task sooner</strong> than a bigger, smarter model that makes you wait at
          every step. That’s why our recommendations change with what you want to do.
        </p>
      </Step>

      <KeyIdea>A model that’s great for chat can be painful as a coding agent. Agents need fast reading and fast writing, because they wait at every step.</KeyIdea>

      <QuickCheck
        question="For a coding agent on a laptop, which usually matters most?"
        options={[
          { text: "Using the biggest model that fits", why: "A big model that’s slow at every step can make a task take far longer overall." },
          { text: "Fast steps: quick reading and writing", correct: true, why: "Agents make dozens of calls, so the time per step multiplies. Fast steps win." },
          { text: "The longest possible context", why: "Agents do need decent context (32–64K), but more context also slows each step down." },
        ]}
      />
    </>
  );
}
