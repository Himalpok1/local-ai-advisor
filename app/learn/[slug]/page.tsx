import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { LessonFinish, LessonOutline, ReadingProgress } from "@/components/learn/course-ui";
import { LESSONS, getLesson, lessonIndex } from "@/components/learn/lessons";
import { LESSON_CONTENT } from "@/components/learn/lesson-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) return {};
  return { title: `${lesson.title} · Learn`, description: lesson.summary };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  const Content = LESSON_CONTENT[slug];
  if (!lesson || !Content) notFound();
  const i = lessonIndex(slug);
  const prev = LESSONS[i - 1];
  const next = LESSONS[i + 1];

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <LessonOutline current={slug} />
          </div>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <header className="animate-fade-up">
            <Link href="/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground lg:hidden">
              <ArrowLeft className="size-4" /> All lessons
            </Link>
            {/* Course position: one dot per lesson. */}
            <div className="mt-2 flex items-center gap-3 lg:mt-0">
              <span className="text-sm font-semibold text-primary">
                Lesson {i + 1} of {LESSONS.length}
              </span>
              <span className="flex flex-1 gap-1" aria-hidden>
                {LESSONS.map((l, j) => (
                  <span key={l.slug} className={`h-1.5 flex-1 rounded-full ${j <= i ? "bg-primary" : "bg-border"}`} />
                ))}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{lesson.title}</h1>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">{lesson.summary}</p>
            <div className="mt-5 rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="size-3.5" /> {lesson.minutes} min · you’ll learn
              </p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
                {lesson.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm font-medium">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <div className="mt-10 space-y-8">
            <Content />
          </div>

          <div className="mt-12">
            <LessonFinish lesson={lesson} next={next} prev={prev} />
          </div>
        </article>
      </div>
    </>
  );
}
