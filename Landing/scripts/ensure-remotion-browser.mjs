// Runs before `next build` (see package.json's "prebuild" script) —
// but only for *local* builds. On Vercel, pipeline.ts uses
// @sparticuz/chromium instead of Remotion's own downloaded browser (see the
// getBrowserExecutable comment there for why: Remotion's Chrome Headless
// Shell is missing OS-level shared libraries in Vercel's Lambda image, and
// no download-location fix changes that). Downloading ~270MB of Chrome here
// during a Vercel build would be pure waste — it would never be used.
if (process.env.VERCEL) {
  console.log("[ensure-remotion-browser] Running on Vercel — using @sparticuz/chromium instead, skipping.");
  process.exit(0);
}

// @remotion/renderer downloads its headless Chrome ("Chrome Headless
// Shell") to <nearest-package.json-dir>/node_modules/.remotion the first
// time it's needed — computed at runtime from process.cwd(). Doing it now,
// during the build, means the first `npm run generate:video` or `/studio`
// request locally doesn't have to pay for the download.
const { ensureBrowser } = await import("@remotion/renderer");

console.log("[ensure-remotion-browser] Ensuring Chrome Headless Shell is downloaded...");
await ensureBrowser();
console.log("[ensure-remotion-browser] Done.");
