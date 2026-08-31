import { join } from "path";
import { createHash, timingSafeEqual } from "crypto";
import { generateLessonVideo, type PipelineEvent } from "@/src/remotion/pipeline";

// Rendering a real video (LLM call + TTS + headless-Chrome render) reliably
// takes well over the default serverless timeout — this needs the Node
// runtime (fs, headless Chrome via @remotion/renderer) and a long ceiling.
export const runtime = "nodejs";
export const maxDuration = 300;

type RequestBody = { prompt?: string; accessCode?: string };

/** Constant-time string compare — avoids leaking the access code via timing. */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function sseLine(event: PipelineEvent | { step: "error"; message: string }): Uint8Array {
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

  const projectRoot = join(process.cwd());
  const outputDir = join(projectRoot, "public", "generated");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // pipeline.ts's own "done" event (forwarded below via onEvent)
        // already carries the fileName the client needs to build the
        // preview/download URL — nothing left to send after it resolves.
        await generateLessonVideo(prompt, {
          entryPoint: join(projectRoot, "src", "remotion", "index.ts"),
          remotionPublicDir: join(projectRoot, "src", "remotion", "public"),
          outputDir,
          onEvent: (event) => controller.enqueue(sseLine(event)),
        });
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
