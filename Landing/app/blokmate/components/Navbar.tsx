"use client";

import { useState } from "react";
import Link from "next/link";
import { useBlokmateLanguage, BLOKMATE_LANGUAGES, type BlokmateLanguage } from "@/hooks/useBlokmateLanguage";

export default function BlokMateNavbar() {
  const { t, lang, setLang } = useBlokmateLanguage();
  const [open, setOpen] = useState(false);

  const links = [
    { label: t("nav.howItWorks"), href: "#how-it-works" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.blog"), href: "/blokmate/blog" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-canvas/90 backdrop-blur-xl">
      <nav className="container-shell flex items-center justify-between py-4">
        <Link href="/blokmate" className="flex items-center gap-2 text-lg font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            B
          </span>
          BlokMate
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-line p-1 sm:flex">
            {BLOKMATE_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code as BlokmateLanguage)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  lang === l.code ? "bg-blue-600 text-white" : "text-ink-faint hover:text-ink"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <a href="#demo" className="btn hidden bg-blue-600 text-white hover:bg-blue-700 sm:inline-flex">
            {t("nav.cta")}
          </a>

          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-all ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute left-0 h-0.5 w-5 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </nav>

      <div
        className={`overflow-hidden border-t border-line bg-canvas/95 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="container-shell flex flex-col gap-1 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-mist hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-1 rounded-full border border-line p-1 sm:hidden">
            {BLOKMATE_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code as BlokmateLanguage)}
                className={`flex-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  lang === l.code ? "bg-blue-600 text-white" : "text-ink-faint hover:text-ink"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <a href="#demo" onClick={() => setOpen(false)} className="btn mt-3 w-full bg-blue-600 text-white hover:bg-blue-700">
            {t("nav.cta")}
          </a>
        </div>
      </div>
    </header>
  );
}
