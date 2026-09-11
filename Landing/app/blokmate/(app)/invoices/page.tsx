"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  listInvoices,
  createInvoice,
  listUnits,
  listBuildings,
  markInvoicePaid,
  markInvoiceUnpaid,
  deleteInvoice,
  accrueMonthlyDues,
  type Invoice,
  type Unit,
  type Building,
  type ManualPaymentMethod,
} from "@/lib/blokmate-data";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { useBlokmateToast } from "@/lib/blokmate-toast";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWordPlural } from "@/lib/blokmate-terms";
import ManagerDuesTable from "../components/ManagerDuesTable";
import ResidentDuesList from "../components/ResidentDuesList";
import BuildingFilterBar from "../components/BuildingFilterBar";
import { useBuildingFilter } from "../components/useBuildingFilter";
import { useTenantCurrency } from "../components/useTenantCurrency";

export default function InvoicesPage() {
  const { claims } = useBlokmateAuth();
  const { lang } = useBlokmateLanguage();
  const toast = useBlokmateToast();
  const canManage = claims?.role === "manager" || claims?.role === "accountant";
  const { buildingId: filterBuildingId } = useBuildingFilter();
  const currency = useTenantCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [unitId, setUnitId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const [accrueBuildingId, setAccrueBuildingId] = useState("");
  const [accruePeriod, setAccruePeriod] = useState(currentPeriod);
  const [accrueDueDate, setAccrueDueDate] = useState("");
  const [accruing, setAccruing] = useState(false);

  async function load() {
    try {
      const [i, u, b] = await Promise.all([
        listInvoices(filterBuildingId || undefined),
        listUnits(),
        listBuildings(),
      ]);
      setInvoices(i);
      setUnits(u);
      setBuildings(b);
      if (!unitId && u.length > 0) setUnitId(u[0].id);
      if (!accrueBuildingId && b.length > 0) setAccrueBuildingId(filterBuildingId || b[0].id);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBuildingId]);

  // Stripe redirects here after Checkout — the webhook (not this) is what
  // actually marks the invoice paid, usually just ahead of this redirect,
  // so re-fetching is enough to pick up the new status.
  const searchParams = useSearchParams();
  useEffect(() => {
    const paymentResult = searchParams.get("payment");
    if (paymentResult === "success") {
      toast.success("Ödeme alındı, teşekkürler!");
      load();
    } else if (paymentResult === "cancelled") {
      toast.error("Ödeme iptal edildi.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  async function handleMarkPaid(invoice: Invoice, method: ManualPaymentMethod) {
    try {
      await markInvoicePaid(invoice, method);
      await load();
      toast.success("Fatura ödendi olarak işaretlendi.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      toast.error(message);
    }
  }

  async function handleDelete(invoice: Invoice) {
    if (!window.confirm("Bu aidatı silmek istediğine emin misin? Bu işlem geri alınamaz.")) return;
    try {
      await deleteInvoice(invoice.id);
      await load();
      toast.success("Aidat silindi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  async function handleMarkUnpaid(invoice: Invoice) {
    if (!window.confirm("Bu faturayı ödenmedi durumuna geri almak istediğine emin misin?")) return;
    try {
      await markInvoiceUnpaid(invoice.id);
      await load();
      toast.success("Fatura ödenmedi olarak işaretlendi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  }

  function unitLabel(id: string) {
    return units.find((u) => u.id === id)?.label ?? id;
  }

  const accrueBuilding = buildings.find((b) => b.id === accrueBuildingId);

  async function handleAccrue(e: FormEvent) {
    e.preventDefault();
    if (!accrueBuildingId) return;
    if (
      !window.confirm(
        `${accruePeriod} dönemi için bu binadaki tüm dairelere aidat oluşturulacak. Devam edilsin mi?`
      )
    ) {
      return;
    }
    setAccruing(true);
    try {
      const result = await accrueMonthlyDues({
        building_id: accrueBuildingId,
        period: accruePeriod,
        due_date: accrueDueDate,
      });
      await load();
      if (result.created === 0 && result.skipped > 0) {
        toast.error(`${accruePeriod} dönemi için tüm daireler zaten tahakkuk etmiş.`);
      } else {
        toast.success(
          `${result.created} fatura oluşturuldu` +
            (result.skipped > 0 ? ` (${result.skipped} daire zaten tahakkuk etmişti).` : ".")
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setAccruing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Aidatlar</h1>
        <BuildingFilterBar buildings={buildings} />
      </div>

      {canManage && (
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
      )}

      {canManage && (
        <form onSubmit={handleAccrue} className="card flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[160px]">
            <label className="text-xs font-medium text-ink-faint">Bina</label>
            <select
              required
              value={accrueBuildingId}
              onChange={(e) => setAccrueBuildingId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs font-medium text-ink-faint">Dönem</label>
            <input
              required
              type="month"
              value={accruePeriod}
              onChange={(e) => setAccruePeriod(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="text-xs font-medium text-ink-faint">Son ödeme</label>
            <input
              required
              type="date"
              value={accrueDueDate}
              onChange={(e) => setAccrueDueDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={accruing || !accrueBuilding?.standard_due_amount_cents}
            className="btn min-h-[40px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {accruing ? "Oluşturuluyor…" : "Aylık Aidatları Tahakkuk Et"}
          </button>
          {accrueBuilding && !accrueBuilding.standard_due_amount_cents && (
            <p className="w-full text-xs text-amber-600">
              Bu bina için Standart Aidat Tutarı belirlenmemiş — önce {buildingWordPlural(lang)} sayfasından ekle.
            </p>
          )}
        </form>
      )}

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      {canManage && status === "ready" && units.length === 0 && (
        <p className="text-sm text-ink-faint">Önce bir daire eklemelisin.</p>
      )}

      {canManage ? (
        <ManagerDuesTable
          invoices={invoices}
          loading={status === "loading"}
          unitLabel={unitLabel}
          onMarkPaid={handleMarkPaid}
          onMarkUnpaid={handleMarkUnpaid}
          onDelete={handleDelete}
          currency={currency}
        />
      ) : (
        <ResidentDuesList invoices={invoices} loading={status === "loading"} currency={currency} />
      )}
    </div>
  );
}
