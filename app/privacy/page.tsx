import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/site/info-page";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Local AI Advisor collects, why, who it is shared with (Google Analytics, Google AdSense, Hugging Face, our host), and how to get your data deleted.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      intro="Local AI Advisor works without an account. This page explains exactly what is collected when you use it, who else is involved, and how to have your data removed."
      updated={LEGAL_UPDATED}
    >
      <h2>Who we are</h2>
      <p>
        Local AI Advisor (iownchatgpt.com) is an independent project. For anything on this page, including deletion requests, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>If you just browse</h2>
      <ul>
        <li>
          <strong>No account needed.</strong> The recommendation tools run with the choices you make on the page. They are kept in the page address so you can share a
          result; we don’t store them on our servers.
        </li>
        <li>
          <strong>Settings stay in your browser.</strong> Your theme, which lessons you have finished and your last Hugging Face lookup settings are saved in your browser’s
          local storage. They never leave your device, and clearing your browser data removes them.
        </li>
        <li>
          <strong>Server and network logs.</strong> Like any website, our hosting provider (Hostinger) and its content delivery network receive your IP address, browser
          type and the pages you request in order to deliver and protect the site. We also keep a short-lived, in-memory request count per IP address to stop abuse of the
          Hugging Face lookup; it is not written to disk.
        </li>
        <li>
          <strong>Hugging Face lookups.</strong> When you check a Hugging Face model, our server asks Hugging Face’s public API for that model’s files. Hugging Face sees the
          request from our server, not from you.
        </li>
      </ul>

      <h2>Analytics and advertising (Google)</h2>
      <p>
        We use <strong>Google Analytics</strong> to understand which pages are useful, and <strong>Google AdSense</strong> to show ads that pay for the site. Both are run by
        Google and use cookies or similar identifiers on your device.
      </p>
      <ul>
        <li>Google Analytics records pages viewed, approximate location, device and browser details, and how you arrived. We see only aggregated reports.</li>
        <li>
          Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites. Google’s advertising cookies let it and its
          partners serve ads based on those visits.
        </li>
        <li>
          You can opt out of personalized advertising in <a href="https://adssettings.google.com">Google’s Ads Settings</a>, or opt out of some third-party vendors’ use of
          cookies at <a href="https://www.aboutads.info/choices/">aboutads.info</a>.
        </li>
        <li>
          Learn more in <a href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</a>. You can block
          Analytics with Google’s <a href="https://tools.google.com/dlpage/gaoptout">opt-out browser add-on</a>.
        </li>
      </ul>
      <p>Our recommendations are never paid for. Ads don’t influence which models or computers we rate well.</p>

      <h2>If you sign in with Google</h2>
      <p>Signing in is optional. It lets you save computers and results and get alerts about new models. When you sign in, we store:</p>
      <ul>
        <li>Your name, email address, profile picture link and Google account ID, as provided by Google.</li>
        <li>The sign-in tokens Google issues for this connection. We only ask Google for your basic profile, so they can’t read your email, files or contacts.</li>
        <li>A signed session cookie in your browser that keeps you logged in.</li>
        <li>Anything you choose to save: computers (“rigs”), saved results, and when you last looked at new-model alerts.</li>
      </ul>
      <p>This data is stored in our database at our hosting provider and is used only to run your account. We don’t sell it or share it with advertisers.</p>

      <h2>Community speed reports</h2>
      <p>
        If you submit a speed measurement, we store the computer, model, settings, speeds and any note you write, linked to your account so we can moderate it. Reports are
        shown publicly and used to calibrate our estimates, <strong>without your name or email</strong>. Please don’t put personal information in the note.
      </p>

      <h2>How long we keep data, and your choices</h2>
      <ul>
        <li>Saved computers and results stay until you delete them. You can do that yourself on your <Link href="/me">account page</Link>.</li>
        <li>
          To delete your whole account, including your speed reports, or to get a copy of your data, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the
          address you signed in with. We do it within 30 days.
        </li>
        <li>You can also remove Local AI Advisor’s access at any time in your Google Account under “Third-party apps & services”.</li>
      </ul>

      <h2>Children</h2>
      <p>The site is not aimed at children under 13, and we don’t knowingly collect their personal information.</p>

      <h2>Changes</h2>
      <p>If we change what we collect, we will update this page and the date at the top.</p>
    </InfoPage>
  );
}
