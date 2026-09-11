"use client";

import { useMemo, useState } from "react";
import type { Invoice, TenantSettings, ManualPaymentMethod } from "@/lib/blokmate-data";
import InvoiceTable from "./InvoiceTable";

type StatusFilter = "all" | "overdue" | "paid" | "unpaid";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "overdue", label: "Gecikmede" },
  { value: "paid", label: "Ödeyenler" },
  { value: "unpaid", label: "Ödemeyenler" },
];

/**
 * Manager's dues view — InvoiceTable plus a dönem (period) filter and a
 * status quick-filter row (Gecikmede/Ödeyenler/Ödemeyenler), both purely
 * client-side over the invoices already loaded for the selected building
 * (invoices/page.tsx's existing building filter + listInvoices call) —
 * no separate fetch, this only narrows what's already in memory.
 */
export default function ManagerDuesTable({
  invoices,
  loading,
  unitLabel,
  onMarkPaid,
  onMarkUnpaid,
  onDelete,
  currency,
}: {
  invoices: Invoice[];
  loading: boolean;
  unitLabel: (unitId: string) => string;
  onMarkPaid: (invoice: Invoice, method: ManualPaymentMethod) => Promise<void>;
  onMarkUnpaid: (invoice: Invoice) => Promise<void>;
  onDelete: (invoice: Invoice) => void;
  currency?: TenantSettings["currency"];
}) {
  const [period, setPeriod] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const periods = useMemo(() => {
    const set = new Set(invoices.map((i) => i.period).filter((p): p is string => !!p));
    return Array.from(set).sort().reverse();
  }, [invoices]);

  const counts = useMemo(
    () => ({
      all: invoices.length,
      overdue: invoices.filter((i) => i.status === "overdue").length,
      paid: invoices.filter((i) => i.status === "paid").length,
      unpaid: invoices.filter((i) => i.status === "unpaid").length,
    }),
    [invoices]
  );

  const filtered = invoices.filter((i) => {
    if (period !== "all" && i.period !== period) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`min-h-[32px] rounded-full px-3 text-xs font-semibold transition ${
                statusFilter === tab.value
                  ? "bg-blue-600 text-white"
                  : "border border-line text-ink-soft hover:border-blue-500"
              }`}
            >
              {tab.label} ({counts[tab.value]})
            </button>
          ))}
        </div>
        {periods.length > 0 && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="min-h-[32px] rounded-lg border border-line bg-surface px-3 text-xs text-ink outline-none focus:border-blue-500"
          >
            <option value="all">Tüm dönemler</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      <InvoiceTable
        invoices={filtered}
        loading={loading}
        unitLabel={unitLabel}
        canManage
        onMarkPaid={onMarkPaid}
        onMarkUnpaid={onMarkUnpaid}
        onDelete={onDelete}
        currency={currency}
      />
    </div>
  );
}
