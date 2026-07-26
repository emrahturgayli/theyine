import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnterpriseHero from "@/components/enterprise/EnterpriseHero";
import InputsSection from "@/components/enterprise/InputsSection";
import BeforeAfter from "@/components/enterprise/BeforeAfter";
import Pipeline from "@/components/tryon/Pipeline";
import CaseStudy from "@/components/tryon/CaseStudy";
import CtaBand from "@/components/enterprise/CtaBand";
import DemoVideo from "@/components/DemoVideo";
import Pricing from "@/components/Pricing";
import QRWidget from "@/components/QRWidget";
import { parseVideo } from "@/lib/video";

export const metadata: Metadata = {
  title: "Shopify Virtual Try-On Automation | THEYINE",
  description:
    "Automatically dress your Shopify products on a model with AI and write the images back to your store. Enterprise-grade, 24/7, multilingual.",
  keywords: [
    "Shopify virtual try-on",
    "AI product photography",
    "Shopify automation",
    "Fal.ai",
    "on-model imagery",
    "THEYINE",
  ],
  alternates: { canonical: "/enterprise-tryon" },
  openGraph: {
    title: "Shopify Virtual Try-On Automation | THEYINE",
    description:
      "Turn flat product photos into on-model imagery automatically — generated, written back to Shopify, and tagged.",
    type: "website",
    url: "/enterprise-tryon",
    images: [{ url: "/assets/tryon/result.jpg" }],
  },
};

const demo = parseVideo(process.env.NEXT_PUBLIC_DEMO_VIDEO_URL);

// VideoObject structured data — only when a video with a derivable thumbnail
// (YouTube) is configured. Helps the demo surface as a video rich result.
const videoJsonLd = demo?.thumbnail
  ? {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: "THEYINE — Shopify Virtual Try-On Automation Demo",
      description:
        "A 30-second walkthrough: from a plain Shopify product photo to an on-model image, generated and written back automatically.",
      thumbnailUrl: demo.thumbnail,
      uploadDate: "2026-07-25",
      embedUrl: demo.embedUrl,
      contentUrl: process.env.NEXT_PUBLIC_DEMO_VIDEO_URL,
      publisher: { "@type": "Organization", name: "THEYINE" },
    }
  : null;

export default function EnterpriseTryOnPage() {
  return (
    <>
      {videoJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
        />
      )}
      <Navbar />
      <main>
        {/* promise → inputs → proof → how → results → commit → watch → price */}
        <EnterpriseHero />
        <InputsSection />
        <BeforeAfter />
        <Pipeline />
        <CaseStudy />
        <CtaBand />
        <DemoVideo />
        <Pricing />
      </main>
      <Footer />
      <QRWidget campaign="happy-hour-20-trial-9gml" />
    </>
  );
}
