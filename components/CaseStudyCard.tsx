import Link from "next/link";
import type { CaseStudy } from "@/types/content";

/**
 * Encart « étude de cas », visuellement différencié (fond ocre pâle + icône
 * d'alerte discrète).
 *
 * @param preview  Sur l'accueil : n'affiche que le 1er paragraphe + un lien
 *                 vers la version complète sur /confiance.
 */

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 3.5L21 19H3L12 3.5z" />
      <path d="M12 10v4M12 16.5v.01" />
    </svg>
  );
}

export default function CaseStudyCard({
  caseStudy,
  preview = false,
}: {
  caseStudy: CaseStudy;
  preview?: boolean;
}) {
  const paragraphs = preview ? caseStudy.paragraphs.slice(0, 1) : caseStudy.paragraphs;

  return (
    <article
      id="etude-de-cas"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-ocre-200 bg-ocre-50/60 shadow-card"
    >
      {/* Filet ocre en tête de l'encart. */}
      <div aria-hidden="true" className="h-1 w-full bg-ocre-500" />

      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocre-100 text-ocre-700">
            <AlertIcon />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ocre-700">
            {caseStudy.eyebrow}
          </p>
        </div>

        <h3 className="mt-4 font-serif text-xl font-semibold text-encre sm:text-2xl">
          {caseStudy.title}
        </h3>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-ardoise">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {preview ? (
          <Link
            href="/confiance#etude-de-cas"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-bleu-700 transition-colors hover:text-bleu-800"
          >
            Lire l&apos;étude de cas complète
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <p className="mt-6 border-t border-ocre-200 pt-5 text-sm font-medium italic leading-relaxed text-encre">
            {caseStudy.transition}
          </p>
        )}
      </div>
    </article>
  );
}
