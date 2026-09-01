import { writeFileSync } from "fs";
import { generateSpeech } from "ai";
import { openai } from "@ai-sdk/openai";
import { parseMedia } from "@remotion/media-parser";
import { nodeReader } from "@remotion/media-parser/node";

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
  /** Base64-encoded mp3 bytes, for embedding as a data: URL (see pipeline.ts). */
  base64: string;
  mediaType: string;
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

  // parseMedia defaults to a fetch-based reader (fine for http(s)/blob) that
  // rejects local paths outright — nodeReader reads straight off disk, and
  // (unlike most "give me a src" APIs) it specifically wants the raw
  // filesystem path as a plain string, not a `file://` URL: it hands `src`
  // straight to `fs.existsSync`/`fs.createReadStream`, which understand a
  // Windows path (`C:\...`) natively but would choke on a URL string/object.
  const { slowDurationInSeconds } = await parseMedia({
    src: outputPath,
    fields: { slowDurationInSeconds: true },
    reader: nodeReader,
  });

  return {
    path: outputPath,
    durationInSeconds: slowDurationInSeconds,
    base64: audio.base64,
    mediaType: audio.mediaType,
  };
}
