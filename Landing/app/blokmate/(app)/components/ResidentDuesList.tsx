"use client";

import type { Invoice, TenantSettings } from "@/lib/blokmate-data";
import { formatBlokmateAmount } from "@/lib/blokmate-currency";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import PayNowButton from "./PayNowButton";

const STATUS_LABELS: Record<Invoice["status"], string> = {
  unpaid: "Ödenmedi",
  paid: "Ödendi",
  overdue: "Gecikmiş",
  void: "İptal",
};

const STATUS_STYLES: Record<Invoice["status"], string> = {
  unpaid: "bg-amber-50 text-amber-700 dark:bg-amber-950/50",
  paid: "bg-green-50 text-green-700 dark:bg-green-950/50",
  overdue: "bg-red-50 text-red-600 dark:bg-red-950/50",
  void: "bg-mist text-ink-faint",
};

/**
 * Resident's own dues, split into "bu ay" (current calendar month, by
 * period tag) and "geçmiş dönemler" — the invoices themselves are
 * already RLS-scoped to the caller's own unit (invoices_select,
 * migration 002), so this component only groups/labels what
 * listInvoices() already returned, it does not fetch or filter by
 * identity itself.
 */
export default function ResidentDuesList({
  invoices,
  loading,
  currency,
}: {
  invoices: Invoice[];
  loading: boolean;
  currency?: TenantSettings["currency"];
}) {
  const { lang } = useBlokmateLanguage();
  const currentPeriod = new Date().toISOString().slice(0, 7);

  const current = invoices.filter((i) => i.period === currentPeriod);
  const past = invoices
    .filter((i) => i.period !== currentPeriod)
    .sort((a, b) => (b.period ?? b.due_date).localeCompare(a.period ?? a.due_date));

  if (loading) return <p className="text-sm text-ink-faint">Yükleniyor…</p>;
  if (invoices.length === 0) return <p className="text-sm text-ink-faint">Henüz aidat kaydın yok.</p>;

  function DuesCard({ invoice }: { invoice: Invoice }) {
    const payable = invoice.status === "unpaid" || invoice.status === "overdue";
    return (
      <li className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{invoice.period ?? "Dönem belirtilmemiş"}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[invoice.status]}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            Son ödeme: {invoice.due_date}
            {invoice.paid_at && ` · Ödeme tarihi: ${new Date(invoice.paid_at).toLocaleDateString("tr-TR")}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-ink">{formatBlokmateAmount(invoice.amount_cents, lang, currency)}</span>
          {payable && <PayNowButton invoice={invoice} />}
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-ink-faint">Bu ayın aidatı</h3>
        {current.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">Bu ay için henüz bir aidat kesilmemiş.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {current.map((inv) => (
              <DuesCard key={inv.id} invoice={inv} />
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink-faint">Geçmiş dönemler</h3>
          <ul className="mt-2 space-y-2">
            {past.map((inv) => (
              <DuesCard key={inv.id} invoice={inv} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
