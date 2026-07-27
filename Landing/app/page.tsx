"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductShowcase from "@/components/ProductShowcase";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";

export default function Home() {
  const { dict } = useLanguage();
  const { qrShowcase, tryonShowcase } = dict.home;

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        {/* Product showcases — the two live products get top billing right
            under the hero, ahead of the generic studio-capabilities grid. */}
        <ProductShowcase
          visual="qr"
          eyebrow={qrShowcase.eyebrow}
          title={qrShowcase.title}
          description={qrShowcase.description}
          ctaLabel={qrShowcase.cta}
          ctaHref="/enterprise-qr"
          analyticsLabel="home_qr_showcase"
        />
        <ProductShowcase
          visual="tryon"
          reverse
          eyebrow={tryonShowcase.eyebrow}
          title={tryonShowcase.title}
          description={tryonShowcase.description}
          ctaLabel={tryonShowcase.cta}
          ctaHref="/enterprise-tryon"
          analyticsLabel="home_tryon_showcase"
        />
        <Services />
        <Gallery />
      </main>
      <Footer />
    </>
  );
}
