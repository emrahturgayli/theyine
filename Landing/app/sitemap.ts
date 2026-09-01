import type { MetadataRoute } from "next";

const BASE_URL = "https://www.theyine.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/enterprise-qr", "/enterprise-tryon", "/rakip-analizi", "/blokmate", "/blokmate/blog"];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
