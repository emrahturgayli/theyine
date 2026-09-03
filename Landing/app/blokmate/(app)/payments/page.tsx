"use client";

import { useEffect, useState } from "react";
import { listPayments, type Payment } from "@/lib/blokmate-data";
import PaymentTable from "../components/PaymentTable";

/**
 * Read-only — payments are written by the payments webhook
 * (app/api/blokmate/payments/route.ts), using the service_role key, not
 * from this dashboard. Nothing here needs a create form.
 */
export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setPayments(await listPayments());
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setStatus("error");
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Ödemeler</h1>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <PaymentTable payments={payments} loading={status === "loading"} />
    </div>
  );
}
