import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme, fontFamily } from "../theme";

type OutroSceneProps = {
  heading: string;
  body?: string;
};

/** Closing card — brand mark + call-to-action, fades in on the always-dark panel. */
export function OutroScene({ heading, body }: OutroSceneProps) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: theme.panel,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 90px",
      }}
    >
      <div style={{ opacity, textAlign: "center" }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 60,
            color: "#FFFFFF",
            letterSpacing: -1,
            marginBottom: body ? 20 : 0,
          }}
        >
          {heading}
        </div>
        {body && (
          <div
            style={{
              fontFamily,
              fontWeight: 500,
              fontSize: 32,
              color: theme.lavenderSoft,
            }}
          >
            {body}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
