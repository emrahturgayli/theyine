/**
 * THEYINE QR Embed Widget — kampanya landing'ini (/r/[code]) herhangi bir
 * merchant sitesine yüzen buton + iframe olarak ekler. Bağımlılıksız,
 * tüm stiller inline — host sitenin CSS'ine karışmaz.
 *
 * Kullanım:
 *   <script src="https://qr.theyine.com/embed.js"
 *           data-campaign="CAMPAIGN_CODE"
 *           data-base-url="https://qr.theyine.com"   (opsiyonel)
 *           data-theme="light"                        (opsiyonel: light|dark)
 *           defer></script>
 */
(function () {
  "use strict";

  // --- 1) Script tag'inden konfigürasyonu oku ---
  // document.currentScript defer/async yüklemede de çalışır; querySelector
  // fallback'i script'in dinamik inject edildiği kenar durumlar için.
  var script =
    document.currentScript ||
    document.querySelector("script[data-campaign][src*='embed.js']");
  if (!script) return;

  var campaignCode = script.getAttribute("data-campaign");
  if (!campaignCode) return; // kampanya kodu olmadan widget anlamsız

  var baseUrl = script.getAttribute("data-base-url") || "https://qr.theyine.com";
  var theme = script.getAttribute("data-theme") || "light";
  // Buton metinleri host sitenin diline göre override edilebilir
  var labelOpen = script.getAttribute("data-label-open") || "Menüyü Gör";
  var labelClose = script.getAttribute("data-label-close") || "Kapat";

  // Iframe'in yükleyeceği embed URL'i: {baseUrl}/r/{code}?embed=true&theme={theme}
  var embedUrl =
    baseUrl.replace(/\/+$/, "") +
    "/r/" +
    encodeURIComponent(campaignCode) +
    "?embed=true&theme=" +
    encodeURIComponent(theme);

  // --- 2) Sağ altta sabitlenen container ---
  // Yüksek z-index host sitenin elemanlarının üstünde kalmasını sağlar.
  var container = document.createElement("div");
  container.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483000;" +
    "display:flex;flex-direction:column;align-items:flex-end;" +
    "font-family:system-ui,sans-serif;";

  // --- 3) Iframe — başlangıçta gizli; src ilk açılışta atanır (lazy load),
  // böylece widget'a hiç tıklanmazsa host sayfa ekstra istek yapmaz. ---
  var iframe = document.createElement("iframe");
  iframe.title = "THEYINE QR Menu";
  iframe.style.cssText =
    "display:none;width:360px;height:600px;" +
    "max-width:calc(100vw - 40px);max-height:calc(100vh - 110px);" + // küçük ekranlarda taşmasın
    "border:none;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.15);" +
    "margin-bottom:12px;background:#fff;transition:opacity 0.3s ease;";

  // --- 4) Aç/kapa butonu ---
  var btn = document.createElement("button");
  btn.type = "button";
  btn.innerText = labelOpen;
  btn.setAttribute("aria-expanded", "false");
  btn.style.cssText =
    "background:#111;color:#fff;padding:14px 28px;border:none;" +
    "border-radius:8px;cursor:pointer;font-weight:600;font-size:15px;" +
    "box-shadow:0 4px 12px rgba(0,0,0,0.1);";

  // --- 5) Toggle davranışı ---
  btn.onclick = function () {
    var isHidden = iframe.style.display === "none";
    if (isHidden && !iframe.dataset.loaded) {
      iframe.src = embedUrl; // ilk açılışta yükle, sonraki toggle'larda koru
      iframe.dataset.loaded = "true";
    }
    iframe.style.display = isHidden ? "block" : "none";
    btn.innerText = isHidden ? labelClose : labelOpen;
    btn.setAttribute("aria-expanded", String(isHidden));
  };

  // --- 6) DOM'a ekle — body henüz hazır değilse (script <head>'de ise) bekle ---
  container.appendChild(iframe);
  container.appendChild(btn);
  if (document.body) {
    document.body.appendChild(container);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      document.body.appendChild(container);
    });
  }
})();
