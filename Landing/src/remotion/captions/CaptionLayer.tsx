import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { fontFamily, theme } from "../theme";

type CaptionLayerProps = {
  captions: Caption[];
};

/**
 * Burned-in subtitle layer, TikTok-style: short pages of a few words, the
 * currently-spoken token highlighted. Overlays whatever scene is playing
 * underneath — pass the full transcript's captions and this finds the page
 * active at the current frame on its own.
 */
export function CaptionLayer({ captions }: CaptionLayerProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: 1200,
      }),
    [captions]
  );

  if (pages.length === 0) return null;

  const activePage = pages.find(
    (page) => currentMs >= page.startMs && currentMs < page.startMs + page.durationMs
  );
  if (!activePage) return null;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 220,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 12px",
          maxWidth: 860,
          padding: "18px 32px",
          borderRadius: 20,
          background: "rgba(27, 24, 34, 0.72)",
        }}
      >
        {activePage.tokens.map((token, i) => {
          const active = currentMs >= token.fromMs && currentMs < token.toMs;
          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 44,
                lineHeight: 1.3,
                color: active ? theme.lavenderSoft : "#FFFFFF",
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
