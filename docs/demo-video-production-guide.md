# 🎬 THEYINE QR — Demo Videosu Üretim Rehberi (v1.1 — FINAL)

Premium restoranlara (pilot: **The Quiet Corner**) sunulacak satış demo videosu için uçtan uca üretim planı.
Toplam süre **1:50** · 7 sahne · 16:9 1920×1080 · Tüm ekran akışları production'da otomatik testlerle doğrulanmıştır.

> **Kişiselleştirme hazır:** `quiet-corner-reserve` kampanyası ve "The Quiet Corner" merchant'ı seed'dedir.
> Landing: `https://qr.theyine.com/r/quiet-corner-reserve` — başlıkta müşterinin kendi adı görünür.
> Admin (kişiselleştirilmiş dashboard): `quietcorner@theyine.com / theyine123`

---

## 0) Çekim Öncesi Kontrol Listesi

- [ ] Temiz Chrome profili, 1920×1080, %100 zoom, bildirimler kapalı
- [ ] Kayıt aracı 60fps + cursor highlight açık
- [ ] Sekme A: `www.theyine.com/enterprise-qr` (kapalı — açılış kayıtta)
- [ ] Sekme B: `qr.theyine.com/en/admin` — `quietcorner@theyine.com / theyine123` ile giriş yapılmış
- [ ] Telefon: ekran kaydı hazır, parlaklık %80 sabit
- [ ] ⚠️ In-memory veri: S4'ün önce/sonra sayaç karşılaştırması aynı seansta, arka arkaya çekilir

## 1) Sahne Planı ve Süreler

| Sahne | İçerik | Süre | Kümülatif |
|---|---|---|---|
| S1 | Restoran atmosferi (gerçek çekim) | 15 sn | 0:15 |
| S2 | Widget canlı gösterimi (ekran) | 17 sn | 0:32 |
| S3 | Müşteri deneyimi (çekim + telefon ekranı) | 20 sn | 0:52 |
| S4 | Admin analitik (ekran, split) | 20 sn | 1:12 |
| S5 | Dark mode + dil (ekran) | 14 sn | 1:26 |
| S6 | Teknik güven (DevTools) | 12 sn | 1:38 |
| S7 | Kapanış + CTA kartı | 12 sn | **1:50** |

## 2) Gerçek Çekim Yönergeleri (S1, S3-A, S7)

**S1 — Atmosfer (0:00–0:15)**
- 24fps, 35mm eşdeğeri, f/1.8–2.8. Plan 1: 8 sn dolly-in, salon geniş planı, bel hizası. Plan 2: tabak servisi, 85mm yakın. Plan 3: garsonun telefonuna rack focus.
- Işık: ortam + 1 yumuşak dolgu (2700–3000K, altın-amber). Mum/pendant bokeh kadrajda.
- Kompozisyon: üçler kuralı, masalar diyagonal derinlikte. Yüzler tanınmaz veya izinli.

**S3-A — Masada QR (0:32–0:40)**
- Mat siyah/ceviz QR standı; el telefonu kadraja sokar; 45° üstten, stand + telefon aynı karede. Ekran parlaması için polarize filtre.
- Standdaki QR: `https://qr.theyine.com/r/quiet-corner-reserve` içerikli **gerçek taranabilir** kod (admin → kampanya → QR indir). Siyah-beyaz, köşede küçük THEYINE logosu — premium masada renkli QR kullanmayın.

**S7 — Kapanış (1:38–1:50)**
- S1 salonunun akşam hali (mumlar yanık), 6 sn statik geniş plan → 1,5 sn kararma → logo kartı. Işık S1'den bir stop düşük, sıcaklık aynı.

## 3) Ekran Kaydı Talimatları (S2, S3-B, S4, S5, S6)

**S2 (0:15–0:32):** `www.theyine.com/enterprise-qr` aç → **3 sn bekle** (widget idle-inject; beklemeyi kesme — "sayfayı yavaşlatmaz" kanıtı) → imleç 1,5 sn'de butona → hover'da 1 sn → tıkla → panel açık 2 sn sabit.

**S3-B (0:40–0:52), telefonda:** `qr.theyine.com/r/quiet-corner-reserve` aç → 2 sn → mikro kaydırma → CTA **"Резервирай маса →"** dokun → yeni sekme `theyine.com/#contact` iletişime kayana dek (~4 sn). Landing başlığında **THE QUIET CORNER / Chef's Tasting Evening** görünür.

**S4 (0:52–1:12), iki kayıt:** (A) CTA tıklaması; (B) `qr.theyine.com/en/admin` (quietcorner hesabı) → tıklamadan hemen sonra **F5** → sayaçlar + 7 gün grafiği. CTA'ya 2–3 kez tıklayın; artış belirgin olsun. Aynı seansta çekin.

**S5 (1:12–1:26):** Panel kapalı → navbar tema ikonu → sayfa koyulaşır (tam ekran kalsın) → **F5** → 3 sn → "Menüyü Gör" → panel koyu temada → 2 sn → dil pill'i (🌐) → **EN** → hero değişimi 2 sn.

**S6 (1:26–1:38):** DevTools (koyu, sağa dock, Network, filtre `qr.theyine.com`) → yenile → widget aç → CTA tıkla. Vurgulanacak satırlar: `embed.js` (200) · `/r/quiet-corner-reserve?embed=true&theme=dark` (200) · `POST /api/analytics/track` (200).

## 4) Overlay Metinleri

