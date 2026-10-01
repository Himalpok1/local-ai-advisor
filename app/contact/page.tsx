import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { InfoPage } from "@/components/site/info-page";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Local AI Advisor: corrections, missing models or computers, privacy requests and feedback.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <InfoPage title="Contact" intro="Found a wrong number, a missing model or computer, or just have a question? We read every message.">
      <p className="not-prose">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/25 transition hover:brightness-110"
        >
          <Mail className="size-5" aria-hidden /> {CONTACT_EMAIL}
        </a>
      </p>

      <h2>What helps us most</h2>
      <ul>
        <li>
          <strong>Corrections.</strong> Tell us the page, what looks wrong, and a source if you have one (a model card, a spec sheet or a benchmark).
        </li>
        <li>
          <strong>Real speeds.</strong> If you measured a model on your own computer, the <Link href="/community/submit">speed report form</Link> is the fastest way to
          improve our estimates.
        </li>
        <li>
          <strong>Missing models or computers.</strong> Send the Hugging Face link or the exact machine and memory size.
        </li>
        <li>
          <strong>Privacy requests.</strong> To delete your account or get a copy of your data, email us from the address you signed in with. See the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </li>
      </ul>

      <h2>Before you write</h2>
      <p>
        Many “will it run?” questions are answered instantly by <Link href="/check">Check my computer</Link>, and <Link href="/methodology">how we calculate</Link> explains
        where each number comes from. We can’t offer one-to-one tech support, but we do fix what readers report.
      </p>
    </InfoPage>
  );
}
