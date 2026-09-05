"use client";

import { useEffect, useState } from "react";
import { fetchDashboardMetrics, listInvoices, listAnnouncements, type DashboardMetrics, type Invoice, type Announcement } from "@/lib/blokmate-data";
import { formatBlokmateAmount } from "@/lib/blokmate-currency";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import DashboardCard from "../components/DashboardCard";
import MetricGrid from "../components/MetricGrid";
import AnnouncementList from "../components/AnnouncementList";

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("tr-TR", { month: "short" });
}

export default function BlokmateDashboardPage() {
  const { lang } = useBlokmateLanguage();
  const formatAmount = (cents: number) => formatBlokmateAmount(cents, lang);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, i, a] = await Promise.all([fetchDashboardMetrics(), listInvoices(), listAnnouncements()]);
        if (cancelled) return;
        setMetrics(m);
        setInvoices(i);
        setAnnouncements(a);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unpaid = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");
  const maxMonthly = metrics ? Math.max(1, ...metrics.monthlyCollection.map((m) => m.totalCents)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Panel</h1>

      {status === "error" && <p className="text-sm text-red-600">Veri alınamadı: {error}</p>}

      <MetricGrid>
        <DashboardCard label="Toplam daire sayısı" value={status === "loading" ? "—" : metrics?.totalUnits ?? 0} />
        <DashboardCard
          label="Toplam borç"
          value={status === "loading" ? "—" : formatAmount(metrics?.totalDebtCents ?? 0)}
          tone="danger"
        />
        <DashboardCard
          label="Ödenen faturalar"
          value={status === "loading" ? "—" : metrics?.paidInvoiceCount ?? 0}
          tone="positive"
        />
        <DashboardCard
          label="Bekleyen faturalar"
          value={status === "loading" ? "—" : metrics?.pendingInvoiceCount ?? 0}
          tone="warning"
        />
        <DashboardCard
          label="Açık talep sayısı"
          value={status === "loading" ? "—" : metrics?.openTicketCount ?? 0}
          tone={metrics && metrics.openTicketCount > 0 ? "warning" : "default"}
        />
        <DashboardCard label="Aktif duyurular" value={status === "loading" ? "—" : metrics?.activeAnnouncementCount ?? 0} />
      </MetricGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink">Aylık tahsilat</h2>
          {status === "loading" ? (
            <p className="mt-3 text-sm text-ink-faint">Yükleniyor…</p>
          ) : (
            <div className="mt-4 flex h-40 items-end gap-3">
              {metrics?.monthlyCollection.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-blue-500/80"
                    style={{ height: `${Math.max(4, (m.totalCents / maxMonthly) * 100)}%` }}
                    title={formatAmount(m.totalCents)}
                  />
                  <span className="text-[0.65rem] text-ink-faint">{monthLabel(m.month)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink">Aidat tahakkuku durumu</h2>
          {status === "loading" ? (
            <p className="mt-3 text-sm text-ink-faint">Yükleniyor…</p>
          ) : (
            <>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${metrics?.accrual.percentCollected ?? 0}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  Tahsil edilen: {formatAmount(metrics?.accrual.totalPaidCents ?? 0)}
                </span>
                <span className="font-semibold text-ink">%{metrics?.accrual.percentCollected ?? 0}</span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Toplam tahakkuk: {formatAmount(metrics?.accrual.totalInvoicedCents ?? 0)}
              </p>
            </>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink">Kasa-banka durumu</h2>
          <p className="mt-3 text-sm text-ink-faint">
            Bu modül henüz uygulanmadı — bir kasa/banka defteri tablosu (gelir-gider mutabakatı) şu an şemada yok.
            Şu anki tek gerçek para-giriş verisi <code className="rounded bg-mist px-1 py-0.5 text-xs">payments</code>{" "}
            tablosu; sağdaki "Aylık tahsilat" grafiği bu veriyi gösteriyor. Gerçek kasa-banka mutabakatı için ayrı bir
            ledger/expense şeması eklenmesi gerekiyor.
          </p>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink">Aylık gider</h2>
          <p className="mt-3 text-sm text-ink-faint">
            Bu modül henüz uygulanmadı — şemada bir gider (expense) tablosu yok, bu yüzden burada uydurma rakam
            gösterilmiyor. Gider takibi eklenmek istenirse yeni bir tablo + RLS politikası gerekir.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink">Ödenmemiş aidatlar</h2>
          {status === "loading" && <p className="mt-3 text-sm text-ink-faint">Yükleniyor…</p>}
          {status === "ready" && unpaid.length === 0 && (
            <p className="mt-3 text-sm text-ink-faint">Ödenmemiş aidat yok.</p>
          )}
          <ul className="mt-3 divide-y divide-line">
            {unpaid.slice(0, 6).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-soft">{inv.due_date}</span>
                <span className="font-semibold text-ink">{formatAmount(inv.amount_cents)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink">Son duyurular</h2>
          <div className="mt-3">
            <AnnouncementList announcements={announcements} loading={status === "loading"} limit={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
