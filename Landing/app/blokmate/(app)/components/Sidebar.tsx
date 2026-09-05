"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { buildingWordPlural } from "@/lib/blokmate-terms";

export default function Sidebar() {
  const pathname = usePathname();
  const { claims } = useBlokmateAuth();
  const { lang } = useBlokmateLanguage();
  const isResident = claims?.role === "resident";

  const NAV_ITEMS = isResident
    ? [
        { href: "/blokmate/dashboard", label: "Panel" },
        { href: "/blokmate/announcements", label: "Duyurular" },
        { href: "/blokmate/tickets", label: "Talepler" },
      ]
    : [
        { href: "/blokmate/dashboard", label: "Panel" },
        { href: "/blokmate/buildings", label: buildingWordPlural(lang) },
        { href: "/blokmate/units", label: "Daireler" },
        { href: "/blokmate/invoices", label: "Aidatlar" },
        { href: "/blokmate/payments", label: "Ödemeler" },
        { href: "/blokmate/announcements", label: "Duyurular" },
        { href: "/blokmate/tickets", label: "Talepler" },
      ];

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:block">
      <div className="flex h-16 items-center border-b border-line px-6">
        <Link href="/blokmate" className="text-lg font-bold text-ink">
          Blok<span className="text-blue-600">Mate</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-blue-600 text-white" : "text-ink-soft hover:bg-mist"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
