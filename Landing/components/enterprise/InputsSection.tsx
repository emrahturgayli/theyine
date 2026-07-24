"use client";

import Image from "next/image";
import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Inputs — the two things the engine needs: the brand model and the product.
 * Staggered, numbered pair (01 / 02) instead of a symmetric "+" join —
 * the second card sits offset and overlapping to read as one sequence.
 */
export default function InputsSection() {
  const { dict } = useLanguage();
  const i = dict.tryonPage.inputs;

  const cards = [
    { src: "/assets/tryon/model.jpg", label: i.modelLabel, caption: i.modelCaption },
    { src: "/assets/tryon/garment.jpg", label: i.productLabel, caption: i.productCaption },
  ];

  return (
    <section id="inputs" className="border-b border-line py-24 md:py-section">
      <div className="container-shell">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {i.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {i.title}
          </h2>
          <p className="mt-4 text-lg text-ink-soft">{i.subtitle}</p>
        </Reveal>

        <Reveal className="mt-16">
          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-0">
            {cards.map((c, idx) => (
              <figure
                key={c.label}
                className={`card relative overflow-hidden ${
                  idx === 1
                    ? "md:-ml-10 md:mt-16 md:shadow-lift"
                    : "md:mr-10"
                }`}
                style={{ zIndex: idx === 1 ? 10 : 0 }}
              >
                <div className="relative aspect-[4/3] bg-mist">
                  <Image
                    src={c.src}
                    alt={c.label}
                    fill
                    sizes="(max-width: 768px) 100vw, 42vw"
                    className="object-cover object-top"
                  />
                  <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-lavender text-xs font-semibold text-white shadow-soft">
                    0{idx + 1}
                  </span>
                  <span className="absolute right-4 top-4 rounded-full bg-surface/95 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink shadow-soft">
                    {c.label}
                  </span>
                </div>
                <figcaption className="border-t border-line p-5 text-sm leading-relaxed text-ink-soft">
                  {c.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
