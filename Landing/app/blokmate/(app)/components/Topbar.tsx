"use client";

import { useRouter } from "next/navigation";
import { useBlokmateAuth } from "@/lib/blokmate-auth-context";

const ROLE_LABELS: Record<string, string> = {
  manager: "Yönetici",
  resident: "Sakin",
  accountant: "Muhasebe",
  auditor: "Denetçi",
  staff: "Personel",
};

export default function Topbar() {
  const router = useRouter();
  const { session, claims, signOut } = useBlokmateAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/blokmate/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 md:px-6">
      <div className="text-sm text-ink-faint">
        {claims ? ROLE_LABELS[claims.role] ?? claims.role : "Rol bekleniyor…"}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-ink-soft sm:inline">{session?.user.email}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="min-h-[40px] rounded-lg border border-line px-3 text-sm font-medium text-ink-soft hover:border-blue-500 hover:text-blue-600"
        >
          Çıkış yap
        </button>
      </div>
    </header>
  );
}
