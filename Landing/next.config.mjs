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
    // @remotion/bundler's `entryPoint` (src/remotion/index.ts, which pulls
    // in Root.tsx and everything under src/remotion) is a runtime string,
    // not a static `import` — Next's output file tracing only bundles files
    // it can see referenced via actual imports, so without this the whole
    // src/remotion tree is silently left out of the deployed function and
    // webpack fails at runtime with "Module not found: Can't resolve
    // './Root'" (it's just not there in /var/task).
    outputFileTracingIncludes: {
      "/api/generate-video": ["./src/remotion/**/*"],
    },
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
