import type { Metadata } from "next";
import { BlokmateLanguageProvider } from "@/hooks/useBlokmateLanguage";
import { BlokmateAuthProvider } from "@/lib/blokmate-auth-context";

export const metadata: Metadata = {
  title: "BlokMate | Apartman ve Site Yönetiminde Dijital Rahatlık",
  description:
    "BlokMate; aidat takibi, tahsilat, duyurular ve arıza taleplerini tek panelde toplayan apartman/site yönetim yazılımı.",
  alternates: { canonical: "/blokmate" },
};

export default function BlokmateLayout({ children }: { children: React.ReactNode }) {
  return (
    <BlokmateLanguageProvider>
      <BlokmateAuthProvider>{children}</BlokmateAuthProvider>
    </BlokmateLanguageProvider>
  );
}
