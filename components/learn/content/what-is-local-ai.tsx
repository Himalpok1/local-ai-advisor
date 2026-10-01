import { CloudOff, Lock, PiggyBank, Wrench } from "lucide-react";
import { LocalAiDiagram } from "@/components/explainers/local-ai-diagram";
import { Analogy, KeyIdea, Step } from "../lesson-ui";
import { QuickCheck } from "../quick-check";

const WHY = [
  { icon: Lock, title: "Private", text: "Your chats, files and code never leave your machine." },
  { icon: PiggyBank, title: "No subscription", text: "Once it’s downloaded, it’s free to use as much as you like." },
  { icon: CloudOff, title: "Works offline", text: "On a plane, on a train, or when the internet is down." },
  { icon: Wrench, title: "Yours to tweak", text: "Pick the model, change settings, connect your own tools." },
];

export default function Lesson() {
  return (
    <>
      <Step n={1} title="ChatGPT runs in a data centre. Local AI runs on your computer.">
        <p>
          When you use ChatGPT or Claude, your message travels over the internet to a huge computer in a data centre, which writes the reply and sends it back.
        </p>
        <p>
          <strong>Local AI</strong> means downloading an AI model and running it on your own laptop or desktop instead. The same kind of chat, but
          the “thinking” happens on your machine.
        </p>
      </Step>

      <Step n={2} title="Three pieces work together">
        <p>You only ever need these three things, and the first two are free apps:</p>
        <LocalAiDiagram />
        <Analogy>
          <p>
            The <strong>model</strong> is a record, the <strong>runtime</strong> is the record player, and the <strong>app</strong> is the speaker you
            listen through. Many apps (like LM Studio) bundle the player and speaker together.
          </p>
        </Analogy>
      </Step>

      <Step n={3} title="Why people do it">
        <ul className="grid gap-2 sm:grid-cols-2">
          {WHY.map((w) => (
            <li key={w.title} className="flex gap-3 rounded-2xl border border-border/70 bg-card p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <w.icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{w.title}</span>
                <span className="block text-sm text-muted-foreground">{w.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </Step>

      <Step n={4} title="The catch: your computer sets the limits">
        <p>
          A data centre has machines worth hundreds of thousands of dollars. Your laptop doesn’t. So the big question in local AI is always:{" "}
          <strong>which models will run well on the computer I have?</strong>
        </p>
        <p>
          The answer mostly comes down to two things you’ll learn about next: <strong>how much memory</strong> your computer has, and{" "}
          <strong>how fast</strong> it can read that memory.
        </p>
      </Step>

      <KeyIdea>Local AI = an app + a runtime + a model, all on your computer. How well it runs depends on your computer’s memory.</KeyIdea>

      <QuickCheck
        question="You download a model and chat with it on a plane with Wi-Fi off. Does it still work?"
        options={[
          { text: "Yes. Everything runs on the laptop.", correct: true, why: "The model, the runtime and the app are all on your computer, so no internet is needed once it’s downloaded." },
          { text: "No. It needs the internet to think.", why: "That’s how cloud AI like ChatGPT works. A local model does all its thinking on your own machine." },
          { text: "Only for short questions.", why: "Length doesn’t matter: the whole model is on your computer, so it works offline for any question." },
        ]}
      />
    </>
  );
}
