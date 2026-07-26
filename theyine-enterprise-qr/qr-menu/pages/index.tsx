// Public landing: THEYINE marka hero'su, özellik kartları, demo video (facade)
// ve CTA'lar. Ana siteyle aynı SEO desenini izler — demo video için VideoObject
// structured data (yalnızca thumbnail türetilebiliyorsa) enjekte edilir.

import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Layout";
import DemoVideo from "../components/DemoVideo";
import { parseVideo } from "../lib/video";
import { useT } from "../lib/i18n";

const demo = parseVideo(process.env.NEXT_PUBLIC_DEMO_VIDEO_URL);

const videoJsonLd = demo?.thumbnail
  ? {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: "THEYINE — Restaurant QR Management Demo",
      description:
        "How restaurants in Bulgaria manage menus, campaigns, reservations and orders through a single QR code.",
      thumbnailUrl: demo.thumbnail,
      uploadDate: "2026-07-25",
      embedUrl: demo.embedUrl,
      contentUrl: process.env.NEXT_PUBLIC_DEMO_VIDEO_URL,
      publisher: { "@type": "Organization", name: "THEYINE" },
    }
  : null;

export default function LandingPage() {
  const t = useT();

  const features = [
    { icon: "📱", title: t("landing.features.menu"), desc: t("landing.features.menuDesc") },
    { icon: "🎯", title: t("landing.features.campaigns"), desc: t("landing.features.campaignsDesc") },
    { icon: "📅", title: t("landing.features.reservations"), desc: t("landing.features.reservationsDesc") },
    { icon: "📊", title: t("landing.features.analytics"), desc: t("landing.features.analyticsDesc") },
  ];

  return (
    <Layout>
      {videoJsonLd && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
          />
        </Head>
      )}

      <main className="container">
        <section className="hero">
          <div className="eyebrow">THEYINE · ENTERPRISE</div>
          <h1>{t("landing.title")}</h1>
          <p>{t("landing.subtitle")}</p>
          <div className="cta-row">
            <a href="#demo" className="btn btn-ghost">
              ▶ {t("landing.watchDemo")}
            </a>
            <Link href="/admin" className="btn btn-primary">
              {t("landing.startNow")} →
            </Link>
          </div>
        </section>

        <section className="features">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </section>

        <DemoVideo />
      </main>
    </Layout>
  );
}
