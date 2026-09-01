import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { generateLessonRequest } from "./skill/generateLessonRequest";
import { generateNarration } from "./skill/generateNarration";
import { buildLessonReelProps } from "./skill/promptToProps";

/**
 * The engine behind both `npm run generate:video` (scripts/generate-video.ts)
 * and the `/studio` web UI (app/api/generate-video/route.ts) — free text in,
 * a rendered, narrated, resynced .mp4 out. Kept here rather than duplicated
 * in each caller so the two stay in lockstep.
 */

export type PipelineEvent =
  | { step: "script"; status: "start" }
  | { step: "script"; status: "done"; topic: string; platform: string; script: string }
  | { step: "narration"; status: "start" }
  | { step: "narration"; status: "done"; durationInSeconds: number }
  | { step: "render"; status: "start"; totalFrames: number }
  | { step: "render"; status: "progress"; renderedFrames: number; totalFrames: number }
  | { step: "render"; status: "done" }
  | { step: "done"; fileName: string };

export type PipelineOptions = {
  /**
   * Absolute path to src/remotion/index.ts. Must be passed in rather than
   * derived from `__dirname` here: this module gets webpack-bundled when
   * imported from the Next.js API route, and a bundled `__dirname` points
   * into `.next/server/...`, not the real source tree — each caller knows
   * its own true path (the CLI via its own unbundled `__dirname`, the API
   * route via `process.cwd()`, which Next keeps pointed at the project root
   * for Node route handlers).
   */
  entryPoint: string;
  /**
   * Where the narration mp3 is written on disk (under an `audio/`
   * subfolder) — only for @remotion/media-parser to measure its duration
   * (see generateNarration.ts); it's never served from here, the rendered
   * composition gets the audio inline as a data: URL instead (see the
   * narrationAudioSrc comment below). Must still be writable at runtime —
   * on Vercel that means os.tmpdir() (`/tmp`), NOT a path under the
   * deployed project (`process.cwd()`/src/...), which is read-only in
   * production.
   */
  remotionPublicDir: string;
  /** Directory the final .mp4 gets written to. Same writability rule as above. */
  outputDir: string;
  /**
   * Webpack's persistent build cache defaults to `<project>/node_modules/.cache`
   * (see @remotion/bundler's webpack-cache.js) — also read-only on Vercel.
   * Pass `false` in any environment where that directory isn't writable;
   * bundling is still memoized in-process either way (see below), so this
   * only costs a re-bundle on cold start, not on every request.
   */
  enableBundleCaching?: boolean;
  onEvent?: (event: PipelineEvent) => void;
};

export type PipelineResult = {
  /** Absolute filesystem path to the rendered .mp4. */
  videoPath: string;
  /** Just the filename, e.g. "bayes-teoremi-a1b2c3d4.mp4". */
  fileName: string;
  /** Absolute filesystem path to the narration mp3 (for callers that want to clean it up). */
  narrationAudioPath: string;
  topic: string;
  platform: string;
  script: string;
  narrationDurationSeconds: number;
};

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "lesson-reel"
  );
}

// Bundling (webpack) the composition takes several seconds and produces the
// same output every time — memoize it per warm process (dev server, or a
// warm serverless instance) instead of re-bundling on every single request.
let cachedBundleLocation: Promise<string> | null = null;
function getBundleLocation(
  entryPoint: string,
  remotionPublicDir: string,
  enableCaching: boolean
): Promise<string> {
  if (!cachedBundleLocation) {
    // bundle()'s own output dir (the compiled webpack assets, distinct from
    // the webpack *cache* enableCaching controls) already defaults to a
    // fresh os.tmpdir() subfolder when left unspecified — safe as-is.
    cachedBundleLocation = bundle({ entryPoint, publicDir: remotionPublicDir, enableCaching });
  }
  return cachedBundleLocation;
}

/**
 * Runs the full pipeline: LLM script generation -> TTS narration -> scene
 * timing resynced to the real narration length -> render. Emits progress
 * via `onEvent` so a caller (CLI or streaming API route) can show live
 * status without polling.
 */
export async function generateLessonVideo(
  input: string,
  options: PipelineOptions
): Promise<PipelineResult> {
  const emit = (event: PipelineEvent) => options.onEvent?.(event);

  emit({ step: "script", status: "start" });
  const llmOutput = await generateLessonRequest(input);
  emit({
    step: "script",
    status: "done",
    topic: llmOutput.topic,
    platform: llmOutput.platform,
    script: llmOutput.script,
  });

  // A short random suffix keeps concurrent requests (two people generating
  // at once, or the same topic twice) from colliding on the same filename.
  const slug = `${slugify(llmOutput.topic)}-${randomUUID().slice(0, 8)}`;

  const audioDir = join(options.remotionPublicDir, "audio");
  if (!existsSync(audioDir)) mkdirSync(audioDir, { recursive: true });
  const audioFileName = `${slug}.mp3`;
  const audioPath = join(audioDir, audioFileName);

  emit({ step: "narration", status: "start" });
  const narration = await generateNarration(llmOutput.script, audioPath);
  emit({ step: "narration", status: "done", durationInSeconds: narration.durationInSeconds });

  // Resync to the *actual* narration length rather than the LLM's
  // text-length guess, so visuals and voice never drift apart.
  //
  // narrationAudioSrc is a data: URL (the mp3 embedded inline), not a
  // "audio/xxx.mp3" path served via staticFile()/publicDir or a file://
  // path. Both of those were tried and both break here: @remotion/bundler
  // snapshots publicDir into the bundle at bundle() time, and the bundle is
  // memoized per warm process (getBundleLocation) — a file written *after*
  // that snapshot 404s against an already-cached bundle on every request
  // but the first. And Remotion's asset downloader flatly rejects file://
  // sources ("Can only download URLs starting with http:// or https://").
  // A data: URL sidesteps both — Remotion special-cases it (no HTTP
  // fetch/file lookup at all, see download-and-map-assets-to-file.js) and
  // it's self-contained regardless of bundle/server state.
  const props = buildLessonReelProps({
    ...llmOutput,
    durationInSeconds: narration.durationInSeconds,
    narrationAudioSrc: `data:${narration.mediaType};base64,${narration.base64}`,
  });

  if (!existsSync(options.outputDir)) mkdirSync(options.outputDir, { recursive: true });
  const fileName = `${slug}.mp4`;
  const outputPath = join(options.outputDir, fileName);

  const bundleLocation = await getBundleLocation(
    options.entryPoint,
    options.remotionPublicDir,
    options.enableBundleCaching ?? true
  );
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "LessonReel",
    inputProps: props,
  });

  emit({ step: "render", status: "start", totalFrames: composition.durationInFrames });
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: props,
    onProgress: ({ renderedFrames }) =>
      emit({
        step: "render",
        status: "progress",
        renderedFrames,
        totalFrames: composition.durationInFrames,
      }),
  });
  emit({ step: "render", status: "done" });
  emit({ step: "done", fileName });

  return {
    videoPath: outputPath,
    fileName,
    narrationAudioPath: audioPath,
    topic: llmOutput.topic,
    platform: llmOutput.platform,
    script: llmOutput.script,
    narrationDurationSeconds: narration.durationInSeconds,
  };
}
