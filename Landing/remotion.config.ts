import path from "path";
import { Config } from "@remotion/cli/config";

/**
 * Remotion CLI config — separate render/studio pipeline living alongside the
 * Next.js app. Not consumed by `next build`; only by `remotion studio` /
 * `remotion render` (see package.json scripts).
 */
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(1);

// Narration mp3s (scripts/generate-video.ts, src/remotion/skill/generateNarration.ts)
// live under src/remotion/public/audio and are referenced via staticFile() —
// this must match the `publicDir` passed to bundle() in generate-video.ts,
// since the programmatic API doesn't read this config file.
Config.setPublicDir(path.join(__dirname, "src", "remotion", "public"));
