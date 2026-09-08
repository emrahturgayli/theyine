import Stripe from "stripe";

/**
 * Server-only Stripe client — STRIPE_SECRET_KEY must never reach the
 * browser, so this file is only ever imported from app/api/payments/*
 * route handlers, never from a "use client" component. Mirrors the
 * graceful-degradation convention in lib/blokmate.ts's
 * getBlokmateSupabase(): returns null when unconfigured instead of
 * throwing, so a route can respond with a clear "not configured" error
 * rather than crashing.
 */
let cachedStripe: Stripe | null | undefined;

export function getBlokmateStripe(): Stripe | null {
  if (cachedStripe !== undefined) return cachedStripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    cachedStripe = null;
    return cachedStripe;
  }

  // No explicit apiVersion pin — the installed `stripe` package's type
  // for this option is a literal tied to the SDK version (currently
  // "2026-08-26.dahlia"), which would silently go stale on every SDK
  // bump. Omitting it uses the account's configured default API version
  // instead (set in the Stripe Dashboard), same as most Stripe examples.
  cachedStripe = new Stripe(key);
  return cachedStripe;
}
