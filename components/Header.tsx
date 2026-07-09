"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UiDictionary } from "@/types/content";

const links = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/services/verification", key: "verification" },
  { href: "/comment-ca-marche", key: "howItWorks" },
  { href: "/tarifs", key: "pricing" },
  { href: "/confiance", key: "trust" },
  { href: "/faq", key: "faq" },
];

export default function Header({
  siteName,
  dictionary,
}: {
  siteName: string;
  dictionary: UiDictionary;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brume bg-papier/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-serif text-lg font-semibold tracking-tight text-bleu-700"
        >
          {siteName}
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-ocre-500 after:transition-all after:duration-300 ${
                pathname === link.href
                  ? "text-encre after:w-full"
                  : "text-ardoise after:w-0 hover:text-encre hover:after:w-full"
              }`}
            >
              {dictionary.nav[link.key]}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-bleu-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-bleu-800"
          >
            {dictionary.cta.contactUs}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-ardoise lg:hidden"
          aria-expanded={open}
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-brume bg-papier lg:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-bleu-50 text-bleu-700"
                    : "text-ardoise hover:bg-white"
                }`}
              >
                {dictionary.nav[link.key]}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-bleu-700 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              {dictionary.cta.contactUs}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
