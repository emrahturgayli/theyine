import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import Providers from "@/components/Providers";
import Analytics from "@/components/Analytics";

// Runs before paint to apply the persisted theme/language and avoid a flash.
const noFlashScript = `(function(){try{var e=document.documentElement;var t=localStorage.getItem('theyine-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){e.classList.add('dark');}e.style.colorScheme=t;var l=localStorage.getItem('theyine-lang');if(l){e.lang=l;}}catch(_){}})();`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://theyine.com"),
  title: "THEYINE | Plug-and-Play AI Infrastructure for E-Commerce & B2B",
  description:
    "THEYINE is a Sofia-based AI automation studio building plug-and-play infrastructure for e-commerce and B2B enterprise — Shopify automation, QR-based guest journeys, and the systems behind them.",
  keywords: [
    "AI automation",
    "B2B SaaS",
    "Shopify automation",
    "enterprise infrastructure",
    "workflow optimization",
    "THEYINE",
  ],
  authors: [{ name: "THEYINE" }],
  openGraph: {
    title: "THEYINE | Plug-and-Play AI Infrastructure for E-Commerce & B2B",
    description:
      "Sofia-based AI automation studio. Enterprise infrastructure that ships in days, not quarters.",
    type: "website",
    url: "https://www.theyine.com",
    siteName: "Theyine",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Theyine logo" }],
  },
  twitter: {
    card: "summary",
    title: "THEYINE | Plug-and-Play AI Infrastructure for E-Commerce & B2B",
    description:
      "Sofia-based AI automation studio. Enterprise infrastructure that ships in days, not quarters.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/favicon-128.png", sizes: "128x128", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/favicon-128.png",
  },
};

// Organization structured data so Google Search can surface the THEYINE
// logo in search results and populate a Knowledge Panel.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Theyine",
  url: "https://www.theyine.com",
  logo: "https://www.theyine.com/logo.png",
  sameAs: [
    "https://www.youtube.com/@Emrahssandbox",
    "https://www.linkedin.com/in/emrah-turgayli-7967a5178",
  ],
};

export const viewport: Viewport = {
  themeColor: "#F9F9FB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Analytics />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
