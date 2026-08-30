import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, fontFamily } from "../theme";

type ContentSceneProps = {
  body: string;
};

/** A single lesson beat — one idea, large readable type, safe-zoned for 9:16. */
export function ContentScene({ body }: ContentSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 16, mass: 0.5 } });
  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const translateY = interpolate(entrance, [0, 1], [24, 0]);

  return (
    <AbsoluteFill
      style={{
        background: theme.canvas,
        alignItems: "center",
        justifyContent: "center",
        // Keeps text inside the safe zone that platform UI (captions,
        // like/share buttons) doesn't cover on 9:16 vertical video.
        padding: "260px 96px",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          fontFamily,
          fontWeight: 700,
          fontSize: 54,
          lineHeight: 1.28,
          letterSpacing: -0.5,
          color: theme.ink,
          textAlign: "center",
        }}
      >
        {body}
      </div>
    </AbsoluteFill>
  );
}
