// Gerçek (taranabilir) QR kod önizlemesi: `qrcode` paketiyle canvas'a çizer,
// kısa URL'i gösterir ve PNG indirme sunar. Admin panelde kampanya oluşturunca
// ve listede seçilince kullanılır.

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useT } from "../lib/i18n";

export default function QRPreview({ url }: { url: string }) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 1,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    });
  }, [url]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "theyine-qr.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  if (!url) return null;

  return (
    <div className="qr-preview">
      <canvas ref={canvasRef} width={200} height={200} />
      <div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
          {t("campaigns.shortUrl")}
        </div>
        <div className="short-url">{url}</div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={download}>
        ⬇ {t("campaigns.downloadQr")}
      </button>
    </div>
  );
}
