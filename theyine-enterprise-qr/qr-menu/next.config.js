/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // BG odaklı pazar: varsayılan dil Bulgarca, EN ikinci dil.
  // Next'in yerleşik i18n routing'i /en/... prefix'ini otomatik yönetir.
  i18n: {
    locales: ["bg", "en"],
    defaultLocale: "bg",
    localeDetection: false,
  },

  async headers() {
    return [
      {
        // Uygulama theyine.com'a iframe ile embed edilecek —
        // frame-ancestors ile sadece kendi domain'lerimize izin ver.
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://www.theyine.com https://theyine.com https://*.theyine.com http://localhost:*",
          },
        ],
      },
      {
        // QR landing embed.js ile herhangi bir merchant sitesine iframe'lenir —
        // genel frame-ancestors kısıtını bu rota için gevşet. (Aynı header
        // key'inde sonraki kural öncekini override eder.)
        source: "/r/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        // Analytics endpoint'i embed edilmiş landing'lerden çağrılır —
        // preflight dahil cross-origin POST'a izin ver.
        source: "/api/analytics/track",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        // Widget script'leri merchant sitelerinden yüklenecek — CORS serbest.
        source: "/theyine-qr-widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
