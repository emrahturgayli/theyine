// Basit in-memory veri katmanı (stub).
// Vercel serverless ortamında instance'lar arasında KALICI DEĞİLDİR — demo ve
// geliştirme içindir. Production'da bu dosyadaki fonksiyonların gövdesini
// Supabase/Postgres/PlanetScale sorgularıyla değiştirmek yeterli; imzalar sabit kalır.

import type {
  AnalyticsEvent,
  AnalyticsEventName,
  CampaignWithStats,
  Merchant,
  QRCampaign,
} from "./types";

interface Store {
  merchants: Map<string, Merchant>;
  campaigns: Map<string, QRCampaign>;
  events: AnalyticsEvent[];
}

// Hot-reload'da state kaybolmasın diye globalThis üzerinde cache'le
const g = globalThis as unknown as { __theyineQrStore?: Store };

function seed(): Store {
  const merchants = new Map<string, Merchant>();
  merchants.set("demo-merchant", {
    id: "demo-merchant",
    email: "demo@theyine.com",
    password: "theyine123",
    restaurantName: "Ресторант София Гардън",
    city: "Sofia",
  });

  const now = Date.now();
  const day = 86_400_000;
  const campaigns = new Map<string, QRCampaign>();
  const demo: QRCampaign[] = [
    {
      id: "qr_demo_menu",
      code: "sofia-menu",
      merchantId: "demo-merchant",
      title: "Дигитално меню / Digital Menu",
      description: "Пълното ни меню — ястия, напитки и десерти.",
      type: "menu",
      targetUrl: "",
      tags: ["menu", "main"],
      createdAt: new Date(now - 20 * day).toISOString(),
      active: true,
    },
    {
      id: "qr_demo_happy",
      code: "happy-hour",
      merchantId: "demo-merchant",
      title: "Happy Hour −20%",
      description: "Всеки ден 16:00–18:00 — 20% отстъпка на всички коктейли.",
      type: "menu",
      targetUrl: "",
      expiresAt: new Date(now + 30 * day).toISOString(),
      tags: ["campaign", "drinks"],
      createdAt: new Date(now - 10 * day).toISOString(),
      active: true,
    },
    {
      // theyine.com /enterprise-qr ve /enterprise-tryon sayfalarındaki embed
      // widget'ın gösterdiği kalıcı demo kampanyası (Landing lib/qr.ts →
      // QR_DEMO_CAMPAIGN). Seed'de olmalı — admin'den oluşturulan kampanyalar
      // in-memory stub'da instance geri dönüşümünde kaybolur.
      id: "qr_demo_widget",
      code: "happy-hour-20-demo-2ohl",
      merchantId: "demo-merchant",
      title: "Happy Hour −20%",
      description: "Всеки ден 16:00–18:00 — 20% отстъпка на всички коктейли.",
      // CTA rezervasyon akışını demo eder: ana sitedeki iletişim/rezervasyon
      // bölümüne gider (dış hedef olduğu için tıklama qr_conversion sayılır).
      type: "reservation",
      targetUrl: "https://www.theyine.com/#contact",
      tags: ["campaign", "widget-demo"],
      createdAt: new Date(now - 2 * day).toISOString(),
      active: true,
    },
    {
      id: "qr_demo_rezv",
      code: "book-table",
      merchantId: "demo-merchant",
      title: "Резервирай маса / Book a table",
      description: "Онлайн резервация за 2–10 души.",
      type: "reservation",
      targetUrl: "https://www.theyine.com",
      tags: ["reservation"],
      createdAt: new Date(now - 5 * day).toISOString(),
      active: true,
    },
  ];
  demo.forEach((c) => campaigns.set(c.id, c));

  // Son 7 gün için gerçekçi görünen demo event'leri üret (deterministik)
  const events: AnalyticsEvent[] = [];
  let n = 0;
  for (const c of demo) {
    for (let d = 6; d >= 0; d--) {
      const views = ((d * 7 + c.id.length * 3) % 9) + 4;
      for (let i = 0; i < views; i++) {
        const ts = new Date(now - d * day - i * 3_600_000).toISOString();
        events.push({ id: `ev_${n++}`, qrId: c.id, merchantId: c.merchantId, event: "qr_view", ts });
        if (i % 2 === 0)
          events.push({ id: `ev_${n++}`, qrId: c.id, merchantId: c.merchantId, event: "qr_click", ts });
        if (i % 5 === 0)
          events.push({ id: `ev_${n++}`, qrId: c.id, merchantId: c.merchantId, event: "qr_conversion", ts });
      }
    }
  }

  return { merchants, campaigns, events };
}

function store(): Store {
  if (!g.__theyineQrStore) g.__theyineQrStore = seed();
  return g.__theyineQrStore;
}

// ---- Merchant ----

export function findMerchantByEmail(email: string): Merchant | undefined {
  return [...store().merchants.values()].find(
    (m) => m.email.toLowerCase() === email.toLowerCase()
  );
}

export function getMerchant(id: string): Merchant | undefined {
  return store().merchants.get(id);
}

// ---- Campaigns ----

export function createCampaign(
  data: Omit<QRCampaign, "id" | "code" | "createdAt" | "active"> & { code?: string }
): QRCampaign {
  const id = `qr_${Math.random().toString(36).slice(2, 10)}`;
  const code =
    data.code?.trim() ||
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) + "-" + id.slice(3, 7);
  const campaign: QRCampaign = {
    ...data,
    id,
    code,
    createdAt: new Date().toISOString(),
    active: true,
  };
  store().campaigns.set(id, campaign);
  return campaign;
}

export function getCampaign(id: string): QRCampaign | undefined {
  return store().campaigns.get(id);
}

export function getCampaignByCode(code: string): QRCampaign | undefined {
  return [...store().campaigns.values()].find((c) => c.code === code);
}

export function listCampaigns(merchantId: string): CampaignWithStats[] {
  const events = store().events;
  return [...store().campaigns.values()]
    .filter((c) => c.merchantId === merchantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => {
      const mine = events.filter((e) => e.qrId === c.id);
      return {
        ...c,
        stats: {
          views: mine.filter((e) => e.event === "qr_view").length,
          clicks: mine.filter((e) => e.event === "qr_click").length,
          conversions: mine.filter((e) => e.event === "qr_conversion").length,
        },
      };
    });
}

// ---- Analytics ----

export function trackEvent(
  qrId: string,
  merchantId: string,
  event: AnalyticsEventName,
  meta?: Record<string, string>
): AnalyticsEvent {
  const e: AnalyticsEvent = {
    id: `ev_${Math.random().toString(36).slice(2, 10)}`,
    qrId,
    merchantId,
    event,
    ts: new Date().toISOString(),
    meta,
  };
  store().events.push(e);
  return e;
}

/** Son 7 günün günlük tarama (qr_view) sayıları — grafik için. index 0 = 6 gün önce, 6 = bugün */
export function last7DayViews(merchantId: string): number[] {
  const out = [0, 0, 0, 0, 0, 0, 0];
  const now = Date.now();
  for (const e of store().events) {
    if (e.merchantId !== merchantId || e.event !== "qr_view") continue;
    const age = Math.floor((now - Date.parse(e.ts)) / 86_400_000);
    if (age >= 0 && age <= 6) out[6 - age]++;
  }
  return out;
}
