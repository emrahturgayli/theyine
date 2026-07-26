// Ayarlar: merchant bilgileri + THEYINE ana sitesine / merchant'ın kendi sitesine
// embed için hazır iframe ve script-widget snippet'leri (tek tıkla kopyalanır).

import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useToast } from "../../components/Toast";
import { useT } from "../../lib/i18n";

export default function SettingsPage() {
  const t = useT();
  const toast = useToast();
  const [merchantId, setMerchantId] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setMerchantId(localStorage.getItem("theyine-qr-merchant") || "");
    setRestaurant(localStorage.getItem("theyine-qr-restaurant") || "");
    setOrigin(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
  }, []);

  const iframeSnippet = `<iframe
  src="${origin}/?merchant=${merchantId}&embed=1"
  width="100%"
  height="800"
  loading="lazy"
  frameborder="0"
  style="border:0;border-radius:12px"
  title="THEYINE QR"></iframe>`;

  const scriptSnippet = `<script
  src="${origin}/theyine-qr-widget.js"
  data-merchant="${merchantId}"
  defer></script>`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast(t("settings.copied"), "success");
    });
  };

  return (
    <AdminLayout>
      <h1>{t("settings.title")}</h1>

      <div className="panel">
        <div className="form-grid">
          <div className="form-field">
            <label>{t("settings.restaurantName")}</label>
            <input value={restaurant} readOnly />
          </div>
          <div className="form-field">
            <label>{t("settings.merchantId")}</label>
            <input value={merchantId} readOnly />
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>{t("settings.embedTitle")}</h2>

        <div className="form-field" style={{ marginBottom: 18 }}>
          <label>{t("settings.embedIframe")}</label>
          <pre className="snippet">{iframeSnippet}</pre>
          <button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: "flex-start" }}
            onClick={() => copy(iframeSnippet)}
          >
            📋 {t("settings.copy")}
          </button>
        </div>

        <div className="form-field">
          <label>{t("settings.embedScript")}</label>
          <pre className="snippet">{scriptSnippet}</pre>
          <button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: "flex-start" }}
            onClick={() => copy(scriptSnippet)}
          >
            📋 {t("settings.copy")}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
