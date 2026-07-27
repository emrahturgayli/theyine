// Uygulama genelinde paylaşılan veri modelleri.
// İleride gerçek bir DB'ye (Postgres/Supabase) geçildiğinde bu tipler şema referansı olur.

export type CampaignType = "menu" | "reservation" | "order";

export type AnalyticsEventName = "qr_view" | "qr_click" | "qr_conversion";

export interface QRCampaign {
  id: string;
  /** QR landing URL'inde kullanılan kısa kod: /r/[code] */
  code: string;
  merchantId: string;
  title: string;
  description: string;
  /**
   * Opsiyonel çeviriler — landing ?lang=bg|en|tr parametresiyle seçilir
   * (bkz. pages/r/[code].tsx). Eksik dil base title/description'a düşer.
   */
  titleI18n?: Partial<Record<"bg" | "en" | "tr", string>>;
  descriptionI18n?: Partial<Record<"bg" | "en" | "tr", string>>;
  type: CampaignType;
  /** Harici hedef URL (menü PDF'i, rezervasyon sistemi vb.). Boşsa dahili /r/[code] sayfası içerik gösterir. */
  targetUrl?: string;
  /** ISO tarih — geçmişse QR landing "süresi doldu" gösterir */
  expiresAt?: string;
  tags: string[];
  createdAt: string;
  active: boolean;
}

export interface AnalyticsEvent {
  id: string;
  qrId: string;
  merchantId: string;
  event: AnalyticsEventName;
  /** ISO timestamp */
  ts: string;
  meta?: Record<string, string>;
}

export interface Merchant {
  id: string;
  email: string;
  /** Demo amaçlı düz metin — production'da bcrypt hash kullan */
  password: string;
  restaurantName: string;
  city: string;
}

export interface QRStats {
  views: number;
  clicks: number;
  conversions: number;
}

export interface CampaignWithStats extends QRCampaign {
  stats: QRStats;
}
