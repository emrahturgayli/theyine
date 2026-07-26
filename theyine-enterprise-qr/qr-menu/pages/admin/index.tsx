// Merchant dashboard: stat kartları (aktif kodlar, toplam tarama/klik/dönüşüm),
// son 7 gün tarama grafiği ve son kampanyalar listesi. Veriler /api/qr/list'ten.
// İlk kampanya yoksa kısa onboarding metni gösterilir.

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout, { apiFetch } from "../../components/AdminLayout";
import StatsChart from "../../components/StatsChart";
import { useT } from "../../lib/i18n";
import type { CampaignWithStats } from "../../lib/types";

interface ListResponse {
  campaigns: (CampaignWithStats & { qrUrl: string })[];
  last7: number[];
}

export default function AdminDashboard() {
  const t = useT();
  const [data, setData] = useState<ListResponse | null>(null);

  useEffect(() => {
    apiFetch("/api/qr/list")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <AdminLayout>
        <p>{t("admin.loading")}</p>
      </AdminLayout>
    );
  }

  const total = (key: "views" | "clicks" | "conversions") =>
    data.campaigns.reduce((sum, c) => sum + c.stats[key], 0);
  const active = data.campaigns.filter(
    (c) => c.active && (!c.expiresAt || Date.parse(c.expiresAt) > Date.now())
  ).length;

  return (
    <AdminLayout>
      <h1>{t("nav.dashboard")}</h1>

      {data.campaigns.length === 0 && (
        <div className="onboarding">👋 {t("admin.welcome")}</div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">{t("admin.activeCodes")}</div>
          <div className="value">{active}</div>
        </div>
        <div className="stat-card">
          <div className="label">{t("admin.totalScans")}</div>
          <div className="value">{total("views")}</div>
        </div>
        <div className="stat-card">
          <div className="label">{t("admin.totalClicks")}</div>
          <div className="value">{total("clicks")}</div>
        </div>
        <div className="stat-card">
          <div className="label">{t("admin.conversions")}</div>
          <div className="value">{total("conversions")}</div>
        </div>
      </div>

      <div className="panel">
        <h2>{t("admin.last7days")}</h2>
        <StatsChart data={data.last7} />
      </div>

      <div className="panel">
        <h2>{t("admin.recentCampaigns")}</h2>
        {data.campaigns.length === 0 && (
          <p style={{ color: "var(--text-secondary)" }}>
            {t("admin.noCampaigns")}
          </p>
        )}
        {data.campaigns.slice(0, 5).map((c) => (
          <div className="qr-row" key={c.id}>
            <div className="info">
              <div className="title">{c.title}</div>
              <div className="sub">{c.qrUrl}</div>
            </div>
            <div className="metrics">
              <span>
                <b>{c.stats.views}</b> {t("campaigns.views")}
              </span>
              <span>
                <b>{c.stats.clicks}</b> {t("campaigns.clicks")}
              </span>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 14 }}>
          <Link href="/admin/campaigns" className="btn btn-ghost btn-sm">
            {t("campaigns.newCampaign")} →
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
