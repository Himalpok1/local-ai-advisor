import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/art/sticker";
import { BookOpen, Sparkles } from "lucide-react";
import { CoursePath, CourseProgress, LegacyAnchorRedirect } from "@/components/learn/course-ui";
import { GLOSSARY, LESSONS, TOTAL_MINUTES } from "@/components/learn/lessons";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Learn local AI, step by step",
  description: `${LESSONS.length} short, visual lessons on running AI models on your own computer: memory, model size, quantization, context, speed, and your first model.`,
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  return (
    <div className="relative">
      <LegacyAnchorRedirect />
      <div className="relative mx-auto max-w-5xl px-4 pb-6 pt-8 sm:px-6 sm:pt-14">
        <header className="max-w-2xl animate-fade-up">
          <Eyebrow color="green"><BookOpen className="size-3.5" /> Free course · no sign-up</Eyebrow>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">Learn local AI, one step at a time</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            {LESSONS.length} bite-sized lessons with animations and a quick question at the end of each. No jargon you haven’t been introduced to. About{" "}
            {TOTAL_MINUTES} minutes from zero to running your own model.
          </p>
          <div className="mt-6">
            <CourseProgress />
          </div>
        </header>

        <div className="mt-12 sm:mt-16">
          <CoursePath />
        </div>

        <Reveal className="mt-14 rounded-2xl border-2 border-ink bg-card p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="size-5 text-link" /> Jargon buster
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Saw a word you don’t know? Tap it to jump to the lesson that explains it.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {GLOSSARY.map((g) => (
              <li key={g.term}>
                <Link
                  href={`/learn/${g.slug}${g.anchor ? `#${g.anchor}` : ""}`}
                  className="inline-flex min-h-10 items-center rounded-full border-2 border-ink bg-background px-3.5 text-sm font-medium transition hover:border-ink hover:bg-primary/15 hover:text-link active:scale-95"
                >
                  {g.term}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
