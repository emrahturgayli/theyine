// Runs before `next build` (see package.json's "prebuild" script).
//
// @remotion/renderer downloads its headless Chrome ("Chrome Headless
// Shell") to <nearest-package.json-dir>/node_modules/.remotion the first
// time it's needed — computed at runtime from process.cwd(), with no
// override option (see @remotion/renderer's get-download-destination.js).
// On Vercel, process.cwd() at *runtime* is the deployed function bundle
// (/var/task/...), which is read-only, so that download fails outright
// (ENOENT on mkdir) — there is no way to redirect it via any renderMedia/
// selectComposition option.
//
// Fix: do the download now, during the build, while the project directory
// is still writable, so node_modules/.remotion already contains the right
// binary by the time the function runs — at that point `ensureBrowser()`'s
// own first check (does the expected file already exist?) succeeds and it
// never tries to write anything. next.config.mjs's
// outputFileTracingIncludes ships node_modules/.remotion with the deployed
// function so it's actually there.
import { ensureBrowser } from "@remotion/renderer";

console.log("[ensure-remotion-browser] Ensuring Chrome Headless Shell is downloaded...");
await ensureBrowser();
console.log("[ensure-remotion-browser] Done.");
