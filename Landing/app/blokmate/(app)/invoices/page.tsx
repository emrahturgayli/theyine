"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listInvoices, createInvoice, listUnits, markInvoicePaid, type Invoice, type Unit } from "@/lib/blokmate-data";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { useBlokmateToast } from "@/lib/blokmate-toast";
import InvoiceTable from "../components/InvoiceTable";

export default function InvoicesPage() {
  const { claims } = useBlokmateAuth();
  const toast = useBlokmateToast();
  const canManage = claims?.role === "manager" || claims?.role === "accountant";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [unitId, setUnitId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const [i, u] = await Promise.all([listInvoices(), listUnits()]);
      setInvoices(i);
      setUnits(u);
      if (!unitId && u.length > 0) setUnitId(u[0].id);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createInvoice({ unit_id: unitId, amount_cents: Math.round(Number(amount) * 100), due_date: dueDate });
      setAmount("");
      setDueDate("");
      await load();
      toast.success("Aidat oluşturuldu.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(message);
      setStatus("error");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid(invoice: Invoice) {
    try {
      await markInvoicePaid(invoice);
      await load();
      toast.success("Fatura ödendi olarak işaretlendi.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      toast.error(message);
    }
  }

  function unitLabel(id: string) {
    return units.find((u) => u.id === id)?.label ?? id;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Aidatlar</h1>

      <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[140px]">
          <label className="text-xs font-medium text-ink-faint">Daire</label>
          <select
            required
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="text-xs font-medium text-ink-faint">Tutar</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-medium text-ink-faint">Son ödeme</label>
          <input
            required
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || units.length === 0}
          className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Ekleniyor…" : "Oluştur"}
        </button>
      </form>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      {status === "ready" && units.length === 0 && (
        <p className="text-sm text-ink-faint">Önce bir daire eklemelisin.</p>
      )}

      <InvoiceTable
        invoices={invoices}
        loading={status === "loading"}
        unitLabel={unitLabel}
        canManage={canManage}
        onMarkPaid={handleMarkPaid}
      />
    </div>
  );
}
