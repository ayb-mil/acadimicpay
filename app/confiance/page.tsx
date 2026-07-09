import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import TrustPoints from "@/components/TrustPoints";
import CaseStudyCard from "@/components/CaseStudyCard";
import { getSiteContent, getCaseStudy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Confiance",
  description: "Transparence, identité et sécurité : les garanties du service.",
};

export default function TrustPage() {
  const site = getSiteContent();
  const caseStudy = getCaseStudy();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Confiance"
        title="Qui je suis, et pourquoi vous pouvez me faire confiance"
        description="La confiance est l'argument central de ce service : elle se construit par la transparence, pas par des promesses."
      />

      {/* Bloc fondateur : photo cliquable + présentation. */}
      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start">
        {site.founder.photo && (
          <div className="shrink-0">
            <a
              href={site.founder.photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-44"
              aria-label={site.founder.photoCaption ?? "Voir la publication originale"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={site.founder.photo}
                alt={`Portrait de ${site.founder.name}`}
                className="h-56 w-44 rounded-2xl object-cover shadow-card ring-1 ring-brume transition duration-300 group-hover:-translate-y-0.5 group-hover:ring-bleu-300"
              />
              {/* Badge lien externe : indique clairement que la photo est cliquable. */}
              <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-bleu-700 shadow ring-1 ring-brume">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M14 5h5v5M19 5l-8 8M11 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" />
                </svg>
              </span>
            </a>
            {site.founder.photoCaption && (
              <a
                href={site.founder.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-bleu-700 hover:underline"
              >
                {site.founder.photoCaption}
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {/* Carte claire : « cliquez sur la photo ». */}
            <p className="mt-3 w-44 rounded-lg border border-brume bg-bleu-50/50 px-3 py-2 text-xs leading-relaxed text-ardoise">
              Cliquez sur la photo pour voir la publication originale sur la page officielle de
              l&apos;ENS Meknès.
            </p>
          </div>
        )}

        <div className="max-w-2xl">
          <h3 className="font-serif text-xl font-semibold text-encre">{site.founder.name}</h3>
          {site.founder.bio && (
            <p className="mt-3 text-sm leading-relaxed text-ardoise">{site.founder.bio}</p>
          )}
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ardoise">
            <p>
              Ce service est né d&apos;un constat vécu directement : la dotation e-commerce
              individuelle bloque régulièrement le règlement de frais académiques pourtant légitimes
              (publication, abonnements, examens).
            </p>
            <p>
              Mon affiliation académique réelle et mes coordonnées directes sont communiquées dès le
              premier contact. Un échange par appel est possible avant toute opération, en
              particulier pour les montants importants.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <TrustPoints points={site.trustPoints} />
      </div>

      <div className="mt-14 max-w-3xl">
        <CaseStudyCard caseStudy={caseStudy} />
        <p className="mt-6 text-sm leading-relaxed text-ardoise">
          Pour aller plus loin, consultez notre guide gratuit :{" "}
          <Link
            href="/verification/comment-reconnaitre-une-revue-predatrice"
            className="font-semibold text-bleu-700 hover:underline"
          >
            5 signaux d&apos;alerte d&apos;une revue prédatrice
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
