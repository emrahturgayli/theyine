"use client";

import { useState, type FormEvent } from "react";
import { TheyineMark } from "./Logo";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Lead Magnet — "AI Competitor & Content Intelligence Report".
 * Split hero: value proposition + trust strip on the left, the intake form
 * on the right. Submission posts to /api/lead (currently logs; will hand
 * off to the Apify scrape job + Composio delivery pipeline).
 */
export default function LeadMagnet() {
  const { dict } = useLanguage();
  const { hero, form } = dict.leadMagnet;

  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!businessName.trim() || !sector || !email.trim()) {
      setStatus("error");
      setErrorMsg(form.errorRequired);
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: businessName.trim(), sector, email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(data.error === "invalid_email" ? form.errorInvalidEmail : form.errorGeneric);
        return;
      }

      trackEvent("lead_submit", "dupnitsa_lead_magnet", { sector });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg(form.errorGeneric);
    }
  }

  if (status === "success") {
    return (
      <section
        id="lead-magnet"
        className="relative overflow-hidden border-b border-line py-24 md:py-32"
      >
        <div className="container-shell flex flex-col items-center text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-lavender-tint">
            <TheyineMark size={30} className="text-lavender" />
          </span>
          <h2 className="animate-fade-up mt-6 max-w-xl text-3xl font-bold tracking-tightest text-ink sm:text-4xl">
            {form.successTitle}
          </h2>
          <p className="animate-fade-up mt-4 max-w-md text-ink-soft" style={{ animationDelay: "100ms" }}>
            {form.successBody.replace("{businessName}", businessName.trim())}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="lead-magnet"
      className="relative overflow-hidden border-b border-line pt-20 pb-24 md:pt-28 md:pb-32"
    >
      {/* Ambient background — mirrors the primary Hero's lavender field */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-14rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-lavender-tint blur-3xl" />
        <div className="absolute right-[-10rem] bottom-0 h-72 w-72 rounded-full bg-lavender-soft/30 blur-3xl" />
      </div>

      <div className="container-shell grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        {/* Left — value proposition */}
        <div className="animate-fade-up flex flex-col items-start text-left">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
            {hero.badge}
          </span>

          <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.08] tracking-tightest text-ink sm:text-5xl">
            {hero.titleA}
            <span className="text-gradient">{hero.titleB}</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            {hero.subtitle}
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {hero.trust.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-ink-soft">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-lavender"
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — intake form */}
        <div
          className="card animate-fade-up w-full p-7 shadow-soft sm:p-9"
          style={{ animationDelay: "140ms" }}
        >
          <h2 className="text-xl font-bold text-ink">{form.title}</h2>
          <p className="mt-2 text-sm text-ink-soft">{form.subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="lead-business" className="text-sm font-medium text-ink">
                {form.businessNameLabel}
              </label>
              <input
                id="lead-business"
                type="text"
                required
                maxLength={200}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={form.businessNamePlaceholder}
                className="rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-lavender"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="lead-sector" className="text-sm font-medium text-ink">
                {form.sectorLabel}
              </label>
              <select
                id="lead-sector"
                required
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="rounded-xl border border-line bg-canvas px-4 py-3 text-ink outline-none transition-colors focus:border-lavender"
              >
                <option value="" disabled>
                  {form.sectorPlaceholder}
                </option>
                {form.sectors.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="lead-email" className="text-sm font-medium text-ink">
                {form.emailLabel}
              </label>
              <input
                id="lead-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={form.emailPlaceholder}
                className="rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-lavender"
              />
            </div>

            {status === "error" && (
              <p role="alert" className="text-sm font-medium text-red-500">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              onClick={() => trackEvent("cta_click", "lead_magnet_submit")}
              className="btn-primary mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? form.ctaLoading : form.cta}
            </button>

            <p className="text-center text-xs text-ink-faint">{form.privacyNote}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
