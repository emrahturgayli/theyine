import { z } from "zod";

/**
 * The structured contract every composition renders from. This is the
 * boundary between "natural language request" and "deterministic render" —
 * see remotion/skill/promptToProps.ts for how a request gets turned into
 * this shape.
 */

export const PLATFORM_PRESETS = {
  reels: { width: 1080, height: 1920, fps: 30, label: "Instagram Reels" },
  shorts: { width: 1080, height: 1920, fps: 30, label: "YouTube Shorts" },
  tiktok: { width: 1080, height: 1920, fps: 30, label: "TikTok" },
} as const;

export const platformSchema = z.enum(
  Object.keys(PLATFORM_PRESETS) as [keyof typeof PLATFORM_PRESETS]
);
export type Platform = z.infer<typeof platformSchema>;

export const sceneSchema = z.object({
  id: z.string(),
  kind: z.enum(["title", "content", "outro"]),
  heading: z.string().optional(),
  body: z.string().optional(),
  /** How long this scene holds before the next one transitions in. */
  durationInSeconds: z.number().positive(),
});
export type Scene = z.infer<typeof sceneSchema>;

/**
 * Word/phrase-level caption cue. Mirrors @remotion/captions' `Caption` type
 * so output from Whisper-style transcription (or @remotion/captions'
 * `createTikTokStyleCaptions`) can be passed straight through.
 */
export const captionCueSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
  pageBreakAfter: z.boolean().optional(),
});
export type CaptionCue = z.infer<typeof captionCueSchema>;

export const lessonReelPropsSchema = z.object({
  topic: z.string(),
  platform: platformSchema,
  scenes: z.array(sceneSchema).min(1),
  captions: z.array(captionCueSchema).default([]),
  /** Optional path (relative to /public or an absolute URL) to source audio/narration. */
  audioSrc: z.string().optional(),
});
export type LessonReelProps = z.infer<typeof lessonReelPropsSchema>;

export const FPS = 30;

export function secondsToFrames(seconds: number, fps: number = FPS): number {
  return Math.round(seconds * fps);
}

export function totalDurationInSeconds(scenes: Scene[]): number {
  return scenes.reduce((sum, scene) => sum + scene.durationInSeconds, 0);
}
