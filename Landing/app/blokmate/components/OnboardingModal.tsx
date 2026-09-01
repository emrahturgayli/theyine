"use client";

import { useEffect, useState } from "react";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { trackEvent } from "@/lib/analytics";
import MiniDemo from "./MiniDemo";
import styles from "../styles/onboarding.module.css";

const STORAGE_KEY = "blokmate_onboarded";
const TOTAL_STEPS = 3;

/**
 * First-visit walkthrough for /blokmate. Shows once per browser — checked
 * via localStorage, not cookies/server state, since "has this visitor seen
 * the tour" has no need to be known server-side or synced across devices.
 * Rendered from app/blokmate/page.tsx; returns null after the flag is set
 * or before the client-side check has run (avoids a hydration-mismatch
 * flash of the modal on every reload).
 */
export default function OnboardingModal() {
  const { t } = useBlokmateLanguage();
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "true") {
        setOpen(true);
        trackEvent("blokmate_onboarding_shown");
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — skip the tour
      // rather than risk showing it on every single page load.
    }
  }, []);

  function dismiss(reason: "skip" | "start" | "demo") {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Nothing to do if storage isn't available — worst case the tour
      // reappears next visit, which is harmless.
    }
    trackEvent("blokmate_onboarding_dismissed", reason);
    setOpen(false);
  }

  if (!open) return null;

  const stepLabel = t("onboarding.stepLabel")
    .replace("{current}", String(step))
    .replace("{total}", String(TOTAL_STEPS));

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t("onboarding.title")}>
      <div className={styles.card}>
        <button
          type="button"
          className={styles.skip}
          onClick={() => dismiss("skip")}
          aria-label={t("onboarding.skip")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className={styles.stepIndicators} role="status" aria-live="polite">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={`${styles.stepDot} ${i + 1 === step ? styles.stepDotActive : ""}`}
            />
          ))}
          <span className="sr-only">{stepLabel}</span>
        </div>

        <h2 className={styles.title}>{t("onboarding.title")}</h2>
        <p className={styles.body}>
          {step === 1 && t("onboarding.step1")}
          {step === 2 && t("onboarding.step2")}
          {step === 3 && t("onboarding.step3")}
        </p>

        {step === 3 && (
          <div className={styles.demoWrap}>
            <MiniDemo compact />
          </div>
        )}

        <div className={styles.actions}>
          {step < TOTAL_STEPS ? (
            <button type="button" className={styles.ctaPrimary} onClick={() => setStep((s) => s + 1)}>
              {t("onboarding.next")}
            </button>
          ) : (
            <>
              <button type="button" className={styles.ctaPrimary} onClick={() => dismiss("start")}>
                {t("onboarding.ctaStart")}
              </button>
              <a href="#demo" className={styles.ctaSecondary} onClick={() => dismiss("demo")}>
                {t("onboarding.ctaDemo")}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
