// Public sayfa iskeleti: sticky header (logo + nav + dil değiştirici) ve footer.
// Embed modunda (?embed=1) header/footer gizlenir — iframe içinde temiz görünüm.

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useT } from "../lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Layout({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const t = useT();
  const { query, pathname } = useRouter();
  const embedded = query.embed === "1";

  return (
    <>
      <Head>
        <title>{title || `${t("landing.title")} | THEYINE`}</title>
        <meta name="description" content={t("landing.subtitle")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {!embedded && (
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              THEY<span>INE</span> QR
            </Link>
            <nav className="nav">
              <Link
                href="/admin"
                className={pathname.startsWith("/admin") ? "active" : ""}
              >
                {t("nav.dashboard")}
              </Link>
              <LanguageSwitcher />
            </nav>
          </div>
        </header>
      )}

      {children}

      {!embedded && (
        <footer className="site-footer">
          <div className="container">
            THEYINE — Enterprise QR · {new Date().getFullYear()}
          </div>
        </footer>
      )}
    </>
  );
}
