"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Clock, PartyPopper, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { LESSONS, PARTS, TOTAL_MINUTES, lessonForAnchor, lessonIndex, type Lesson } from "./lessons";
import { useLearnProgress } from "./progress";

/** Thin bar under the header that fills as you read the lesson. */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const x = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed inset-x-0 top-14 z-40 h-1 origin-left bg-primary sm:top-16"
      style={{ scaleX: reduce ? scrollYProgress : x }}
      aria-hidden
    />
  );
}

/** Progress ring + "start/continue" button for the course hub. */
export function CourseProgress() {
  const { done, reset } = useLearnProgress();
  const count = LESSONS.filter((l) => done.includes(l.slug)).length;
  const next = LESSONS.find((l) => !done.includes(l.slug));
  const pct = count / LESSONS.length;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative size-16 shrink-0">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
          <motion.circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className="stroke-primary"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">
          {count}/{LESSONS.length}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {next ? (
          <>
            <Link
              href={`/learn/${next.slug}`}
              className="inline-flex min-h-12 items-center gap-2 bg-primary px-5 text-base text-primary-foreground rounded-full border-2 border-ink font-bold shadow-brutal press"
            >
              {count === 0 ? "Start lesson 1" : `Continue: lesson ${LESSONS.indexOf(next) + 1}`} <ArrowRight className="size-4" />
            </Link>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {count === 0 ? `${LESSONS.length} short lessons · about ${TOTAL_MINUTES} minutes in total` : next.title}
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 font-semibold">
              <PartyPopper className="size-5 text-link" /> You finished the course!
            </p>
            <button type="button" onClick={reset} className="mt-1 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <RotateCcw className="size-3.5" /> Reset progress
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** The course path: lessons grouped by part, with done / up-next states. */
export function CoursePath() {
  const { done } = useLearnProgress();
  const reduce = useReducedMotion();
  const next = LESSONS.find((l) => !done.includes(l.slug));
  return (
    <div className="space-y-10">
      {PARTS.map((part, pi) => (
        <section key={part.id} aria-labelledby={`part-${part.id}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-link">Part {pi + 1}</p>
          <h2 id={`part-${part.id}`} className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            {part.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{part.description}</p>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {LESSONS.filter((l) => l.part === part.id).map((l, i) => {
              const n = LESSONS.indexOf(l) + 1;
              const isDone = done.includes(l.slug);
              const isNext = next?.slug === l.slug;
              return (
                <motion.li
                  key={l.slug}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-5% 0px" }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={`/learn/${l.slug}`}
                    className={cn(
                      "group flex h-full gap-4 rounded-2xl border-2 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brutal-lg active:scale-[0.99] sm:p-5",
                      isNext ? "border-ink shadow-brutal ring-1 ring-ink" : "border-ink hover:border-ink",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-2xl text-base font-bold transition-colors",
                        isDone ? "bg-comfortable text-white" : isNext ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/25 group-hover:text-link",
                      )}
                    >
                      {isDone ? <Check className="size-5" strokeWidth={3} /> : n}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold leading-snug">{l.title}</span>
                        {isNext && <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[11px] font-semibold text-link">{done.length ? "Up next" : "Start here"}</span>}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">{l.summary}</span>
                      <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" /> {l.minutes} min
                      </span>
                    </span>
                    <ArrowRight className="mt-1 size-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-link" />
                  </Link>
                </motion.li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Sidebar outline on lesson pages (desktop). */
export function LessonOutline({ current }: { current: string }) {
  const { done } = useLearnProgress();
  return (
    <nav aria-label="Course outline" className="text-sm">
      <Link href="/learn" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All lessons
      </Link>
      <ol className="space-y-0.5">
        {LESSONS.map((l, i) => {
          const isCurrent = l.slug === current;
          const isDone = done.includes(l.slug);
          return (
            <li key={l.slug}>
              <Link
                href={`/learn/${l.slug}`}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
                  isCurrent ? "bg-primary/25 font-semibold text-link" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    isDone ? "bg-comfortable text-white" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {isDone ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="leading-snug">{l.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** End-of-lesson card: marks the lesson done and points to the next one. */
export function LessonFinish({ lesson, next, prev }: { lesson: Lesson; next?: Lesson; prev?: Lesson }) {
  const { done, markDone } = useLearnProgress();
  const router = useRouter();
  const isDone = done.includes(lesson.slug);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-ink bg-card p-5 shadow-brutal-sm sm:p-6">
        {next ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Up next · lesson {lessonIndex(next.slug) + 1}</p>
            <p className="mt-1 text-xl font-bold tracking-tight">{next.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{next.summary}</p>
            <button
              type="button"
              onClick={() => {
                markDone(lesson.slug);
                router.push(`/learn/${next.slug}`);
              }}
              className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 bg-primary px-5 text-base text-primary-foreground sm:w-auto rounded-full border-2 border-ink font-bold shadow-brutal press"
            >
              <Check className="size-5" /> Done, next lesson <ArrowRight className="size-4" />
            </button>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <PartyPopper className="size-6 text-link" /> That’s the whole course!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">You know more about local AI than most people. Time to put it to work.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/check"
                onClick={() => markDone(lesson.slug)}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-5 text-primary-foreground rounded-full border-2 border-ink font-bold shadow-brutal press"
              >
                Check my computer <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={() => markDone(lesson.slug)}
                disabled={isDone}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-ink px-5 font-semibold transition hover:bg-muted disabled:cursor-default disabled:opacity-60"
              >
                <Check className="size-4" /> {isDone ? "Course complete" : "Mark as done"}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/learn" className="inline-flex min-h-11 items-center font-medium text-muted-foreground hover:text-foreground">
          All lessons
        </Link>
      </div>
    </div>
  );
}

/** Sends old single-page links like /learn#kv-cache to the lesson that now covers them. */
export function LegacyAnchorRedirect() {
  const router = useRouter();
  useEffect(() => {
    const anchor = window.location.hash.slice(1);
    if (!anchor) return;
    const lesson = lessonForAnchor(anchor);
    if (lesson) router.replace(`/learn/${lesson.slug}#${anchor}`);
  }, [router]);
  return null;
}
