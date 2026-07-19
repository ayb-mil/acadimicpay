import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import CTAButton from "@/components/CTAButton";
import { getPredatoryGuide } from "@/lib/content";

export const metadata: Metadata = {
  title: "Reconnaître une revue prédatrice",
  description:
    "Guide gratuit : 5 signaux d'alerte pour identifier une revue scientifique prédatrice avant de payer des frais de publication.",
};

export default function PredatoryGuidePage() {
  const guide = getPredatoryGuide();

  return (
    <Container className="py-16 sm:py-20">
      <div className="max-w-3xl">
        <SectionHeading
          eyebrow="Vérification — guide gratuit"
          title={guide.title}
          description={guide.intro}
        />

        <ol className="mt-10 space-y-4">
          {guide.signals.map((signal, index) => (
            <li
              key={signal.title}
              className="flex gap-4 rounded-xl border border-brume bg-white p-5 shadow-card"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocre-100 font-serif text-sm font-semibold text-ocre-700">
                {index + 1}
              </span>
              <div>
                <h3 className="font-serif text-base font-semibold text-encre">
                  {signal.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ardoise">
                  {signal.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Encart d'appel à l'action : vérification gratuite avant paiement. */}
        <div className="mt-12 rounded-2xl border border-bleu-200 bg-bleu-50 p-6 sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-encre">
            {guide.ctaTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ardoise">{guide.ctaText}</p>
          <div className="mt-6">
            <CTAButton href="/contact">Faire vérifier gratuitement</CTAButton>
          </div>
        </div>
      </div>
    </Container>
  );
}
