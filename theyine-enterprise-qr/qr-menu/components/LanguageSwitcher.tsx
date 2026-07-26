// Header'daki BG/EN dil değiştirici. Next'in yerleşik locale routing'ini kullanır —
// aynı sayfada kalarak yalnızca locale değişir.

import Link from "next/link";
import { useRouter } from "next/router";

export default function LanguageSwitcher() {
  const { locale, asPath } = useRouter();
  return (
    <div className="lang-switch" aria-label="Language">
      <Link href={asPath} locale="bg" className={locale === "bg" ? "active" : ""}>
        BG
      </Link>
      <Link href={asPath} locale="en" className={locale === "en" ? "active" : ""}>
        EN
      </Link>
    </div>
  );
}
