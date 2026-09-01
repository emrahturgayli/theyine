"use client";

/**
 * Manager view mockup — a preview of the panel a building manager sees:
 * overdue payers, new requests, and current balance. Rendered with
 * representative placeholder data (no live backend wiring exists yet) so
 * the landing page can show what the product looks like before anyone
 * signs up.
 */

const MOCK_UNPAID = [
  { unit: "3B", owner: "A. Petrov", amount: "80 лв", daysOverdue: 12 },
  { unit: "5A", owner: "M. Ivanova", amount: "80 лв", daysOverdue: 4 },
  { unit: "1C", owner: "S. Dimitrov", amount: "160 лв", daysOverdue: 21 },
];

const MOCK_REQUESTS = [
  { unit: "2A", subject: "Asansör arızası", status: "open" as const },
  { unit: "4B", subject: "Su sızıntısı", status: "in_progress" as const },
];

const STATUS_LABEL: Record<"open" | "in_progress", string> = {
  open: "Yeni",
  in_progress: "İşlemde",
};

export default function Dashboard() {
  return (
    <div className="card mx-auto w-full max-w-3xl overflow-hidden text-left shadow-lift">
      <div className="flex items-center justify-between border-b border-line bg-mist/50 px-6 py-4">
        <span className="text-sm font-semibold text-ink">Güneşli Sitesi — Yönetici Paneli</span>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">Ödemeyenler</h4>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-950/50">
              {MOCK_UNPAID.length} daire
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {MOCK_UNPAID.map((row) => (
              <li key={row.unit} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-ink">{row.unit}</span>
                  <span className="ml-2 text-ink-faint">{row.owner}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-ink">{row.amount}</div>
                  <div className="text-xs text-red-500">{row.daysOverdue} gün gecikme</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">Yeni Talepler</h4>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-950/50">
              {MOCK_REQUESTS.length} açık
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {MOCK_REQUESTS.map((row) => (
              <li key={row.subject} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-ink">{row.unit}</span>
                  <span className="ml-2 text-ink-soft">{row.subject}</span>
                </div>
                <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-ink-faint">
                  {STATUS_LABEL[row.status]}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl bg-mist/60 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">Güncel Bakiye</div>
            <div className="mt-1 text-2xl font-bold text-ink">8.140 лв</div>
          </div>
        </div>
      </div>
    </div>
  );
}
