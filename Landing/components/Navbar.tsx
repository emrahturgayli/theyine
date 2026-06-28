"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { useLanguage, LANGUAGES, type Language } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";

/* ------------------------------------------------------------------ */
/* Language toggle — accessible pill dropdown (EN / BG / TR)           */
/* ------------------------------------------------------------------ */
function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const active = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("a11y.language")}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 min-w-[68px] items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-lavender-soft"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
        </svg>
        {active.label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("a11y.language")}
          className="animate-fade-in absolute right-0 z-50 mt-2 w-32 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-soft"
        >
          {LANGUAGES.map((l) => {
            const selected = l.code === lang;
            return (
              <li key={l.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setLang(l.code as Language);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-lavender text-white"
                      : "text-ink-soft hover:bg-lavender-tint hover:text-ink"
                  }`}
                >
                  {l.label}
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                      <path d="M5 12l5 5 9-9" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Theme toggle — light / dark                                        */
/* ------------------------------------------------------------------ */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={t("a11y.theme")}
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-lavender-soft hover:text-lavender"
    >
      {/* Sun (light) / Moon (dark) */}
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.8A8 8 0 1 1 11.2 3 6.2 6.2 0 0 0 21 12.8z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Navbar                                                             */
/* ------------------------------------------------------------------ */
export default function Navbar() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = [
    { label: t("nav.studio"), href: "#studio" },
    { label: t("nav.services"), href: "#services" },
    { label: t("nav.work"), href: "#work" },
    { label: t("nav.method"), href: "#method" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-line bg-canvas/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-shell flex items-center justify-between py-4">
        <a href="#studio" aria-label="THEYINE home">
          <Logo />
        </a>

        <div className="hidden items-center gap-9 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <a href="#contact" className="hidden btn-primary lg:inline-flex">
            {t("nav.cta")}
          </a>

          <button
            type="button"
            aria-label={t("a11y.menu")}
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

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-line bg-canvas/95 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="container-shell flex flex-col gap-1 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-mist hover:text-ink"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex items-center gap-2 sm:hidden">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <a href="#contact" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">
            {t("nav.cta")}
          </a>
        </div>
      </div>
    </header>
  );
}
