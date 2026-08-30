import type { FC } from "react";
import { Composition } from "remotion";
import { LessonReel } from "./compositions/LessonReel";
import { lessonReelPropsSchema, FPS, PLATFORM_PRESETS, secondsToFrames, totalDurationInSeconds } from "./schema";
import { buildLessonReelProps } from "./skill/promptToProps";

// Sample content so `remotion studio` has something real to preview without
// wiring anything up first. Swap for actual lesson content when rendering —
// see remotion/skill/promptToProps.ts and README-remotion.md.
const sampleProps = buildLessonReelProps({
  topic: "Newton'un İkinci Yasası",
  platform: "reels",
  durationInSeconds: 30,
  script:
    "Kuvvet, kütle çarpı ivmeye eşittir. Bu basit formül, evrendeki her hareketi açıklar. " +
    "Bir cismi itmek için ne kadar çok kuvvet uygularsan, o kadar hızlı ivmelenir. " +
    "Ama aynı kuvvetle daha ağır bir cismi ittiğinde, ivme daha küçük olur. " +
    "İşte bu yüzden bir bisikleti itmek bir kamyonu itmekten çok daha kolaydır.",
  captions: [],
});

export const RemotionRoot: FC = () => {
  return (
    <Composition
      id="LessonReel"
      component={LessonReel}
      schema={lessonReelPropsSchema}
      fps={FPS}
      width={PLATFORM_PRESETS.reels.width}
      height={PLATFORM_PRESETS.reels.height}
      durationInFrames={secondsToFrames(totalDurationInSeconds(sampleProps.scenes))}
      defaultProps={sampleProps}
      calculateMetadata={({ props }) => {
        const preset = PLATFORM_PRESETS[props.platform];
        return {
          width: preset.width,
          height: preset.height,
          fps: preset.fps,
          durationInFrames: secondsToFrames(totalDurationInSeconds(props.scenes), preset.fps),
        };
      }}
    />
  );
};
