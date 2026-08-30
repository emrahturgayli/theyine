import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, fontFamily } from "../theme";

type TitleSceneProps = {
  heading: string;
};

/** Opening scene — the lesson topic, animated in with a spring scale + fade. */
export function TitleScene({ heading }: TitleSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const scale = interpolate(entrance, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 30%, ${theme.lavenderTint} 0%, ${theme.canvas} 65%)`,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 90px",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 22px",
            borderRadius: 999,
            background: theme.lavenderTint,
            color: theme.lavender,
            fontFamily,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          THEYINE
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 76,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            color: theme.ink,
          }}
        >
          {heading}
        </div>
      </div>
    </AbsoluteFill>
  );
}
