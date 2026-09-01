"use client";

import Link from "next/link";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";

export default function Footer() {
  const { dict } = useBlokmateLanguage();
  const footer = dict.footer;

  return (
    <footer className="py-16">
      <div className="container-shell">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link href="/blokmate" className="flex items-center gap-2 text-lg font-bold text-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                B
              </span>
              BlokMate
            </Link>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">{footer.tagline}</p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {footer.quickLinksTitle}
            </div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li><a href="#how-it-works" className="text-ink-soft hover:text-ink">{footer.quickLinks.howItWorks}</a></li>
              <li><a href="#features" className="text-ink-soft hover:text-ink">{footer.quickLinks.features}</a></li>
              <li><a href="#pricing" className="text-ink-soft hover:text-ink">{footer.quickLinks.pricing}</a></li>
              <li><Link href="/blokmate/blog" className="text-ink-soft hover:text-ink">{footer.quickLinks.blog}</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {footer.supportTitle}
            </div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li><a href="mailto:hello@theyine.com" className="text-ink-soft hover:text-ink">{footer.supportLinks.contact}</a></li>
              <li><a href="#demo" className="text-ink-soft hover:text-ink">{footer.supportLinks.demo}</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {footer.legalTitle}
            </div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li><a href="#" className="text-ink-soft hover:text-ink">{footer.links.privacy}</a></li>
              <li><a href="#" className="text-ink-soft hover:text-ink">{footer.links.terms}</a></li>
              <li><a href="#" className="text-ink-soft hover:text-ink">{footer.links.gdpr}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6 text-xs text-ink-faint">{footer.rights}</div>
      </div>
    </footer>
  );
}
