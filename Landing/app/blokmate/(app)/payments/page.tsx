"use client";

import { useEffect, useState } from "react";
import { listPayments, listInvoices, listUnits, listBuildings, type Payment, type Invoice, type Unit, type Building } from "@/lib/blokmate-data";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import PaymentTable from "../components/PaymentTable";
import BuildingFilterBar from "../components/BuildingFilterBar";
import { useBuildingFilter } from "../components/useBuildingFilter";
import { useTenantCurrency } from "../components/useTenantCurrency";

/**
 * Read-only — payments are written by markInvoicePaid/completeMockPayment
 * (manager quick-action or the mock "Öde" flow), not from a form here.
 * Managers see every payment in the tenant (or one building, via the
 * filter); a resident's own view is scoped by RLS to their own unit's
 * payments regardless of what this page requests.
 */
export default function PaymentsPage() {
  const { claims } = useBlokmateAuth();
  const canManage = claims?.role === "manager" || claims?.role === "accountant";
  const { buildingId: filterBuildingId } = useBuildingFilter();
  const currency = useTenantCurrency();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, i, u, b] = await Promise.all([
          listPayments(filterBuildingId || undefined),
          listInvoices(filterBuildingId || undefined),
          listUnits(),
          listBuildings(),
        ]);
        setPayments(p);
        setInvoices(i);
        setUnits(u);
        setBuildings(b);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setStatus("error");
      }
    })();
  }, [filterBuildingId]);

  function unitLabelForInvoice(invoiceId: string) {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return "—";
    return units.find((u) => u.id === invoice.unit_id)?.label ?? "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Ödemeler</h1>
        <BuildingFilterBar buildings={buildings} />
      </div>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <PaymentTable
        payments={payments}
        loading={status === "loading"}
        unitLabel={canManage ? unitLabelForInvoice : undefined}
        currency={currency}
      />
    </div>
  );
}
