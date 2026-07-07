import Link from "next/link";
import type { UiDictionary } from "@/types/content";

export default function Footer({
  siteName,
  dictionary,
}: {
  siteName: string;
  dictionary: UiDictionary;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brume bg-white">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-serif text-base font-semibold text-bleu-700">{siteName}</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ardoise">
              {dictionary.footer.madeFor}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-ardoise">
            <Link
              href="/verification/comment-reconnaitre-une-revue-predatrice"
              className="transition-colors hover:text-bleu-700"
            >
              Reconnaître une revue prédatrice
            </Link>
            <Link href="/mentions-legales" className="transition-colors hover:text-bleu-700">
              {dictionary.footer.legalMentions}
            </Link>
            <Link href="/contact" className="transition-colors hover:text-bleu-700">
              {dictionary.nav.contact}
            </Link>
          </div>
        </div>
        <p className="mt-8 border-t border-brume pt-6 text-xs text-ardoise/70">
          © {year} {siteName}. {dictionary.footer.rightsReserved}
        </p>
      </div>
    </footer>
  );
}
