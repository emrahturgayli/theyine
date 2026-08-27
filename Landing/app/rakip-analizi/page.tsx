import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeadMagnet from "@/components/LeadMagnet";

export const metadata: Metadata = {
  title: "Безплатен AI Анализ на Конкуренти | Дупница | THEYINE",
  description:
    "Безплатен доклад за конкурентно и съдържателно разузнаване с изкуствен интелект за клиники, учебни заведения и местни търговци в Дупница. В имейла ви до 48 часа.",
  keywords: [
    "AI анализ на конкуренти",
    "дигитален маркетинг Дупница",
    "местен бизнес Дупница",
    "конкурентно разузнаване",
    "THEYINE",
  ],
  alternates: { canonical: "/rakip-analizi" },
  openGraph: {
    title: "Безплатен AI Анализ на Конкуренти | Дупница | THEYINE",
    description:
      "Вижте къде конкурентите ви печелят онлайн — и къде вие изоставате. Безплатен доклад, задвижван от изкуствен интелект.",
    type: "website",
    url: "/rakip-analizi",
  },
};

// Service structured data — targets local-business search intent in Dupnitsa.
const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "THEYINE AI Competitor & Content Intelligence Report",
  serviceType: "AI-powered competitor and content intelligence report",
  description:
    "A free AI-generated report analyzing local competitors' content, pricing and digital presence for clinics, education providers and retailers in Dupnitsa, Bulgaria.",
  provider: { "@type": "Organization", name: "THEYINE", url: "https://theyine.com" },
  areaServed: {
    "@type": "City",
    name: "Dupnitsa",
  },
  audience: {
    "@type": "Audience",
    audienceType: "Clinics, educational institutions, local retailers",
  },
  availableLanguage: ["bg", "en", "tr"],
};

export default function LeadMagnetPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <Navbar />
      <main>
        <LeadMagnet />
      </main>
      <Footer />
    </>
  );
}
