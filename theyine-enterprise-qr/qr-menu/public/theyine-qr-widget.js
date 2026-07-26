/**
 * THEYINE QR Widget — merchant kendi sitesine tek satırla ekler:
 *
 *   <script src="https://enterprise-qr.theyine.vercel.app/theyine-qr-widget.js"
 *           data-merchant="MERCHANT_ID" defer></script>
 *
 * Sayfanın sağ altına yüzen bir "QR" butonu ekler; tıklanınca QR yönetim
 * uygulamasını modal bir iframe içinde açar. Bağımlılıksız, ~2 KB, tüm
 * stiller inline — host sitenin CSS'ine karışmaz.
 */
(function () {
  "use strict";

  var script =
    document.currentScript ||
    document.querySelector("script[data-merchant][src*='theyine-qr-widget']");
  if (!script) return;

  var merchant = script.getAttribute("data-merchant") || "";
  var origin = new URL(script.src).origin;
  var appUrl =
    origin + "/?merchant=" + encodeURIComponent(merchant) + "&embed=1";

  // --- Yüzen buton ---
  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "THEYINE QR Management");
  btn.innerHTML =
    '<span style="font-size:20px;line-height:1">▦</span><span>QR</span>';
  applyStyles(btn, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "2147483000",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 18px",
    borderRadius: "999px",
    border: "0",
    background: "#f59e0b",
    color: "#0a0a0a",
    fontFamily: "system-ui, sans-serif",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,.35)",
  });

  // --- Modal + iframe (ilk tıklamada lazy oluşturulur) ---
  var overlay = null;

  function openModal() {
    if (!overlay) {
      overlay = document.createElement("div");
      applyStyles(overlay, {
        position: "fixed",
        inset: "0",
        zIndex: "2147483001",
        background: "rgba(0,0,0,.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      });

      var frameWrap = document.createElement("div");
      applyStyles(frameWrap, {
        position: "relative",
        width: "min(1100px, 100%)",
        height: "min(800px, 100%)",
        background: "#0a0a0a",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,.6)",
      });

      var close = document.createElement("button");
      close.textContent = "✕";
      close.setAttribute("aria-label", "Close");
      applyStyles(close, {
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: "1",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "0",
        background: "rgba(255,255,255,.12)",
        color: "#fff",
        fontSize: "16px",
        cursor: "pointer",
      });
      close.addEventListener("click", closeModal);

      var iframe = document.createElement("iframe");
      iframe.src = appUrl;
      iframe.loading = "lazy";
      iframe.title = "THEYINE QR Management";
      applyStyles(iframe, { width: "100%", height: "100%", border: "0" });

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeModal();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeModal();
      });

      frameWrap.appendChild(close);
      frameWrap.appendChild(iframe);
      overlay.appendChild(frameWrap);
      document.body.appendChild(overlay);
    }
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (overlay) overlay.style.display = "none";
    document.body.style.overflow = "";
  }

  function applyStyles(el, styles) {
    for (var k in styles) el.style[k] = styles[k];
  }

  btn.addEventListener("click", openModal);

  if (document.body) {
    document.body.appendChild(btn);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      document.body.appendChild(btn);
    });
  }
})();
