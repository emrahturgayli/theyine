import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TryOnHero from "@/components/tryon/TryOnHero";
import TryOnDemo from "@/components/TryOnDemo";
import Pipeline from "@/components/tryon/Pipeline";
import CaseStudy from "@/components/tryon/CaseStudy";
import Pricing from "@/components/Pricing";
import DemoVideo from "@/components/DemoVideo";

// Static SEO (server-rendered). Copy mirrors the English tryonPage dictionary.
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
  alternates: { canonical: "/shopify-virtual-try-on" },
  openGraph: {
    title: "Shopify Virtual Try-On Automation | THEYINE",
    description:
      "Turn flat product photos into on-model imagery automatically — generated, written back to Shopify, and tagged.",
    type: "website",
    url: "/shopify-virtual-try-on",
    images: [{ url: "/assets/tryon/result.jpg" }],
  },
};

export default function ShopifyVirtualTryOnPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Prestige flow: promise → proof → how → results → watch → price */}
        <TryOnHero />
        <TryOnDemo />
        <Pipeline />
        <CaseStudy />
        <DemoVideo />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
