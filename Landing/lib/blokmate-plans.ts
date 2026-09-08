import type { TenantPlan } from "@/lib/blokmate-data";

/**
 * Single source of truth for BlokMate's pricing tiers — read by both the
 * Settings page's plan picker (app/blokmate/(app)/settings/page.tsx) and
 * the marketing site's Pricing section (app/blokmate/components/PricingSummary.tsx).
 * Prices are placeholders (Phase 6 ships the plan field + UI skeleton,
 * not real Stripe Billing subscriptions yet — see tenant_settings.plan,
 * migration 013) — update the numbers here once real pricing is set;
 * nothing else needs to change.
 */
export type PlanDefinition = {
  id: TenantPlan;
  name: string;
  priceLabel: string;
  tagline: string;
  features: string[];
};

export const BLOKMATE_PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    priceLabel: "₺299/ay",
    tagline: "Tek bina, küçük yönetimler için",
    features: ["1 bina, 20 daireye kadar", "Aidat & duyuru takibi", "E-posta desteği"],
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "₺799/ay",
    tagline: "Çoklu bina yöneten profesyonel yönetimler için",
    features: ["Sınırsız bina/daire", "Otomatik hatırlatıcılar & broadcast", "Öncelikli destek"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Bize ulaşın",
    tagline: "Büyük portföyler ve özel entegrasyonlar için",
    features: ["Özel SLA", "Özel entegrasyonlar", "Atanmış hesap yöneticisi"],
  },
];
