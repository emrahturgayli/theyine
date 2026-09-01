"use client";

/**
 * Static mock preview of what a manager's building looks like inside
 * BlokMate — one sample building, one unit, one invoice card, one
 * announcement. No live data; used inside OnboardingModal's step 3 and
 * standalone at /blokmate/demo.
 */
const MOCK = {
  building: { name: "Güneşli Sitesi", address: "Vitosha Blvd. 24, Sofya", units: 32 },
  unit: { label: "3B", owner: "A. Petrov" },
  invoice: { amount: "80 лв", dueDate: "2026-09-10", status: "unpaid" as const },
  announcement: {
    title: "Asansör bakımı",
    body: "15 Eylül'de 09:00–12:00 arası A blok asansörü bakımda olacaktır.",
  },
};

export default function MiniDemo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`card overflow-hidden text-left shadow-soft ${compact ? "max-w-md" : "mx-auto max-w-2xl"}`}>
      <div className="flex items-center justify-between border-b border-line bg-mist/50 px-5 py-3">
        <span className="text-sm font-semibold text-ink">{MOCK.building.name}</span>
        <span className="text-xs text-ink-faint">{MOCK.building.units} daire</span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">Daire</div>
          <div className="mt-1 text-sm font-semibold text-ink">
            {MOCK.unit.label} — {MOCK.unit.owner}
          </div>
        </div>

        <div className="rounded-xl border border-line p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">Aidat</span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[0.65rem] font-semibold text-red-600 dark:bg-red-950/50">
              Ödenmedi
            </span>
          </div>
          <div className="mt-1 text-lg font-bold text-ink">{MOCK.invoice.amount}</div>
          <div className="text-xs text-ink-faint">Son ödeme: {MOCK.invoice.dueDate}</div>
        </div>

        <div className="rounded-xl border border-line p-4 sm:col-span-2">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">Duyuru</div>
          <div className="mt-1 text-sm font-semibold text-ink">{MOCK.announcement.title}</div>
          <p className="mt-1 text-sm text-ink-soft">{MOCK.announcement.body}</p>
        </div>
      </div>
    </div>
  );
}
