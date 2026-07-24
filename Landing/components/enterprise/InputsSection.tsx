"use client";

import Image from "next/image";
import Reveal from "../Reveal";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Inputs — the two things the engine needs: the brand model and the product.
 * Presented as equal-weight cards joined by a "+" node.
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

        <Reveal className="mt-14">
          <div className="flex flex-col items-center gap-5 md:flex-row md:items-stretch">
            {cards.map((c, idx) => (
              <div key={c.label} className="contents md:flex md:flex-1 md:items-center">
                <figure className="card w-full flex-1 overflow-hidden">
                  <div className="relative aspect-[4/3] bg-mist">
                    <Image
                      src={c.src}
                      alt={c.label}
                      fill
                      sizes="(max-width: 768px) 100vw, 42vw"
                      className="object-cover object-top"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-surface/95 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink shadow-soft">
                      {c.label}
                    </span>
                  </div>
                  <figcaption className="border-t border-line p-5 text-sm leading-relaxed text-ink-soft">
                    {c.caption}
                  </figcaption>
                </figure>

                {idx === 0 && (
                  <span
                    className="my-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-lavender shadow-soft md:mx-5 md:my-0"
                    aria-hidden
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
