// Landing'deki demo video bölümü — THEYINE ana sitesindeki facade desenini izler:
// önce hafif bir poster + play butonu render edilir, tıklanınca gerçek iframe/video
// yüklenir (LCP'yi korur). Video URL'i NEXT_PUBLIC_DEMO_VIDEO_URL'den gelir;
// tanımsızsa placeholder gösterilir.

import { useState } from "react";
import { parseVideo } from "../lib/video";
import { useT } from "../lib/i18n";

export default function DemoVideo() {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const video = parseVideo(process.env.NEXT_PUBLIC_DEMO_VIDEO_URL);

  return (
    <section className="demo-video" id="demo">
      <div
        className="video-facade"
        onClick={() => video && setPlaying(true)}
        role="button"
        aria-label={t("landing.watchDemo")}
      >
        {!playing && (
          <>
            {video?.thumbnail && (
              <img src={video.thumbnail} alt="" loading="lazy" />
            )}
            <span className="play-btn">
              <span className="play-circle">▶</span>
              <span>
                {video ? t("landing.watchDemo") : "Demo video — coming soon"}
              </span>
            </span>
          </>
        )}
        {playing && video?.kind === "youtube" && (
          <iframe
            src={video.embedUrl}
            title="THEYINE QR demo"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
        {playing && video?.kind === "file" && (
          <video src={video.embedUrl} controls autoPlay playsInline />
        )}
      </div>
    </section>
  );
}
