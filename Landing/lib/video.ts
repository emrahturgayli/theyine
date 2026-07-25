/**
 * Parses a plain YouTube/Vimeo share link into everything the page needs:
 * an autoplaying embed URL and (for YouTube) a thumbnail for structured data.
 * Returns null for empty/unsupported input.
 */
export type VideoEmbed = {
  provider: "youtube" | "vimeo";
  id: string;
  embedUrl: string;
  thumbnail?: string;
};

function youtube(id: string): VideoEmbed {
  return {
    provider: "youtube",
    id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  };
}

export function parseVideo(raw?: string | null): VideoEmbed | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? youtube(id) : null;
    }
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id ? youtube(id) : null;
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id
        ? { provider: "vimeo", id, embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1` }
        : null;
    }
    return null;
  } catch {
    return null;
  }
}
