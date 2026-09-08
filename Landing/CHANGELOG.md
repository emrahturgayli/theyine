# Changelog

## BlokMate landing page — CRO & localization (frontend only)

Scope: `/blokmate` marketing page and the manager Settings plan picker.
No backend, RLS, migrations, or Stripe code touched.

### Changed files
- `lib/blokmate-currency.ts` — added `formatCurrency(value, lang)`, an
  `Intl.NumberFormat`-based helper for whole-unit placeholder amounts
  (mockup cards), reusing the existing TR→TRY / EN,BG→EUR mapping.
- `lib/blokmate-plans.ts` — `BLOKMATE_PLANS` (static, hardcoded ₺) became
  `getBlokmatePlans(lang)`, locale-aware via `formatCurrency`.
- `app/blokmate/components/Dashboard.tsx` — mock "Ödemeyenler" amounts
  and "Güncel Bakiye" now use `formatCurrency` instead of hardcoded
  `"80 лв"` / `"8.140 лв"`.
- `app/blokmate/components/MiniDemo.tsx` — mock invoice amount now uses
  `formatCurrency` instead of hardcoded `"80 лв"`.
- `app/blokmate/components/DemoVideo.tsx` — now renders the `Dashboard`
  mockup (dimmed, `pointer-events-none`) as a backdrop behind the play
  button instead of an empty poster card; moved section padding down
  (`py-20 md:py-28` → `py-16 md:py-20`) to sit closer to Hero.
- `app/blokmate/components/Hero.tsx` — primary CTA text bumped to
  `text-base font-bold` on mobile (16px bold), reverting to the
  existing `text-sm font-semibold` at `sm:` and up; full-width-on-mobile
  and the 48px min-height were already in place (`.btn` in
  `styles/globals.css`), not changed.
- `app/blokmate/page.tsx` — reordered sections: `Hero → DemoVideo →
  HowItWorks → Features → PricingSummary → Testimonials → LeadMagnet`.
  Removed the standalone `<Dashboard />` section that used to sit
  directly under Hero — it's now the backdrop inside `DemoVideo`, so it
  wasn't duplicated in two places on the page.
- `app/blokmate/locales/en.json` — pricing plan prices were `$29/mo` /
  `$79/mo` (USD, inconsistent with the EN→EUR rule); changed to
  `€29/mo` / `€79/mo`.
- `app/blokmate/(app)/settings/page.tsx` — updated to call
  `getBlokmatePlans(lang)` instead of importing the old static
  `BLOKMATE_PLANS`.

### Not changed (flagged per the request's own scope note)
- Server-side/SSR currency handling: none of the above touches
  `lib/blokmate-data.ts`, RLS, or any API route. `formatBlokmateAmount`
  (the invoice/payment formatter used inside the authenticated app) was
  already locale-aware from an earlier phase and needed no change here.
- No new image assets were introduced, so `srcset`/responsive-image
  work doesn't apply this pass — the demo "video" backdrop is the
  existing `Dashboard` React component, not a raster image.
- The play-button overlay uses a native `<button>` (already keyboard-
  focusable with correct implicit semantics) rather than a `div` with
  `role="button"` — adding an explicit role to a real `<button>` would
  be redundant/non-idiomatic, not a correctness gap.

### How it was tested
- `tsc --noEmit` — clean.
- `next build` — clean, all 33 routes generated, including `/blokmate`.
- Static check: `grep -rn "лв|BGN|\$29|\$79"` across
  `app/blokmate/components/*.tsx` and `app/blokmate/locales/*.json` —
  only doc-comment matches remain (explaining the old bug), no live
  hardcoded currency strings.
- No live browser/Lighthouse/device-emulator pass was run in this
  session — recommend a manual pass per language (tr/en/bg) on
  `/blokmate` after deploy: confirm mockup card amounts render as
  `₺`/`€` correctly, DemoVideo sits directly under Hero on mobile, and
  the Hero CTA is full-width with the play button tappable.

### Suggested A/B test (not set up — per request, just a note)
Run Hero+DemoVideo(mockup+play) vs. a variant with a real captured video
once one exists, 2 weeks, primary metric: hero CTA click-through rate;
secondary: scroll depth past the fold on mobile.
