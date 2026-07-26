// Landing'deki DemoVideo bileşeni için paylaşılan video URL parser'ı.
// THEYINE ana sitesindeki lib/video.ts ile aynı sözleşme: YouTube linklerinden
// embed URL + thumbnail türetir, .mp4 linklerini doğrudan oynatıcıya verir.

export interface ParsedVideo {
  kind: "youtube" | "file";
  /** iframe src (YouTube) veya <video> src (dosya) */
  embedUrl: string;
  /** VideoObject structured data ve facade poster'ı için (yalnızca YouTube'da türetilebilir) */
  thumbnail?: string;
}

export function parseVideo(url?: string | null): ParsedVideo | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) {
    const id = yt[1];
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (/\.(mp4|webm|mov)(\?|$)/i.test(trimmed)) {
    return { kind: "file", embedUrl: trimmed };
  }

  return null;
}
