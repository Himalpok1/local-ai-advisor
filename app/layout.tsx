import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { MobileTabBar } from "@/components/site/mobile-tab-bar";
import { Providers } from "@/components/site/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Google tags carried over from the previous iownchatgpt.com site.
const GA_ID = "G-00RR0835VF";
const ADSENSE_CLIENT = "ca-pub-9781380082063087";

export const metadata: Metadata = {
  metadataBase: new URL("https://iownchatgpt.com"),
  title: { default: "Local AI Advisor — will local AI actually run well on your computer?", template: "%s · Local AI Advisor" },
  description:
    "Choose your hardware, tools and workload. Find which local AI models will be comfortable to use — not just which ones technically fit.",
  icons: { icon: "/brand/logo-mark-128.png", apple: "/brand/logo-mark-512.png" },
};

export const viewport: Viewport = {
  // "cover" lets the bottom tab bar sit under the iPhone home indicator using safe-area insets.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f17" },
  ],
};

const themeInitScript = `(function(){
  try {
    var saved = localStorage.getItem('laa-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = saved === 'dark' || (!saved && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch(e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="pb-tabbar flex min-h-full flex-col font-sans">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <MobileTabBar />
        </Providers>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <Script src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} strategy="afterInteractive" crossOrigin="anonymous" />
      </body>
    </html>
  );
}
