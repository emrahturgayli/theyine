import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoStudio from "@/components/studio/VideoStudio";

// Internal tool, not a marketing surface — kept out of search results and
// off the sitemap (see app/sitemap.ts).
export const metadata: Metadata = {
  title: "AI Video Stüdyosu | THEYINE",
  description: "Tek prompt ile 9:16 ders videosu üret — senaryo, seslendirme ve render otomatik.",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return (
    <>
      <Navbar />
      <main>
        <VideoStudio />
      </main>
      <Footer />
    </>
  );
}
