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

      <div className="mt-10 max-w-2xl space-y-4 text-sm leading-relaxed text-ardoise">
        <p>
          Je m&apos;appelle <strong>{site.founder.name}</strong>, {site.founder.status} à{" "}
          {site.founder.affiliation}. Ce service est né d&apos;un constat vécu directement : la
          dotation e-commerce individuelle bloque régulièrement le règlement de frais académiques
          pourtant légitimes (publication, abonnements, examens).
        </p>
        <p>
          Mon affiliation académique réelle et mes coordonnées directes sont communiquées dès le
          premier contact. Un échange par appel est possible avant toute opération, en particulier
          pour les montants importants.
        </p>
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
