"use client";

import { useRef, useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics";

type Phase = "idle" | "script" | "narration" | "render" | "done" | "error";

type ScriptInfo = { topic: string; platform: string };
type RenderProgress = { rendered: number; total: number };

type PipelineEvent =
  | { step: "script"; status: "start" }
  | { step: "script"; status: "done"; topic: string; platform: string; script: string }
  | { step: "narration"; status: "start" }
  | { step: "narration"; status: "done"; durationInSeconds: number }
  | { step: "render"; status: "start"; totalFrames: number }
  | { step: "render"; status: "progress"; renderedFrames: number; totalFrames: number }
  | { step: "render"; status: "done" }
  | { step: "done"; fileName: string }
  | { step: "error"; message: string };

const STEPS: { phase: Extract<Phase, "script" | "narration" | "render">; label: string }[] = [
  { phase: "script", label: "Yapay Zeka Senaryosu Hazırlanıyor" },
  { phase: "narration", label: "OpenAI TTS ile Seslendirme Üretiliyor" },
  { phase: "render", label: "Remotion ile Video Render Ediliyor" },
];

const PHASE_ORDER: Phase[] = ["idle", "script", "narration", "render", "done"];

const ERROR_MESSAGES: Record<string, string> = {
  invalid_prompt: "Lütfen bir istek yazın (en fazla 500 karakter).",
  invalid_access_code: "Erişim kodu hatalı.",
  server_not_configured: "Sunucu henüz yapılandırılmamış (API anahtarları eksik).",
};

const EXAMPLE_PROMPT =
  "PG 'Hristo Botev' lisesindeki matematik dersim için Bayes Teoremini anlatan 45 saniyelik viral bir Instagram Reels yap.";

const isGenerating = (phase: Phase) => phase === "script" || phase === "narration" || phase === "render";

export default function VideoStudio() {
  const [prompt, setPrompt] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [scriptInfo, setScriptInfo] = useState<ScriptInfo | null>(null);
  const [narrationSeconds, setNarrationSeconds] = useState<number | null>(null);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function handleEvent(event: PipelineEvent) {
    switch (event.step) {
      case "script":
        if (event.status === "start") setPhase("script");
        else setScriptInfo({ topic: event.topic, platform: event.platform });
        break;
      case "narration":
        if (event.status === "start") setPhase("narration");
        else setNarrationSeconds(event.durationInSeconds);
        break;
      case "render":
        if (event.status === "start") {
          setPhase("render");
          setRenderProgress({ rendered: 0, total: event.totalFrames });
        } else if (event.status === "progress") {
          setRenderProgress({ rendered: event.renderedFrames, total: event.totalFrames });
        }
        break;
      case "done":
        setPhase("done");
        setVideoFileName(event.fileName);
        trackEvent("cta_click", "studio_generate_success");
        break;
      case "error":
        setPhase("error");
        setErrorMessage(event.message);
        break;
    }
  }

  function reset() {
    setPhase("idle");
    setScriptInfo(null);
    setNarrationSeconds(null);
    setRenderProgress(null);
    setVideoFileName(null);
    setErrorMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isGenerating(phase)) return;

    trackEvent("cta_click", "studio_generate_start");
    setPhase("script");
    setScriptInfo(null);
    setNarrationSeconds(null);
    setRenderProgress(null);
    setVideoFileName(null);
    setErrorMessage(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), accessCode: accessCode.trim() || undefined }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(ERROR_MESSAGES[data.error] ?? "Video üretilemedi, lütfen tekrar deneyin.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          handleEvent(JSON.parse(line) as PipelineEvent);
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.");
    }
  }

  const currentStepIndex = PHASE_ORDER.indexOf(phase);

  return (
    <section
      id="studio-tool"
      className="relative overflow-hidden border-b border-line pt-20 pb-24 md:pt-28 md:pb-32"
    >
      {/* Ambient background — same lavender field as the primary Hero */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-lavender-tint blur-3xl" />
        <div className="absolute right-[-8rem] top-40 h-72 w-72 rounded-full bg-lavender-soft/40 blur-3xl" />
      </div>

      <div className="container-shell mx-auto max-w-3xl">
        <div className="animate-fade-up flex flex-col items-center text-center">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            AI Video Stüdyosu
          </span>
          <h1 className="mx-auto mt-5 max-w-xl text-4xl font-bold leading-[1.08] tracking-tightest text-ink sm:text-5xl">
            Tek promptla <span className="text-gradient">ders videonu üret.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            Konuyu yaz — THEYINE senaryosunu yazsın, OpenAI ile seslendirsin ve 9:16 formatında
            render etsin.
          </p>
        </div>

        {/* Glass input card */}
        <form
          onSubmit={handleSubmit}
          className="animate-fade-up mt-10 rounded-xl2 border border-line/60 bg-surface/70 p-7 shadow-soft backdrop-blur-xl sm:p-9"
          style={{ animationDelay: "100ms" }}
        >
          <label htmlFor="studio-prompt" className="text-sm font-medium text-ink">
            Hangi konuda video üretmek istersin?
          </label>
          <textarea
            id="studio-prompt"
            required
            rows={3}
            maxLength={500}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={EXAMPLE_PROMPT}
            disabled={isGenerating(phase)}
            className="mt-2 w-full resize-none rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-lavender disabled:opacity-60"
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label htmlFor="studio-access-code" className="text-xs font-medium text-ink-faint">
                Erişim kodu (varsa)
              </label>
              <input
                id="studio-access-code"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={isGenerating(phase)}
                className="mt-1 w-full max-w-[220px] rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-lavender disabled:opacity-60 sm:w-auto"
              />
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating(phase)}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isGenerating(phase) ? "Üretiliyor..." : "Videoyu Üret"}
            </button>
          </div>
        </form>

        {/* Stepped progress */}
        {phase !== "idle" && (
          <div
            className="animate-fade-up mt-8 rounded-xl2 border border-line/60 bg-surface/70 p-7 shadow-soft backdrop-blur-xl sm:p-9"
          >
            <ol className="flex flex-col gap-5">
              {STEPS.map((step) => {
                const stepIndex = PHASE_ORDER.indexOf(step.phase);
                const status: "pending" | "active" | "done" =
                  phase === "error" && currentStepIndex === stepIndex
                    ? "active"
                    : currentStepIndex > stepIndex || phase === "done"
                      ? "done"
                      : currentStepIndex === stepIndex
                        ? "active"
                        : "pending";

                return (
                  <li key={step.phase} className="flex items-center gap-4">
                    <span
                      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        status === "done"
                          ? "border-lavender bg-lavender text-white"
                          : status === "active"
                            ? "border-lavender text-lavender"
                            : "border-line text-ink-faint"
                      }`}
                    >
                      {status === "done" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : status === "active" ? (
                        <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-lavender" style={{ animationDuration: "2.5s" }} />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          status === "pending" ? "text-ink-faint" : "text-ink"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.phase === "script" && scriptInfo && (
                        <p className="mt-0.5 text-xs text-ink-soft">
                          Konu: “{scriptInfo.topic}” · {scriptInfo.platform}
                        </p>
                      )}
                      {step.phase === "narration" && narrationSeconds !== null && (
                        <p className="mt-0.5 text-xs text-ink-soft">
                          Süre: {narrationSeconds.toFixed(1)}s
                        </p>
                      )}
                      {step.phase === "render" && renderProgress && status === "active" && (
                        <div className="mt-2 h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-mist">
                          <div
                            className="h-full rounded-full bg-lavender transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (renderProgress.rendered / renderProgress.total) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {phase === "error" && errorMessage && (
              <p role="alert" className="mt-6 text-sm font-medium text-red-500">
                {errorMessage}
              </p>
            )}
          </div>
        )}

        {/* Result */}
        {phase === "done" && videoFileName && (
          <div
            className="animate-fade-up mt-8 flex flex-col items-center gap-6 rounded-xl2 border border-line/60 bg-surface/70 p-7 shadow-soft backdrop-blur-xl sm:p-9"
          >
            <video
              controls
              className="aspect-[9/16] w-full max-w-[300px] rounded-xl2 bg-black shadow-soft"
              src={`/generated/${videoFileName}`}
            />
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a
                href={`/generated/${videoFileName}`}
                download
                onClick={() => trackEvent("cta_click", "studio_download")}
                className="btn-primary w-full sm:w-auto"
              >
                Videoyu İndir (.mp4)
              </a>
              <button type="button" onClick={reset} className="btn-secondary w-full sm:w-auto">
                Yeni video üret
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
