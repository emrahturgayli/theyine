import { z } from "zod";
import {
  lessonReelPropsSchema,
  platformSchema,
  type LessonReelProps,
  type Scene,
  type CaptionCue,
} from "../schema";

/**
 * The "Skill" boundary.
 *
 * Turning truly free-form text ("okuldaki fizik dersinden 30 saniyelik bir
 * Reels yap") into structured data is a language-understanding problem, not
 * a deterministic one — that step belongs to an LLM call (e.g. a Claude
 * request, run from a small API route or Composio automation) whose job is
 * to extract exactly the fields below and nothing else.
 *
 * `lessonRequestSchema` is that contract: the structured JSON an upstream
 * LLM step must produce. Everything downstream of it — this file — is
 * deterministic and testable without ever calling a model.
 */
export const lessonRequestSchema = z.object({
  topic: z.string().min(1),
  platform: platformSchema.default("reels"),
  durationInSeconds: z.number().positive().max(180).default(30),
  /** Plain narration/lesson script — split into scenes automatically. */
  script: z.string().min(1),
  /** Optional path under /public, or an absolute URL, to a narration track. */
  narrationAudioSrc: z.string().optional(),
  /** Optional pre-transcribed captions (e.g. from Whisper); left empty if none yet. */
  captions: z.array(z.custom<CaptionCue>()).default([]),
  ctaText: z.string().default("Devamı için takipte kal"),
});
/** Input shape callers pass — fields with a schema default are optional here. */
export type LessonRequest = z.input<typeof lessonRequestSchema>;

const TITLE_SHARE = 0.15;
const OUTRO_SHARE = 0.12;
const MAX_CHARS_PER_SCENE = 140;
const MIN_SCENE_SECONDS = 1.5;

/** Groups sentences into readable on-screen chunks, never mid-sentence. */
function chunkScript(script: string, maxChars: number): string[] {
  const sentences = script
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return [script.trim()];

  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && candidate.length > maxChars) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Deterministically maps a validated lesson request to Remotion composition
 * props: a title card, N content beats sized proportionally to how much
 * text each holds, and an outro — all fit inside the requested total
 * duration.
 */
export function buildLessonReelProps(request: LessonRequest): LessonReelProps {
  const { topic, platform, durationInSeconds, script, narrationAudioSrc, captions, ctaText } =
    lessonRequestSchema.parse(request);

  const titleSeconds = Math.max(1.5, durationInSeconds * TITLE_SHARE);
  const outroSeconds = Math.max(1.5, durationInSeconds * OUTRO_SHARE);
  const contentBudget = Math.max(durationInSeconds - titleSeconds - outroSeconds, MIN_SCENE_SECONDS);

  const chunks = chunkScript(script, MAX_CHARS_PER_SCENE);
  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0) || 1;

  const contentScenes: Scene[] = chunks.map((chunk, i) => ({
    id: `content-${i}`,
    kind: "content",
    body: chunk,
    durationInSeconds: Math.max(MIN_SCENE_SECONDS, (chunk.length / totalChars) * contentBudget),
  }));

  const scenes: Scene[] = [
    { id: "title", kind: "title", heading: topic, durationInSeconds: titleSeconds },
    ...contentScenes,
    { id: "outro", kind: "outro", heading: "THEYINE", body: ctaText, durationInSeconds: outroSeconds },
  ];

  return lessonReelPropsSchema.parse({
    topic,
    platform,
    scenes,
    captions,
    audioSrc: narrationAudioSrc,
  });
}
