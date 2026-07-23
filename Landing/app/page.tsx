import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import TryOnDemo from "@/components/TryOnDemo";
import Pricing from "@/components/Pricing";
import DemoVideo from "@/components/DemoVideo";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <TryOnDemo />
        <Pricing />
        <DemoVideo />
        <Gallery />
      </main>
      <Footer />
    </>
  );
}
