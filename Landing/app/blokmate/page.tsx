"use client";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import DemoVideo from "./components/DemoVideo";
import PricingSummary from "./components/PricingSummary";
import Testimonials from "./components/Testimonials";
import LeadMagnet from "./components/LeadMagnet";
import Footer from "./components/Footer";
import OnboardingModal from "./components/OnboardingModal";

// Service structured data — helps this landing page surface for
// local-business "building/apartment management software" search intent.
const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BlokMate",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Apartment and site management platform — dues tracking, collection, announcements and maintenance requests in one dashboard.",
  provider: { "@type": "Organization", name: "THEYINE", url: "https://theyine.com" },
  areaServed: ["Bulgaria", "Turkey"],
};

export default function BlokmatePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <OnboardingModal />
      <Navbar />
      <main>
        <Hero />
        <section className="border-b border-line py-16 md:py-20">
          <div className="container-shell">
            <Dashboard />
          </div>
        </section>
        <HowItWorks />
        <Features />
        <DemoVideo />
        <PricingSummary />
        <Testimonials />
        <section className="py-20 md:py-28">
          <div className="container-shell">
            <LeadMagnet />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
