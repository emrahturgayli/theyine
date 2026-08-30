# Remotion — Lesson Reel engine

Code-based video generation for turning lesson content into 9:16 Instagram
Reels / YouTube Shorts. Lives entirely under `src/remotion/` — a separate
pipeline from the Next.js site, driven by its own CLI (`remotion studio`,
`remotion render`), not by `next build`.

## Why `src/remotion` and not `remotion/` at the root

`tsconfig.json` sets `baseUrl: "."`. A top-level folder literally named
`remotion` collides with the `remotion` npm package under that baseUrl —
`import ... from "remotion"` resolves to the local folder instead of
`node_modules/remotion`. Nesting it under `src/` avoids the collision.

## Pipeline

```
natural-language request
        │
        │  (upstream LLM step — not in this repo yet: a Claude/GPT call
        │   that extracts { topic, platform, durationInSeconds, script }
        │   from free text, conforming to lessonRequestSchema)
        ▼
skill/promptToProps.ts  →  buildLessonReelProps(request)
        │  (deterministic: splits the script into scenes, sizes each
        │   scene's duration proportionally, no model call)
        ▼
schema.ts  →  LessonReelProps { topic, platform, scenes[], captions[] }
        │
        ▼
compositions/LessonReel.tsx
        │  TransitionSeries of scenes/{Title,Content,Outro}Scene,
        │  cross-faded, + captions/CaptionLayer.tsx burned-in subtitles
        ▼
remotion render  →  .mp4
```

The natural-language → structured-JSON step is intentionally **not**
hand-coded here — reliably parsing arbitrary free text is a model's job, not
a regex's. `lessonRequestSchema` (in `skill/promptToProps.ts`) is the exact
contract that upstream step must fill in. Everything after it is
deterministic and unit-testable without ever calling a model.

## Directory structure

```
src/remotion/
  index.ts              registerRoot entry point (the CLI's entry-point.ts)
  Root.tsx               registers the LessonReel composition
  schema.ts              zod contract: Scene, CaptionCue, LessonReelProps
  theme.ts                brand color/font tokens (mirrors globals.css)
  props.json              example props for `remotion render --props=`
  scenes/
    TitleScene.tsx         opening card — topic, spring entrance
    ContentScene.tsx        one lesson beat per scene
    OutroScene.tsx           brand + CTA closing card
  compositions/
    LessonReel.tsx          assembles scenes with cross-fade transitions
  captions/
    CaptionLayer.tsx         TikTok-style burned-in subtitles (@remotion/captions)
  skill/
    promptToProps.ts         structured-request → Remotion props resolver
```

## Commands

```bash
npm run remotion:preview        # opens Remotion Studio (live scene editor)
npm run remotion:render         # renders the sample composition to out/lesson-reel.mp4
npm run remotion:render:props   # same, but reading props.json for real content
```

Or call the CLI directly for one-off renders / different props / stills:

```bash
npx remotion render src/remotion/index.ts LessonReel out/my-video.mp4 --props='{"topic":"...", ...}'
npx remotion still  src/remotion/index.ts LessonReel out/frame.png --frame=25
```

`out/` is git-ignored — rendered videos/stills are build output, not source.

## Adding real content today (before the LLM step exists)

Call `buildLessonReelProps` directly with a script, or hand-write a
`LessonReelProps`-shaped JSON (see `props.json`) and render with
`--props=path/to/file.json`. Platform (`reels` | `shorts` | `tiktok`) all
currently resolve to the same 1080×1920 @ 30fps preset — see
`PLATFORM_PRESETS` in `schema.ts` if that needs to diverge later (e.g.
platform-specific safe zones).

## Captions from real narration

`captions` takes the same `Caption[]` shape `@remotion/captions` and
Whisper-style transcription tools produce (`text`, `startMs`, `endMs`,
`timestampMs`, `confidence`) — feed a transcript straight in and
`CaptionLayer` groups it into TikTok-style pages automatically.

## Versions

All `@remotion/*` packages and `zod` are pinned to exact versions (no `^`) —
Remotion requires matching versions across its own packages and an exact
`zod` version. Run `npx remotion versions` after any dependency change to
confirm everything still lines up.
