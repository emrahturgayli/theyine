"use client";

import { useState, type FormEvent } from "react";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "loading" | "success" | "error";

/**
 * BlokMate's own lead form — posts to /api/blokmate/lead. Named the same
 * as the root components/LeadMagnet.tsx (used by /rakip-analizi) but lives
 * under components/blokmate/ so it doesn't collide with or overwrite it;
 * the two have different fields (building name/sector/website/email vs.
 * business name/sector/email) for a different product.
 */
export default function LeadMagnet() {
  const { dict } = useBlokmateLanguage();
  const form = dict.leadForm;

  const [buildingName, setBuildingName] = useState("");
  const [sector, setSector] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!buildingName.trim() || !sector || !email.trim()) {
      setStatus("error");
      setErrorMsg(form.errorRequired);
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/blokmate/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingName: buildingName.trim(),
          sector,
          website: website.trim() || undefined,
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(data.error === "invalid_email" ? form.errorInvalidEmail : form.errorGeneric);
        return;
      }

      trackEvent("cta_click", "blokmate_lead_submit", { sector });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg(form.errorGeneric);
    }
  }

  if (status === "success") {
    return (
      <div id="demo" className="card mx-auto max-w-md p-8 text-center shadow-soft">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3 className="mt-4 text-xl font-bold text-ink">{form.successTitle}</h3>
        <p className="mt-2 text-sm text-ink-soft">{form.successBody}</p>
      </div>
    );
  }

  const isSubmitting = status === "loading";

  return (
    <form id="demo" onSubmit={handleSubmit} className="card mx-auto max-w-md p-7 shadow-soft sm:p-9" noValidate>
      <h3 className="text-xl font-bold text-ink">{form.title}</h3>
      <p className="mt-2 text-sm text-ink-soft">{form.subtitle}</p>

      <div className="mt-7 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="blokmate-building" className="text-sm font-medium text-ink">
            {form.buildingNameLabel}
          </label>
          <input
            id="blokmate-building"
            type="text"
            required
            maxLength={200}
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            placeholder={form.buildingNamePlaceholder}
            className="rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-blue-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="blokmate-sector" className="text-sm font-medium text-ink">
            {form.sectorLabel}
          </label>
          <select
            id="blokmate-sector"
            required
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="rounded-xl border border-line bg-canvas px-4 py-3 text-ink outline-none transition-colors focus:border-blue-600"
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
          <label htmlFor="blokmate-website" className="text-sm font-medium text-ink">
            {form.websiteLabel}
          </label>
          <input
            id="blokmate-website"
            type="url"
            maxLength={300}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={form.websitePlaceholder}
            className="rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-blue-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="blokmate-email" className="text-sm font-medium text-ink">
            {form.emailLabel}
          </label>
          <input
            id="blokmate-email"
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={form.emailPlaceholder}
            className="rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-blue-600"
          />
        </div>

        {status === "error" && (
          <p role="alert" className="text-sm font-medium text-red-500">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn mt-1 w-full bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? form.ctaLoading : form.cta}
        </button>
      </div>
    </form>
  );
}
