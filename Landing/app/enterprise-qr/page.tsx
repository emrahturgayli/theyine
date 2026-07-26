import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QrHero from "@/components/qr/QrHero";
import QrFeatures from "@/components/qr/QrFeatures";
import QRWidget from "@/components/QRWidget";
import { QR_DEMO_CAMPAIGN } from "@/lib/qr";

export const metadata: Metadata = {
  title: "QR Menu & Restaurant Automation | THEYINE",
  description:
    "One QR code for your restaurant's menu, campaigns, reservations and orders — with real-time scan analytics and an embeddable widget for any website.",
  keywords: [
    "QR menu",
    "restaurant QR code",
    "digital menu",
    "restaurant automation",
    "QR analytics",
    "THEYINE",
  ],
  alternates: { canonical: "/enterprise-qr" },
  openGraph: {
    title: "QR Menu & Restaurant Automation | THEYINE",
    description:
      "Menus, campaigns, reservations and orders behind a single scannable code — managed from one dashboard, measured in real time.",
    type: "website",
    url: "/enterprise-qr",
  },
};

// Service structured data — mirrors the page's positioning for rich results.
const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "THEYINE QR Menu & Restaurant Automation",
  serviceType: "Restaurant QR code management",
  description:
    "One QR code for a restaurant's menu, campaigns, reservations and orders, with real-time scan-to-conversion analytics and an embeddable website widget.",
  provider: { "@type": "Organization", name: "THEYINE", url: "https://theyine.com" },
  areaServed: "Bulgaria",
  availableLanguage: ["bg", "en"],
};

export default function EnterpriseQrPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <Navbar />
      <main>
        {/* promise → what you get; the floating widget is the live proof */}
        <QrHero />
        <QrFeatures />
      </main>
      <Footer />
      <QRWidget campaign={QR_DEMO_CAMPAIGN} />
    </>
  );
}
