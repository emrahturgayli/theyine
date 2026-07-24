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

export default function EnterpriseTryOnPage() {
  return (
    <>
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
    </>
  );
}
