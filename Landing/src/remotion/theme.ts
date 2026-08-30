/**
 * Brand tokens mirrored from Landing/styles/globals.css (light theme values).
 * Kept as plain hex here rather than pulling in Tailwind — Remotion's
 * renderer runs outside the Next.js build pipeline, so duplicating the few
 * constants we actually use is simpler and more reliable than wiring up a
 * second Tailwind pass just for video frames.
 */
export const theme = {
  canvas: "#F9F9FB",
  ink: "#1F1827",
  inkSoft: "#56505F",
  lavender: "#7C3AED",
  lavenderSoft: "#C9C7F5",
  lavenderTint: "#F1EEFE",
  panel: "#1B1822",
} as const;

export const fontFamily =
  '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif';
