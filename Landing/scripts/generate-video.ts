/**
 * "Tek prompt, sınırsız video" CLI:
 *   npm run generate:video -- "PG 'Hristo Botev' lisesindeki matematik
 *   dersim için Bayes Teoremini anlatan 45 saniyelik viral bir Instagram
 *   Reels yap"
 *
 * Thin wrapper around src/remotion/pipeline.ts — same engine the /studio
 * web UI's API route uses (app/api/generate-video/route.ts).
 */
import { config as loadEnv } from "dotenv";
import { join } from "path";

// Next.js auto-loads .env.local for the app; a standalone script doesn't
// get that for free, so load it explicitly before touching API keys.
loadEnv({ path: join(__dirname, "..", ".env.local") });

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
  // pulling in the ai/@ai-sdk/@remotion module graph for nothing.
  const { generateLessonVideo } = await import("../src/remotion/pipeline");

  const projectRoot = join(__dirname, "..");

  console.log(`[generate-video] İstek: "${input}"`);

  const result = await generateLessonVideo(input, {
    entryPoint: join(projectRoot, "src", "remotion", "index.ts"),
    remotionPublicDir: join(projectRoot, "src", "remotion", "public"),
    outputDir: join(projectRoot, "out"),
    onEvent: (event) => {
      switch (event.step) {
        case "script":
          if (event.status === "start") {
            console.log("[generate-video] LLM'den yapılandırılmış ders verisi isteniyor...");
          } else {
            console.log(
              `[generate-video] Konu: "${event.topic}" | Platform: ${event.platform}`
            );
            console.log(`[generate-video] Script (${event.script.length} karakter):\n  "${event.script}"`);
          }
          break;
        case "narration":
          if (event.status === "start") {
            console.log("[generate-video] Seslendirme üretiliyor (OpenAI TTS)...");
          } else {
            console.log(`[generate-video] Seslendirme hazır (${event.durationInSeconds.toFixed(2)}s)`);
          }
          break;
        case "render":
          if (event.status === "start") {
            console.log(`[generate-video] Render tetikleniyor (${event.totalFrames} kare)...`);
          } else if (event.status === "progress") {
            process.stdout.write(
              `\r[generate-video] Render: ${event.renderedFrames}/${event.totalFrames}   `
            );
          } else {
            process.stdout.write("\n");
          }
          break;
        case "done":
          break;
      }
    },
  });

  const outputPath = join(projectRoot, "out", result.fileName);
  console.log(`\n✅ Video hazır (seslendirilmiş): ${outputPath}`);
}

main().catch((err) => {
  console.error("[generate-video] Hata:", err);
  process.exitCode = 1;
});
