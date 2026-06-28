"use client";

import Logo from "./Logo";
import { useLanguage } from "@/hooks/useLanguage";

export default function Footer() {
  const { dict } = useLanguage();
  const { cta, footer } = dict;

  const social = [
    { label: footer.links.linkedin, href: "#" },
    { label: footer.links.instagram, href: "#" },
    { label: footer.links.privacy, href: "#" },
    { label: footer.links.terms, href: "#" },
  ];

  return (
    <footer className="bg-canvas">
      {/* Closing CTA -------------------------------------------------- */}
      <section id="contact" className="container-shell pb-16 pt-4 md:pb-24">
        <div className="relative overflow-hidden rounded-xl2 bg-panel px-6 py-14 text-center sm:px-10 md:px-16 md:py-24">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-lavender/40 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-lavender-soft/30 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              {cta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              {cta.subtitle}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:hello@theyine.com"
                className="btn-on-dark w-full sm:w-auto"
              >
                {cta.primary}
              </a>
              <a
                href="#services"
                className="btn w-full border border-white/20 text-white hover:bg-white/10 sm:w-auto"
              >
                {cta.secondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer body -------------------------------------------------- */}
      <div className="border-t border-line">
        <div className="container-shell py-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-sm">
              <Logo />
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                {footer.tagline}
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-8 gap-y-2">
              {social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="inline-flex min-h-[44px] items-center text-sm font-medium text-ink-soft transition-colors hover:text-lavender"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {footer.rights}</p>
            <p>{footer.crafted}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
