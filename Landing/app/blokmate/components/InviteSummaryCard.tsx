"use client";

import type { PublicInvite } from "@/lib/blokmate-invites";

/**
 * Shared "here's what this invite resolves to" card — used on the
 * public invite-link page (app/blokmate/invite/[token]/page.tsx) and the
 * register page's typed-invite-code flow (app/blokmate/register/page.tsx),
 * so a resident sees the exact same, clearly labeled Site/Building/Unit
 * breakdown regardless of which door they came in through.
 */
export default function InviteSummaryCard({ invite }: { invite: PublicInvite }) {
  const rows = [
    { label: "Site", value: invite.tenantName },
    { label: "Bina", value: invite.buildingName },
    { label: "Daire", value: invite.unitLabel ?? "Yönetici belirleyecek" },
  ];

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/60 p-4 dark:border-green-900 dark:bg-green-950/20">
      <div className="flex items-center gap-2 text-xs font-semibold text-green-700 dark:text-green-400">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-white">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        Davet doğrulandı
      </div>
      <dl className="mt-3 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-ink-faint">{row.label}</dt>
            <dd className="font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
