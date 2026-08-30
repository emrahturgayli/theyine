import { Fragment } from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { TitleScene } from "../scenes/TitleScene";
import { ContentScene } from "../scenes/ContentScene";
import { OutroScene } from "../scenes/OutroScene";
import { CaptionLayer } from "../captions/CaptionLayer";
import { secondsToFrames } from "../schema";
import type { LessonReelProps } from "../schema";

const TRANSITION_FRAMES = 12;

/**
 * 9:16 lesson reel — Title → N content beats → Outro, cross-faded, with an
 * optional narration track and burned-in captions on top of everything.
 * This is the one composition registered in Root.tsx; its `scenes` prop is
 * what remotion/skill/promptToProps.ts produces from a structured request.
 */
export function LessonReel({ scenes, captions, audioSrc }: LessonReelProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <TransitionSeries>
        {scenes.map((scene, index) => (
          <Fragment key={scene.id}>
            <TransitionSeries.Sequence
              durationInFrames={secondsToFrames(scene.durationInSeconds)}
            >
              {scene.kind === "title" && <TitleScene heading={scene.heading ?? ""} />}
              {scene.kind === "content" && <ContentScene body={scene.body ?? ""} />}
              {scene.kind === "outro" && (
                <OutroScene heading={scene.heading ?? ""} body={scene.body} />
              )}
            </TransitionSeries.Sequence>
            {index < scenes.length - 1 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            )}
          </Fragment>
        ))}
      </TransitionSeries>

      {audioSrc && <Audio src={audioSrc.startsWith("http") ? audioSrc : staticFile(audioSrc)} />}
      {captions.length > 0 && <CaptionLayer captions={captions} />}
    </AbsoluteFill>
  );
}
