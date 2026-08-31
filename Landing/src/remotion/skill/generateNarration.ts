import { writeFileSync } from "fs";
import { generateSpeech } from "ai";
import { openai } from "@ai-sdk/openai";
import { parseMedia } from "@remotion/media-parser";

/**
 * OpenAI TTS voices, roughly ordered from most to least "energetic
 * narrator" — matches the Gary Vaynerchuk-style script tone from
 * generateLessonRequest.ts. Override with OPENAI_TTS_VOICE if a specific
 * voice reads better for a given language/topic.
 */
const DEFAULT_VOICE = "onyx";

const NARRATION_INSTRUCTIONS =
  "Enerjik, hızlı tempolu, kendinden emin bir sosyal medya anlatıcısı gibi konuş. " +
  "İlk cümleyi özellikle vurgulu söyle — dikkat çekmesi gerekiyor. Doğal duraklamalar kullan, robotik olma.";

export type NarrationResult = {
  /** Local filesystem path the mp3 was written to (same as the `outputPath` argument). */
  path: string;
  durationInSeconds: number;
};

/**
 * Turns the lesson script into an mp3 narration track via OpenAI TTS
 * (gpt-4o-mini-tts — supports style `instructions`, unlike the older
 * tts-1/tts-1-hd models). Also measures the real rendered duration so the
 * caller can resync scene timing to the actual audio instead of the
 * LLM's text-length guess.
 *
 * Requires OPENAI_API_KEY in the environment.
 */
export async function generateNarration(
  script: string,
  outputPath: string
): Promise<NarrationResult> {
  const { audio } = await generateSpeech({
    model: openai.speech("gpt-4o-mini-tts"),
    text: script,
    voice: process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE,
    instructions: NARRATION_INSTRUCTIONS,
    outputFormat: "mp3",
  });

  writeFileSync(outputPath, audio.uint8Array);

  const { slowDurationInSeconds } = await parseMedia({
    src: outputPath,
    fields: { slowDurationInSeconds: true },
  });

  return { path: outputPath, durationInSeconds: slowDurationInSeconds };
}
