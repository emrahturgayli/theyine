import { join } from "path";
import { tmpdir } from "os";
import { readFile, unlink } from "fs/promises";
import { createHash, timingSafeEqual } from "crypto";
import { generateLessonVideo, type PipelineEvent } from "@/src/remotion/pipeline";

// Rendering a real video (LLM call + TTS + headless-Chrome render) reliably
// takes well over the default serverless timeout — this needs the Node
// runtime (fs, headless Chrome via @remotion/renderer) and a long ceiling.
export const runtime = "nodejs";
export const maxDuration = 300;

type RequestBody = { prompt?: string; accessCode?: string };

/** Final delivery — see the note above the ReadableStream below for why this exists. */
type VideoReadyEvent = { step: "video-ready"; fileName: string; mediaType: string; base64: string };
type ErrorEvent = { step: "error"; message: string };
type StreamEvent = PipelineEvent | VideoReadyEvent | ErrorEvent;

/** Constant-time string compare — avoids leaking the access code via timing. */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function sseLine(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(event) + "\n");
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > 500) {
    return Response.json({ error: "invalid_prompt" }, { status: 400 });
  }

  // Public-facing endpoint that spends real API credits per call — gated
  // behind a shared access code when one is configured. Left open (with a
  // console warning) if STUDIO_ACCESS_CODE isn't set, e.g. local dev.
  const requiredCode = process.env.STUDIO_ACCESS_CODE;
  if (requiredCode) {
    const providedCode = typeof body.accessCode === "string" ? body.accessCode : "";
    if (!providedCode || !safeEqual(providedCode, requiredCode)) {
      return Response.json({ error: "invalid_access_code" }, { status: 401 });
    }
  } else {
    console.warn(
      "[generate-video] STUDIO_ACCESS_CODE not set — /studio is publicly generatable. Set it before going live."
    );
  }

  if (!process.env.ANTHROPIC_API_KEY || !process.env.OPENAI_API_KEY) {
    return Response.json({ error: "server_not_configured" }, { status: 503 });
  }

  // Vercel's deployed function bundle (process.cwd()) is read-only outside
  // of os.tmpdir() — a project-relative path here throws ENOENT the moment
  // anything tries to mkdir/write into it. `/tmp` is always writable.
  const projectRoot = join(process.cwd());
  const remotionPublicDir = join(tmpdir(), "theyine-remotion-public");
  const outputDir = join(tmpdir(), "theyine-remotion-output");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const result = await generateLessonVideo(prompt, {
          entryPoint: join(projectRoot, "src", "remotion", "index.ts"),
          remotionPublicDir,
          outputDir,
          // Webpack's persistent cache defaults to <project>/node_modules/.cache,
          // also read-only on Vercel — see the option's doc comment in pipeline.ts.
          enableBundleCaching: false,
          onEvent: (event) => controller.enqueue(sseLine(event)),
        });

        // The rendered file lives in /tmp, which — unlike Next's `public/`
        // folder — isn't served over HTTP by anything. A second request to
        // "go fetch it" also isn't reliable on serverless: a follow-up GET
        // can land on a different, cold instance with an empty /tmp. So the
        // video is read back into memory and shipped to the client as part
        // of *this same* stream/request instead of via a servable URL.
        const videoBuffer = await readFile(result.videoPath);
        controller.enqueue(
          sseLine({
            step: "video-ready",
            fileName: result.fileName,
            mediaType: "video/mp4",
            base64: videoBuffer.toString("base64"),
          })
        );

        // Best-effort cleanup so a long-lived warm instance doesn't
        // accumulate files across many requests. Never fails the request.
        await Promise.allSettled([unlink(result.videoPath), unlink(result.narrationAudioPath)]);
      } catch (err) {
        console.error("[api/generate-video] Hata:", err);
        controller.enqueue(
          sseLine({
            step: "error",
            message: err instanceof Error ? err.message : "Video üretilemedi.",
          })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
