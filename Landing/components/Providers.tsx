"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";

/** Client-side context boundary for theme + language state. */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
