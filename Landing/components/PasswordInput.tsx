"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Password field with a show/hide toggle. Styled to match the input
 * fields already used on /blokmate/login and /blokmate/register (border-line/
 * bg-surface/text-ink tokens) rather than a generic style, so swapping the
 * plain <input type="password"> for this doesn't visually stand out.
 */
export default function PasswordInput({ className, id, ...rest }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        {...rest}
        id={id}
        type={visible ? "text" : "password"}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 pr-10 text-sm text-ink outline-none focus:border-blue-500"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint transition-colors hover:text-ink"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 3l18 18" />
            <path d="M10.58 10.58a3 3 0 0 0 4.24 4.24" />
            <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-3.17 3.88M6.61 6.61A13.16 13.16 0 0 0 1 12s4 7 11 7a10.94 10.94 0 0 0 5.11-1.25" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
