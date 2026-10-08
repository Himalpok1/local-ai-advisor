import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/site/info-page";
import { HARDWARE, MODELS } from "@/data";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Local AI Advisor",
  description: "Who runs Local AI Advisor, why it exists, how its ratings are made, how it is funded, and how AI is used to write the blog.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About Local AI Advisor"
      intro="A free, independent guide to running AI on your own computer, built to answer one question honestly: will it actually run well on mine?"
      updated={LEGAL_UPDATED}
    >
      <h2>Why this site exists</h2>
      <p>
        Running AI models on your own computer is private, works offline and costs nothing per message. But most advice stops at “it fits in memory”, and a model that
        merely fits can be painfully slow. Local AI Advisor rates {MODELS.length} open models on {HARDWARE.length} computers for real tasks, such as chatting, coding and
        reading long documents, and tells you whether each one will feel comfortable, not just whether it loads.
      </p>

      <h2>Who runs it</h2>
      <p>
        Local AI Advisor is an independent project at iownchatgpt.com. It is not affiliated with or endorsed by OpenAI, Apple, NVIDIA or any
        model maker; “ChatGPT” is a trademark of OpenAI.
      </p>

      <h2>How the ratings are made</h2>
      <p>
        Every verdict comes from one engine that models memory, memory bandwidth, context length and the demands of each task. It is calibrated against published
        benchmarks and speed reports from the community. The full method and its sources are on <Link href="/methodology">how we calculate</Link>. When the data is thin,
        the site says so with a confidence level rather than guessing.
      </p>

      <h2>How it’s funded</h2>
      <p>
        The site is free and needs no sign-up. It is paid for by ads from Google AdSense. No company pays for a rating or a recommendation, and ads have no effect on
        results. See the <Link href="/privacy">privacy policy</Link> for how ads and analytics work.
      </p>

      <h2>How AI is used here</h2>
      <p>
        The <Link href="/blog">blog</Link> is researched and drafted by Ray, an AI assistant, and every post is credited as “Ray, Your Local AI Advisor”. Posts follow
        strict rules: written for beginners, no hype, and a source for every factual claim. The ratings themselves are calculated, not written by AI.
      </p>

      <h2>Corrections and contact</h2>
      <p>
        Spotted a mistake or a missing model or computer? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use the <Link href="/contact">contact page</Link>.
        We fix what readers report.
      </p>
    </InfoPage>
  );
}
