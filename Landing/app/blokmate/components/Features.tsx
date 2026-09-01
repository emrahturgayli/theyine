"use client";

import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: JSX.Element[] = [
  // Dues tracking & collection
  <svg key="i0" viewBox="0 0 24 24" {...stroke}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </svg>,
  // One-tap payment
  <svg key="i1" viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12l2 2 4-4" />
  </svg>,
  // Announcements
  <svg key="i2" viewBox="0 0 24 24" {...stroke}>
    <path d="M4 10v4h3l5 4V6l-5 4z" />
    <path d="M16 9a4 4 0 0 1 0 6" />
  </svg>,
  // Maintenance / tickets
  <svg key="i3" viewBox="0 0 24 24" {...stroke}>
    <path d="M14.7 6.3a3 3 0 0 0-4.2 4.2L4 17v3h3l6.5-6.5a3 3 0 0 0 4.2-4.2l-2.1 2.1-2-2z" />
  </svg>,
  // Excel import
  <svg key="i4" viewBox="0 0 24 24" {...stroke}>
    <path d="M12 3v12m0 0-4-4m4 4 4-4" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>,
  // Security
  <svg key="i5" viewBox="0 0 24 24" {...stroke}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    <path d="M9.5 12l1.8 1.8L15 10" />
  </svg>,
];

export default function Features() {
  const { dict } = useBlokmateLanguage();
  const section = dict.features;

  return (
    <section id="features" className="border-b border-line bg-mist/40 py-20 md:py-28">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">{section.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">{section.title}</h2>
          <p className="mt-4 text-lg text-ink-soft">{section.subtitle}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, i) => (
            <div key={item.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                <span className="h-5 w-5">{ICONS[i % ICONS.length]}</span>
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
