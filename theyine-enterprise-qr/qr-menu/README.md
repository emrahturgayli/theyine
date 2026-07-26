# THEYINE — Restoran QR Yönetimi (Enterprise QR)

Bulgaristan restoran pazarına yönelik, THEYINE markası altında çalışan **Restoran QR Yönetimi** subapp'i. Restoranlar menü, kampanya, rezervasyon ve sipariş akışlarını tek QR kod üzerinden yönetir. `theyine.com/enterprise-tryon` sayfasındaki mimariyle aynı desende çalışır: **ayrı deploy edilen enterprise modül → ana siteye iframe veya script widget ile embed**.

- **Dil:** BG (varsayılan) + EN, header'da dil değiştirici
- **Stack:** Next.js 14 (pages router) + TypeScript, bağımlılıksız sade CSS, `qrcode` (gerçek taranabilir QR)
- **Kullanıcılar:** Merchant (restoran sahibi → `/admin`) ve son müşteri (QR okutur → `/r/[code]`)

---

## Kurulum

```bash
npm install
cp .env.example .env.local   # değerleri doldur
npm run dev                  # http://localhost:3000
npm run build                # production build
```

**Demo giriş:** `demo@theyine.com` / `theyine123` (3 örnek kampanya ve 7 günlük demo analytics ile birlikte gelir).

## Vercel Deploy

1. Repo'yu GitHub'a push'la, Vercel'de **Import Project** → framework otomatik Next.js algılanır (`vercel.json` hazır).
2. **Environment Variables** bölümüne aşağıdaki değişkenleri ekle.
3. Deploy sonrası uygulama `https://enterprise-qr.theyine.vercel.app` gibi bir URL alır → `NEXT_PUBLIC_APP_URL` değerini bu URL yap ve redeploy et (QR kodların içine bu adres yazılır).

### Env Değişkenleri

| Değişken | Açıklama |
|---|---|
| `NEXT_PUBLIC_QR_BASE_URL` | Ana site (`https://www.theyine.com`) — pazarlama linkleri için |
| `NEXT_PUBLIC_APP_URL` | Bu subapp'in public URL'i; QR landing linkleri ve embed snippet'leri bundan üretilir |
| `QR_SIGNING_SECRET` | JWT imzalama anahtarı. **Production'da mutlaka** 32+ karakter rastgele değerle değiştir |
| `NEXT_PUBLIC_DEMO_VIDEO_URL` | Landing'deki demo video (YouTube linki veya `.mp4`). Boşsa placeholder gösterilir |
| `STRIPE_KEY` | İleride ödeme entegrasyonu için rezerve (şu an kullanılmıyor) |
| `TWILIO_SID`, `TWILIO_TOKEN` | İleride SMS/WhatsApp rezervasyon onayı için rezerve |

