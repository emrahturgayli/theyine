/**
 * "Tek prompt, sınırsız video" CLI:
 *   npm run generate:video -- "PG 'Hristo Botev' lisesindeki matematik
 *   dersim için Bayes Teoremini anlatan 45 saniyelik viral bir Instagram
 *   Reels yap"
 *
 * Free text -> LLM (generateLessonRequest) -> TTS narration
 * (generateNarration) -> structured props resynced to the real audio
 * length (buildLessonReelProps) -> src/remotion/props.json -> render.
 * One command, no manual JSON editing, no silent video.
 */
import { config as loadEnv } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

// Next.js auto-loads .env.local for the app; a standalone script doesn't
// get that for free, so load it explicitly before touching API keys.
loadEnv({ path: join(__dirname, "..", ".env.local") });

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

async function main() {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    console.error('Kullanım: npm run generate:video -- "<serbest metin istek>"');
    process.exitCode = 1;
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "[generate-video] ANTHROPIC_API_KEY tanımlı değil.\n" +
        "  Landing/.env.local dosyasına ekleyin: ANTHROPIC_API_KEY=sk-ant-...\n" +
        "  (console.anthropic.com/settings/keys)"
    );
    process.exitCode = 1;
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "[generate-video] OPENAI_API_KEY tanımlı değil (seslendirme için gerekli).\n" +
        "  Landing/.env.local dosyasına ekleyin: OPENAI_API_KEY=sk-...\n" +
        "  (platform.openai.com/api-keys)"
    );
    process.exitCode = 1;
    return;
  }

  // Imported after the env check so a missing key fails fast, before
  // pulling in the ai/@ai-sdk module graph for nothing.
  const { generateLessonRequest } = await import("../src/remotion/skill/generateLessonRequest");
  const { generateNarration } = await import("../src/remotion/skill/generateNarration");
  const { buildLessonReelProps } = await import("../src/remotion/skill/promptToProps");

  console.log(`[generate-video] İstek: "${input}"`);
  console.log("[generate-video] LLM'den yapılandırılmış ders verisi isteniyor...");

  const llmOutput = await generateLessonRequest(input);
  console.log(
    `[generate-video] Konu: "${llmOutput.topic}" | Platform: ${llmOutput.platform} | İstenen süre: ${llmOutput.durationInSeconds}s`
  );
  console.log(`[generate-video] Script (${llmOutput.script.length} karakter):\n  "${llmOutput.script}"`);

  const projectRoot = join(__dirname, "..");
  const slug = slugify(llmOutput.topic);

  const publicDir = join(projectRoot, "src", "remotion", "public");
  const audioDir = join(publicDir, "audio");
  if (!existsSync(audioDir)) mkdirSync(audioDir, { recursive: true });
  const audioFileName = `${slug}.mp3`;
  const audioPath = join(audioDir, audioFileName);

  console.log("[generate-video] Seslendirme üretiliyor (OpenAI TTS)...");
  const narration = await generateNarration(llmOutput.script, audioPath);
  console.log(
    `[generate-video] Seslendirme hazır: ${audioPath} (${narration.durationInSeconds.toFixed(2)}s)`
  );

  // Resync scene timing to the *actual* narration length rather than the
  // LLM's text-length guess — otherwise the video runs long/short of the
  // voiceover and either cuts it off or leaves dead air at the end.
  const props = buildLessonReelProps({
    ...llmOutput,
    durationInSeconds: narration.durationInSeconds,
    narrationAudioSrc: `audio/${audioFileName}`,
  });

  const propsPath = join(projectRoot, "src", "remotion", "props.json");
  writeFileSync(propsPath, JSON.stringify(props, null, 2), "utf-8");
  console.log(`[generate-video] props.json güncellendi (${props.scenes.length} sahne) -> ${propsPath}`);

  const outDir = join(projectRoot, "out");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outputPath = join(outDir, `${slug}.mp4`);

  // Programmatic bundle + render (@remotion/bundler + @remotion/renderer)
  // rather than shelling out to `npx remotion render`: no subprocess, no
  // shell, nothing to escape — spawning the CLI's own .cmd shim without a
  // shell throws EINVAL on Windows anyway, and with a shell it's an
  // unnecessary injection surface for no benefit.
  console.log("[generate-video] Composition bundleniyor...");
  const bundleLocation = await bundle({
    entryPoint: join(projectRoot, "src", "remotion", "index.ts"),
    publicDir,
    onProgress: (progress) => process.stdout.write(`\r[generate-video] Bundling %${progress}   `),
  });
  process.stdout.write("\n");

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "LessonReel",
    inputProps: props,
  });

  console.log(
    `[generate-video] Render tetikleniyor (${composition.durationInFrames} kare, ` +
      `${composition.width}x${composition.height} @ ${composition.fps}fps) -> ${outputPath}`
  );
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: props,
    onProgress: ({ renderedFrames, encodedFrames }) =>
      process.stdout.write(
        `\r[generate-video] Render: ${renderedFrames}/${composition.durationInFrames}  Encode: ${encodedFrames}/${composition.durationInFrames}   `
      ),
  });
  process.stdout.write("\n");

  console.log(`\n✅ Video hazır (seslendirilmiş): ${outputPath}`);
}

main().catch((err) => {
  console.error("[generate-video] Hata:", err);
  process.exitCode = 1;
});
