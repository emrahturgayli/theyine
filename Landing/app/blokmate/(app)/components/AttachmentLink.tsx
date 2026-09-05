"use client";

import { useState } from "react";
import { getBlokmateAttachmentUrl } from "@/lib/blokmate-attachments";

/** Resolves a stored attachment path to a signed URL on click, so the bucket stays private but attachments stay reachable. */
export default function AttachmentLink({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const url = await getBlokmateAttachmentUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-60"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
      {loading ? "Açılıyor…" : "Ek"}
    </button>
  );
}
