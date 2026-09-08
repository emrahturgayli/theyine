import type { TenantPlan } from "@/lib/blokmate-data";
import type { BlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { formatCurrency } from "@/lib/blokmate-currency";

/**
 * Single source of truth for BlokMate's pricing tiers, read by the
 * Settings page's plan picker (app/blokmate/(app)/settings/page.tsx).
 * The marketing site's Pricing section (PricingSummary.tsx) has its own
 * localized copy in app/blokmate/locales/*.json instead — that content
 * needs full sentences per language, not just a price, so it isn't
 * driven from here.
 *
 * Prices are placeholders (Phase 6 ships the plan field + UI skeleton,
 * not real Stripe Billing subscriptions yet — see tenant_settings.plan,
 * migration 013) — update PLAN_PRICE below once real pricing is set;
 * nothing else needs to change. Price display is locale-aware
 * (formatCurrency: TR->TRY, EN/BG->EUR), same rule as everywhere else
 * money is shown in this app.
 */
export type PlanDefinition = {
  id: TenantPlan;
  name: string;
  priceLabel: string;
  tagline: string;
  features: string[];
};

const PLAN_PRICE: Record<Exclude<TenantPlan, "enterprise">, number> = {
  starter: 299,
  pro: 799,
};

const CONTACT_US: Record<BlokmateLanguage, string> = {
  tr: "Bize ulaşın",
  en: "Contact us",
  bg: "Свържете се с нас",
};

export function getBlokmatePlans(lang: BlokmateLanguage): PlanDefinition[] {
  return [
    {
      id: "starter",
      name: "Starter",
      priceLabel: `${formatCurrency(PLAN_PRICE.starter, lang)}/ay`,
      tagline: "Tek bina, küçük yönetimler için",
      features: ["1 bina, 20 daireye kadar", "Aidat & duyuru takibi", "E-posta desteği"],
    },
    {
      id: "pro",
      name: "Pro",
      priceLabel: `${formatCurrency(PLAN_PRICE.pro, lang)}/ay`,
      tagline: "Çoklu bina yöneten profesyonel yönetimler için",
      features: ["Sınırsız bina/daire", "Otomatik hatırlatıcılar & broadcast", "Öncelikli destek"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceLabel: CONTACT_US[lang],
      tagline: "Büyük portföyler ve özel entegrasyonlar için",
      features: ["Özel SLA", "Özel entegrasyonlar", "Atanmış hesap yöneticisi"],
    },
  ];
}
