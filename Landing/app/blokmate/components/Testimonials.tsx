"use client";

import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";

export default function Testimonials() {
  const { dict } = useBlokmateLanguage();

  return (
    <section className="border-b border-line bg-mist/40 py-20 md:py-28">
      <div className="container-shell">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {dict.testimonials.map((t) => (
            <div key={t.author} className="card p-8">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600/30" aria-hidden>
                <path d="M9.5 5C6 5 3 8 3 12.5S6 20 9.5 20c1 0 1.5-.7 1.5-1.5S10.5 17 9.5 17C7.6 17 6 15.4 6 13.5c0-.3 0-.6.1-.9.4.3.9.4 1.4.4C9.4 13 11 11.4 11 9.5S9.4 6 7.5 6c-.5 0 1.1-1 2-1zm10 0c-3.5 0-6.5 3-6.5 7.5S16 20 19.5 20c1 0 1.5-.7 1.5-1.5S20.5 17 19.5 17c-1.9 0-3.5-1.6-3.5-3.5 0-.3 0-.6.1-.9.4.3.9.4 1.4.4 1.9 0 3.5-1.6 3.5-3.5S19.4 6 17.5 6c-.5 0 1.1-1 2-1z" />
              </svg>
              <p className="mt-4 text-lg leading-relaxed text-ink">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5">
                <div className="text-sm font-semibold text-ink">{t.author}</div>
                <div className="text-sm text-ink-faint">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
