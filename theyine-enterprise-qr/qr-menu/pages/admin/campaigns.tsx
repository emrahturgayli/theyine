// Kampanya yönetimi: yeni QR oluşturma formu (validasyon + toast) ve mevcut
// kampanyaların listesi. Oluşturulan/seçilen kampanyanın taranabilir QR
// önizlemesi (QRPreview) sağ tarafta gösterilir, PNG olarak indirilebilir.

import { useEffect, useState, type FormEvent } from "react";
import AdminLayout, { apiFetch } from "../../components/AdminLayout";
import QRPreview from "../../components/QRPreview";
import { useToast } from "../../components/Toast";
import { useT } from "../../lib/i18n";
import type { CampaignType, CampaignWithStats } from "../../lib/types";

type Row = CampaignWithStats & { qrUrl: string };

export default function CampaignsPage() {
  const t = useT();
  const toast = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CampaignType>("menu");
  const [targetUrl, setTargetUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [tags, setTags] = useState("");

  const load = () =>
    apiFetch("/api/qr/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRows(d.campaigns))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError(t("campaigns.errorTitle"));
      return;
    }
    if (targetUrl.trim()) {
      try {
        new URL(targetUrl.trim());
      } catch {
        setError(t("campaigns.errorUrl"));
        return;
      }
    }

    setBusy(true);
    try {
      const res = await apiFetch("/api/qr", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          targetUrl: targetUrl.trim(),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Error");
        return;
      }
      const created = await res.json();
      toast(t("campaigns.created"), "success");
      setSelectedUrl(created.qrUrl);
      setTitle("");
      setDescription("");
      setTargetUrl("");
      setExpiresAt("");
      setTags("");
      load();
    } finally {
      setBusy(false);
    }
  };

  const isExpired = (c: Row) =>
    !!c.expiresAt && Date.parse(c.expiresAt) < Date.now();

  return (
    <AdminLayout>
      <h1>{t("campaigns.title")}</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 280px",
          gap: 22,
          alignItems: "start",
        }}
      >
        <div>
          <form className="panel" onSubmit={submit}>
            <h2>{t("campaigns.newCampaign")}</h2>
            <div className="form-grid">
              <div className="form-field full">
                <label>{t("campaigns.formTitle")} *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Happy Hour −20%"
                />
              </div>
              <div className="form-field full">
                <label>{t("campaigns.formDescription")}</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>{t("campaigns.formType")}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CampaignType)}
                >
                  <option value="menu">{t("campaigns.typeMenu")}</option>
                  <option value="reservation">
                    {t("campaigns.typeReservation")}
                  </option>
                  <option value="order">{t("campaigns.typeOrder")}</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t("campaigns.formExpiry")}</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="form-field full">
                <label>{t("campaigns.formTargetUrl")}</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                />
                <span className="hint">{t("campaigns.formTargetUrlHint")}</span>
              </div>
              <div className="form-field full">
                <label>{t("campaigns.formTags")}</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="menu, summer, drinks"
                />
              </div>
            </div>
            {error && (
              <div className="form-error" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}
            <button
              className="btn btn-primary"
              disabled={busy}
              style={{ marginTop: 16 }}
            >
              {busy ? t("campaigns.creating") : t("campaigns.create")}
            </button>
          </form>

          <div className="panel">
            <h2>{t("admin.recentCampaigns")}</h2>
            {rows.length === 0 && (
              <p style={{ color: "var(--text-secondary)" }}>
                {t("admin.noCampaigns")}
              </p>
            )}
            {rows.map((c) => (
              <div className="qr-row" key={c.id}>
                <div className="info">
                  <div className="title">{c.title}</div>
                  <div className="sub">{c.qrUrl}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className="tag badge-type">
                      {t(`campaigns.type${c.type[0].toUpperCase()}${c.type.slice(1)}`)}
                    </span>
                    {isExpired(c) && (
                      <span className="tag badge-expired">
                        {t("campaigns.expired")}
                      </span>
                    )}
                    {c.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="metrics">
                  <span>
                    <b>{c.stats.views}</b> {t("campaigns.views")}
                  </span>
                  <span>
                    <b>{c.stats.clicks}</b> {t("campaigns.clicks")}
                  </span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedUrl(c.qrUrl)}
                >
                  QR
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "sticky", top: 84 }}>
          {selectedUrl ? (
            <QRPreview url={selectedUrl} />
          ) : (
            <div
              className="qr-preview"
              style={{ color: "var(--text-secondary)", fontSize: 13 }}
            >
              ⤶ {t("campaigns.newCampaign")}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
