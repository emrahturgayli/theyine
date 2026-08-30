import { Config } from "@remotion/cli/config";

/**
 * Remotion CLI config — separate render/studio pipeline living alongside the
 * Next.js app. Not consumed by `next build`; only by `remotion studio` /
 * `remotion render` (see package.json scripts).
 */
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(1);