| # | Zaman | TR | EN |
|---|---|---|---|
| 1 | 0:08 | Modern restoranlar için dijital dönüşüm | Digital transformation for modern restaurants |
| 2 | 0:20 | Tek satır kod. Her web sitesine. | One line of code. Any website. |
| 3 | 0:36 | Taramadan rezervasyona — 10 saniye | Scan to reservation — 10 seconds |
| 4 | 0:56 | Görüntüleme → Tıklama → Dönüşüm. Gerçek zamanlı. | View → Click → Conversion. In real time. |
| 5 | 1:14 | Markanıza ve misafirinize uyum sağlar | Adapts to your brand and your guest |
| 6 | 1:28 | Kendi altyapınız. Tek domain. Kurumsal güvenlik. | Your infrastructure. One domain. Enterprise-grade. |
| 7 | 1:40 | Restoranınız için tam otomatik QR rezervasyon ve kampanya sistemi | Fully automated QR reservations & campaigns for your restaurant |
| 8 | 1:43 | Menü → Kampanya → Rezervasyon. Tek kod. | Menu → Campaign → Reservation. One code. |
| 9 | 1:46 | Bugün ücretsiz demo kurulum yapalım. · theyine.com/enterprise-qr | Let's set up your free demo today. · theyine.com/enterprise-qr |

Yalnızca Quiet Corner kopyasında son karta: *"Prepared for The Quiet Corner"*.

## 5) Seslendirme (final)

Sakin-otoriter "danışman" tonu, ~140 kelime/dk.

| Sahne | TR | EN |
|---|---|---|
| S1 | Mükemmel bir servis, detaylarda gizlidir. Peki menünüz, rezervasyonlarınız ve kampanyalarınız da aynı özenle yönetiliyor mu? | Great service lives in the details. Do your menu, reservations and campaigns get the same care? |
| S2 | THEYINE QR, web sitenize tek satır kodla eklenir. Misafiriniz tek dokunuşla menünüze ve kampanyalarınıza ulaşır — sitenizin hızından ve tasarımından hiçbir şey çalmadan. | THEYINE QR is added to your website with a single line of code. One tap brings your guest to your menu and campaigns — without costing your site any speed or elegance. |
| S3 | Misafir deneyimi bu kadar basit: tara, incele, rezerve et. Uygulama yok, üyelik yok, bekleme yok. | The guest experience is this simple: scan, browse, reserve. No app, no sign-up, no waiting. |
| S4 | Siz ise her şeyi anlık görürsünüz. Hangi kampanya kaç kez tarandı, kaç misafir menüyü açtı, kaçı rezervasyona dönüştü — tek panelde, gerçek zamanlı. | And you see everything as it happens. Every scan, every click, every reservation — one dashboard, in real time. |
| S5 | Karanlık tema, çoklu dil — sistem misafirinize uyum sağlar, tersi değil. | Dark mode, multiple languages — the system adapts to your guest, not the other way around. |
| S6 | Teknik ekipler için: tüm zincir tek kurumsal domain üzerinde, güvenlik başlıklarıyla çalışır. IT onayı için sürpriz yok. | For your technical team: the entire chain runs on one corporate domain, with proper security headers. No surprises at IT review. |
| S7 | THEYINE QR. Menüden rezervasyona, tek kodla, tamamen otomatik. Seçkin restoranlar için tasarlandı. Bugün ücretsiz demo kurulumunuzu yapalım. | THEYINE QR. From menu to reservation — one code, fully automated. Designed for distinguished restaurants. Let's set up your free demo today. |

## 6) Post-Prodüksiyon

- Geçişler: 12–18 kare cross-dissolve; S1→S2 match-cut (telefon parlaklığı → sayfa beyazı); S6→S7 sert kesme (teknik→duygusal kontrast).
- Hız: panel açılışı %50, tema geçişi %70, kalan %100 (60fps kaynak).
- Vurgular: Network/URL için yuvarlatılmış kutu (lavender #7C3AED, 2px, %60) + arka plan karartma. S4 sayaç: değeri 1,2× büyüt-geri indir; flaş yok.
- Overlay'ler: alt üçte-bir, fade-up 24px/300ms (sitenin `fade-up` eğrisi).
- SFX: panel "whoosh" (-24dB), sayaç "tick". Başka SFX yok.

## 7) Renk, Tipografi, Müzik

- **Palet:** Lavender `#7C3AED` (vurgu) · Ink `#1F1827` (metin) · Lavender-tint `#F1EEFE` (açık zemin) · koyu sahneler: Canvas `#111014` + Lavender `#A78BFA`. Restoran altın-amber'inden ekran sahnesine geçişte sıcaklığı ~300K düşür.
- **Tipografi:** Inter — overlay SemiBold, letter-spacing `-0.04em`; CTA kartı Bold.
- **Müzik:** Minimal neo-klasik piyano + analog pad, 70–85 BPM, S7'de string yükselmesi. Arama: "minimal piano corporate elegant", "neoclassical ambient luxury".

## 8) Sosyal Medya 45 sn Varyantı

Kesim: **S2 (12) → S3 (14) → S4 (10) → S7 (9)**. İlk 3 sn: panel açılış anı cold-open (hook). Overlay #2, #3, #4, #9 kalır; VO yalnız S3+S4. Formatlar: 16:9 (LinkedIn/YouTube) + 9:16 (Instagram/TikTok — widget sağ altta olduğundan dikey kırpım sağ yarıdan).

## 9) Dürüstlük Notu

"Sipariş → mutfak → garson → teslim tamamen dijital" iddiası videoda **yer almaz** — bu akış üründe henüz yok. İstenirse kapanışa *"Sipariş yönetimi — çok yakında / Order management — coming soon"* rozeti eklenebilir.
