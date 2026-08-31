/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // /studio's API route (app/api/generate-video/route.ts) imports
  // @remotion/bundler + @remotion/renderer, which pull in native binaries
  // (@rspack, esbuild) and headless-Chrome machinery meant to run as plain
  // Node packages, not be statically webpack-bundled. Without this, Next's
  // build tries to parse those binaries as JS and fails outright.
  experimental: {
    serverComponentsExternalPackages: [
      "@remotion/bundler",
      "@remotion/renderer",
      "@remotion/media-parser",
      "@rspack/core",
      "esbuild",
    ],
  },
  async redirects() {
    return [
      // The try-on landing moved to /enterprise-tryon; keep old links alive.
      {
        source: "/shopify-virtual-try-on",
        destination: "/enterprise-tryon",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
