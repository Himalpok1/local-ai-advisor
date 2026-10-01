import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/site/info-page";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using Local AI Advisor: estimates, not guarantees; third-party models and their licenses; accounts and community speed reports.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage title="Terms of use" intro="Plain-language terms for using iownchatgpt.com. By using the site you agree to them." updated={LEGAL_UPDATED}>
      <h2>Estimates, not guarantees</h2>
      <p>
        Ratings, speeds and memory figures are estimates from a published model of how AI software uses your hardware, calibrated on public benchmarks and community
        reports. Real results depend on your exact software versions, settings, drivers and what else is running. Read <Link href="/methodology">how we calculate</Link>{" "}
        and use the numbers as guidance, not as a promise. Please don’t make purchase decisions on our estimates alone.
      </p>

      <h2>No warranty</h2>
      <p>
        The site and everything on it are provided “as is”, free of charge and without warranties of any kind. To the extent the law allows, we are not liable for losses
        that come from using the site, including hardware bought or software installed based on it.
      </p>

      <h2>Third-party models, apps and links</h2>
      <p>
        We describe AI models, apps and hardware made by other companies. We don’t host model files: download commands fetch them from their publishers (for example
        Hugging Face). Each model has its own license, which you are responsible for following. Links to other sites are for convenience; we don’t control their content.
      </p>

      <h2>Accounts</h2>
      <p>
        Signing in with Google is optional. Keep your Google account secure; you’re responsible for what happens under it here. We may suspend accounts that abuse the
        site, for example by submitting fake speed reports or automated requests.
      </p>

      <h2>Community speed reports</h2>
      <p>
        When you submit a speed report you confirm it’s a real measurement you made. You allow us to publish it (without your name) and use it to improve our estimates.
        We may edit, flag or remove reports that look wrong.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don’t overload the site with automated requests or try to get around its rate limits.</li>
        <li>Don’t attempt to break, probe or disrupt the site or its accounts.</li>
        <li>Reasonable quoting and linking is welcome. Please credit Local AI Advisor and link to the page you quote.</li>
      </ul>

      <h2>Advertising</h2>
      <p>
        The site shows ads through Google AdSense to cover its costs. Ads are labeled by Google and are separate from our ratings, which are never sold. See the{" "}
        <Link href="/privacy">privacy policy</Link> for how ads use cookies.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms; the date at the top shows the latest version. Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </InfoPage>
  );
}
