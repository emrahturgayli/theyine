"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MiniDemo from "../components/MiniDemo";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";

export default function BlokmateDemoPage() {
  const { dict } = useBlokmateLanguage();

  return (
    <>
      <Navbar />
      <main>
        <section className="border-b border-line py-16 md:py-24">
          <div className="container-shell flex flex-col items-center text-center">
            <span className="eyebrow justify-center">{dict.demo.eyebrow}</span>
            <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {dict.onboarding.step3}
            </h1>
            <div className="mt-10 w-full">
              <MiniDemo />
            </div>
            <Link href="/blokmate#demo" className="btn mt-10 bg-blue-600 text-white hover:bg-blue-700">
              {dict.nav.cta}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
