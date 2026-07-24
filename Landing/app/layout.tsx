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
  title: "THEYINE | Creative AI Automation Studio",
  description:
    "THEYINE is a creative AI automation studio for modern brands — design, automation and operational intelligence. Simple automation. Human clarity.",
  keywords: [
    "AI automation",
    "creative studio",
    "workflow optimization",
    "design systems",
    "THEYINE",
  ],
  authors: [{ name: "THEYINE" }],
  openGraph: {
    title: "THEYINE | Creative AI Automation Studio",
    description:
      "Intelligent automation for modern brands. Simple automation. Human clarity.",
    type: "website",
  },
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
      </head>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
