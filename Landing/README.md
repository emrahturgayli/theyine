# THEYINE — Landing Page

Production-ready landing page for **THEYINE**, a creative AI automation studio.
Built with Next.js (App Router), React, TypeScript and Tailwind CSS, following the
official `brand.md` identity: bright whites, subtle grays and refined lavender accents.

> _Simple automation. Human clarity._

## Tech stack

- **Next.js 14** (App Router)
- **React 18 + TypeScript**
- **Tailwind CSS 3** (custom brand theme)
- **Inter** via `next/font`

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # lint
```

## Project structure

```
Landing/
├─ app/
│  ├─ layout.tsx        # root layout, fonts, metadata
│  ├─ page.tsx          # landing page composition
│  └─ icon.svg          # favicon (brand node mark)
├─ components/
│  ├─ Navbar.tsx        # sticky responsive nav + mobile menu
│  ├─ Hero.tsx          # hero w/ logo mark, abstract field, CTA hierarchy
│  ├─ Services.tsx      # 2-column service grid (from brand.md §9)
│  ├─ Gallery.tsx       # interactive "AI Capability Map" + methodology
│  ├─ Footer.tsx        # closing CTA + footer
│  ├─ Logo.tsx          # original SVG node mark + wordmark
│  └─ Reveal.tsx        # scroll-reveal animation wrapper
├─ styles/
│  └─ globals.css       # Tailwind layers + brand base styles
├─ public/assets/       # logo asset
└─ tailwind.config.ts   # brand color/typography/animation tokens
```

## Design notes

- **Light, premium aesthetic** — Soft White `#F9F9FB`, Charcoal `#1F1827`, Lavender `#7C3AED`.
- **Original visuals only** — the network mark and all "gallery" art are generated in
  SVG/CSS. No Stitch assets or stock imagery are used. Abstract, non-robotic.
- **Motion** — fade/slide reveals via `IntersectionObserver`, subtle float/spin on the
  hero mark, all gated by `prefers-reduced-motion`.
- **Responsive** — mobile-first; tested across mobile, tablet and desktop breakpoints.
- **Accessibility** — semantic landmarks, `aria` labels, visible focus rings.
