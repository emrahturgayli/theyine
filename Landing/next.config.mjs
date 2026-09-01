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
      "@remotion/captions",
      "@remotion/transitions",
      "remotion",
      "@sparticuz/chromium",
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
    //
    // The same blind spot applies one level deeper: tracing a glob-included
    // file copies its *source*, but (unlike a real `import`) never walks
    // that source's own imports to pull in their node_modules packages.
    // pipeline.ts's direct imports (@remotion/bundler, @remotion/renderer,
    // @remotion/media-parser, ai, zod, @ai-sdk/*) are traced correctly and
    // proven working in production — script generation and TTS both
    // succeeded live. What's only reachable through the glob above
    // (Root.tsx -> remotion; LessonReel.tsx -> @remotion/transitions;
    // CaptionLayer.tsx -> @remotion/captions) is not, and fails at render
    // time with "Module not found" one package at a time as each is hit.
    // Listed explicitly here instead, so all three ship at once.
    //
    // On Vercel, pipeline.ts dynamically imports @sparticuz/chromium instead
    // of using Remotion's own downloaded browser (its Chrome Headless Shell
    // is missing OS-level shared libraries — libnspr4.so and friends — in
    // Vercel's Lambda image; no download-location fix changes that, only a
    // differently-built Chromium does). @vercel/nft generally follows
    // dynamic `import()` on its own, but it's listed explicitly here too —
    // this project has hit enough tracing surprises to not rely on that
    // alone for something this load-bearing.
    //
    // @remotion/renderer resolves ffmpeg/ffprobe/its compositor binary from
    // a platform-specific native package — get-executable-path.js does
    // `require('@remotion/compositor-linux-x64-gnu')` (or -musl/-darwin-*/
    // -win32-* depending on process.platform/arch) at *runtime*, one of six
    // literal-but-conditionally-reached requires. Only the Windows variant
    // is installed in this Windows dev environment, so it's the only one
    // that showed up in a local trace; Vercel's Linux glibc runtime needs
    // -linux-x64-gnu specifically (confirmed by the actual production
    // error: "ENOENT ... @remotion/compositor-linux-x64-gnu/ffprobe"). musl
    // is included too as a safety net in case Vercel's base image ever
    // isn't glibc-based.
    outputFileTracingIncludes: {
      "/api/generate-video": [
        "./src/remotion/**/*",
        "./node_modules/remotion/**/*",
        "./node_modules/@remotion/captions/**/*",
        "./node_modules/@remotion/transitions/**/*",
        "./node_modules/@sparticuz/chromium/**/*",
        "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
        "./node_modules/@remotion/compositor-linux-x64-musl/**/*",
      ],
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
