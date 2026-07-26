// Merchant admin iskeleti: sol nav (Dashboard / Kampanyalar / Ayarlar) + çıkış.
// Token yoksa /admin/login'e yönlendirir; auth durumu localStorage'da tutulur.

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactNode } from "react";
import { useT } from "../lib/i18n";
import Layout from "./Layout";

export const TOKEN_KEY = "theyine-qr-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Auth'lu API çağrısı — 401'de login'e atar */
export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken() ?? ""}`,
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/admin/login";
  }
  return res;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    router.push("/admin/login");
  };

  const links = [
    { href: "/admin", label: t("nav.dashboard") },
    { href: "/admin/campaigns", label: t("nav.campaigns") },
    { href: "/admin/settings", label: t("nav.settings") },
  ];

  return (
    <Layout title={`${t("nav.dashboard")} | THEYINE QR`}>
      <div className="admin-shell">
        <aside className="admin-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={router.pathname === l.href ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            {t("nav.logout")}
          </a>
        </aside>
        <main className="admin-main">
          {ready ? children : <p>{t("admin.loading")}</p>}
        </main>
      </div>
    </Layout>
  );
}