> **Not — veri katmanı:** `lib/db.ts` in-memory bir stub'tır; Vercel serverless'ta instance'lar arasında kalıcı değildir. Production'da fonksiyon gövdelerini Supabase/Postgres sorgularıyla değiştirin — imzalar (ve tüm API route'lar) aynı kalır.

### Deployment Checklist

- [ ] **Build kontrolü:** lokalde `npm run build` hatasız geçiyor (typecheck dahil).
- [ ] **`NEXT_PUBLIC_APP_URL`:** Vercel env'inde deploy sonrası aldığın public URL'e (veya custom domain'e) ayarlı ve redeploy edildi — QR kod içerikleri ve embed snippet'leri bu adresten üretilir.
- [ ] **Domain bağlama:** Vercel → Project → Settings → Domains'ten `qr.theyine.com` ekle; DNS'te `qr` CNAME kaydını `cname.vercel-dns.com`'a yönlendir. Sonra `NEXT_PUBLIC_APP_URL=https://qr.theyine.com` yapıp redeploy et.
- [ ] **embed.js entegrasyonu:** deploy sonrası aşağıdaki snippet'i herhangi bir test sayfasına ekleyip yüzen butonun çıktığını ve iframe'in açıldığını doğrula:

```html
<script
  src="https://qr.theyine.com/embed.js"
  data-campaign="CAMPAIGN_CODE"
  data-base-url="https://qr.theyine.com"
  data-theme="light"
  defer></script>
```

---

## Rotalar

| Rota | Ne yapar |
|---|---|
| `/` | Public landing: hero, özellikler, demo video, CTA |
| `/r/[code]` | **QR landing** — müşterinin QR okutunca gördüğü açık temalı, mobil öncelikli sayfa. SSR'da `qr_view` kaydedilir |
| `/admin` | Dashboard: aktif kodlar, toplam tarama/klik/dönüşüm, son 7 gün grafiği |
| `/admin/campaigns` | QR oluşturma formu + kampanya listesi + QR önizleme/indirme |
| `/admin/settings` | Merchant bilgileri + hazır embed snippet'leri |
| `/admin/login` | Merchant girişi (JWT) |

## API

Tüm korumalı endpoint'ler `Authorization: Bearer <token>` bekler (token: `POST /api/auth/login`).

| Endpoint | Auth | Açıklama |
|---|---|---|
| `POST /api/auth/login` | — | `{ email, password }` → `{ token, merchantId, restaurantName }` |
| `POST /api/qr` | ✔ | Yeni QR kampanyası: `{ title, description?, type: menu\|reservation\|order, targetUrl?, expiresAt?, tags?, code? }` |
| `GET /api/qr/:id` | ✔ | Tek kampanya detayı (sadece sahibi görebilir) |
| `GET /api/qr/list` | ✔ | Merchant'ın tüm kampanyaları + istatistikler + `last7` (grafik verisi) |
| `POST /api/analytics/track` | — | `{ code, event: qr_view\|qr_click\|qr_conversion, meta? }` — QR landing'den public çağrılır |

---

## Theyine ana sitesine embed

TryOn modülüyle aynı desen: subapp bağımsız deploy edilir, ana site yalnızca embed eder. `next.config.js` içindeki `frame-ancestors` CSP'si sadece `theyine.com` (+ localhost) altında iframe'e izin verir.

### 1) Iframe embed

```html
<iframe
  src="https://enterprise-qr.theyine.vercel.app/?merchant=MERCHANT_ID&embed=1"
  width="100%"
  height="800"
  loading="lazy"
  frameborder="0"
  style="border:0;border-radius:12px"
  title="THEYINE QR"></iframe>
```

- `embed=1` parametresi subapp'in kendi header/footer'ını gizler (iframe içinde temiz görünüm).
- **Önerilen boyut:** `width: 100%`, `height: 800px` desktop; mobilde container'ı `min-height: 100vh` yapıp iframe'i `height: 100%` bırakın. Responsive için iframe'i şu wrapper'a alın:

```html
<div style="position:relative;width:100%;min-height:800px">
  <iframe src="..." style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>
</div>
```

### 2) Script widget

Merchant kendi sitesine tek satır ekler; sağ altta yüzen bir "QR" butonu çıkar, tıklanınca yönetim paneli modal iframe'de açılır:

```html
<script
  src="https://enterprise-qr.theyine.vercel.app/theyine-qr-widget.js"
  data-merchant="MERCHANT_ID"
  defer></script>
```

Her iki snippet de **Admin → Ayarlar** sayfasında merchant ID'siyle doldurulmuş halde, tek tıkla kopyalanabilir durur.

### 3) Enterprise Widget Integration (`embed.js`)

Yönetim panelini değil, **tek bir kampanyanın QR landing'ini** (`/r/[code]`) müşteri-facing bir widget olarak herhangi bir siteye ekler. Sağ altta yüzen buton çıkar; tıklanınca landing bir iframe panelde açılır (iframe ilk tıklamada lazy yüklenir):

```html
<script
  src="https://qr.theyine.com/embed.js"
  data-campaign="CAMPAIGN_CODE"
  data-base-url="https://qr.theyine.com"
  data-theme="light"
  defer></script>
```

| Attribute | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|
| `data-campaign` | ✔ | — | Kampanya kodu (`/r/[code]` içindeki `code`) |
| `data-base-url` | — | `https://qr.theyine.com` | Subapp'in public URL'i |
| `data-theme` | — | `light` | `light` \| `dark` — iframe URL'ine `theme` parametresi olarak geçer; `dark` seçilirse landing koyu temada render edilir |
| `data-label-open` / `data-label-close` | — | `Menüyü Gör` / `Kapat` | Buton metinleri (host sitenin diline göre) |

Embed modunda (`?embed=true`) landing'deki CTA dış linkleri `_blank` olarak açar; normal modda aynı sayfada yönlendirir. `targetUrl` olmayan kampanyalarda iç menü placeholder'ı gösterilir. `next.config.js` bu rota için `frame-ancestors *` uygular, yani widget her sitede çalışır (yönetim paneli theyine.com kısıtına tabi kalmaya devam eder).

---

## Analytics & GA4

Event isimleri: **`qr_view`** (sayfa açıldı), **`qr_click`** (CTA tıklandı), **`qr_conversion`** (rezervasyon/sipariş tamamlandı).

- `qr_view` SSR sırasında server-side, `qr_click` client-side (`keepalive: true` ile, navigasyonu bloklamadan) kaydedilir.
- Kayıt şu an `lib/db.ts` stub'ına yazılır.

**GA4'e forward etmek için:** `pages/api/analytics/track.ts` içinde, event DB'ye yazıldıktan sonra [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)'e bir `fetch` ekleyin:

```ts
await fetch(
  `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_SECRET}`,
  {
    method: "POST",
    body: JSON.stringify({
      client_id: crypto.randomUUID(),
      events: [{ name: event, params: { qr_code: code, merchant_id: campaign.merchantId } }],
    }),
  }
);
```

`GA4_ID` (measurement ID) ve `GA4_SECRET` (api secret) değerlerini env'e ekleyin. Böylece QR eventleri hem kendi DB'nizde hem GA4 raporlarında görünür.

---

## Demo video & SEO

- Landing'deki `components/DemoVideo.tsx` **facade** deseni kullanır: sayfa yüklenirken sadece poster + play butonu render edilir, iframe/video ancak tıklanınca yüklenir (LCP korunur). Ana sitedeki `DemoVideo` ile aynı yaklaşım.
- Video kaynağı `NEXT_PUBLIC_DEMO_VIDEO_URL`: YouTube linki (`https://youtu.be/XXXX`) veya doğrudan `.mp4` URL'i olabilir — `lib/video.ts` parser'ı ikisini de tanır.
- YouTube linki verildiğinde `pages/index.tsx` otomatik olarak **schema.org `VideoObject`** structured data enjekte eder (video rich result için):

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "THEYINE — Restaurant QR Management Demo",
  "description": "How restaurants manage menus, campaigns and reservations through one QR code.",
  "thumbnailUrl": "https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg",
  "uploadDate": "2026-07-25",
  "embedUrl": "https://www.youtube-nocookie.com/embed/VIDEO_ID",
  "publisher": { "@type": "Organization", "name": "THEYINE" }
}
```

Elle `<video>` embed etmek isterseniz:

```html
<video src="/theyine-demo-30s.mp4" controls playsinline poster="/demo-poster.jpg" style="width:100%;border-radius:12px"></video>
```

---

## PWA / "app hissiyatı"

- `public/manifest.json` hazır (`display: standalone`, `start_url: /admin`, koyu tema) ve `_document.tsx`'ten bağlı. `public/icon-192.png` ve `public/icon-512.png` eklemeniz yeterli.
- Tam offline destek için `next-pwa` paketiyle service worker eklenebilir:

```bash
npm i next-pwa
```

```js
// next.config.js
const withPWA = require("next-pwa")({ dest: "public", disable: process.env.NODE_ENV === "development" });
module.exports = withPWA(nextConfig);
```

- Manifest sayesinde merchant, paneli telefonda **Ana ekrana ekle** ile app gibi kullanabilir (standalone, adres çubuğu yok). QR landing zaten mobil öncelikli tasarlandı — müşteri tarafında kurulum gerektirmez.

---

## Dosya Haritası

```
qr-menu/
├─ pages/
│  ├─ index.tsx              # Public landing (hero + demo video + VideoObject SEO)
│  ├─ r/[code].tsx           # QR landing (müşteri, SSR + qr_view tracking)
│  ├─ admin/
│  │  ├─ index.tsx           # Dashboard (statlar + 7 gün grafiği)
│  │  ├─ campaigns.tsx       # QR oluşturma + liste + önizleme
│  │  ├─ settings.tsx        # Embed snippet'leri
│  │  └─ login.tsx           # Merchant login
│  └─ api/
│     ├─ auth/login.ts       # JWT üretimi
│     ├─ qr/index.ts         # POST /api/qr
│     ├─ qr/[id].ts          # GET /api/qr/:id
│     ├─ qr/list.ts          # GET /api/qr/list
│     └─ analytics/track.ts  # POST /api/analytics/track
├─ components/
│  ├─ Layout.tsx             # Header/footer (+embed modu)
│  ├─ AdminLayout.tsx        # Admin nav + auth guard + apiFetch
│  ├─ QRPreview.tsx          # Taranabilir QR + PNG indirme
│  ├─ DemoVideo.tsx          # Facade video player
│  ├─ StatsChart.tsx         # 7 günlük bar chart
│  ├─ LanguageSwitcher.tsx   # BG/EN
│  └─ Toast.tsx              # Bildirimler
├─ lib/
│  ├─ types.ts  ├─ db.ts     # Veri modeli + in-memory stub DB
│  ├─ auth.ts   ├─ i18n.ts   # JWT + çeviri katmanı
│  └─ video.ts               # YouTube/mp4 parser (ana site ile ortak sözleşme)
├─ locales/bg.json, en.json  # Çeviriler
├─ public/theyine-qr-widget.js  # Floating widget — yönetim paneli (script embed)
├─ public/embed.js           # Floating widget — kampanya landing'i (/r/[code])
├─ public/manifest.json      # PWA manifest
├─ next.config.js            # i18n + frame-ancestors CSP
└─ vercel.json               # Deploy + API CORS header'ları
```
