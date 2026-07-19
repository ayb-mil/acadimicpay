import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import PricingGrid from "@/components/PricingGrid";
import DotationCalculator from "@/components/DotationCalculator";
import CTAButton from "@/components/CTAButton";
import { getPricingGrid } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Grille tarifaire transparente pour chaque service de paiement académique.",
};

export default function PricingPage() {
  const pricingGrid = getPricingGrid();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Tarifs"
        title="Une commission connue à l'avance, jamais de frais caché"
        description="Nos frais dépendent uniquement du montant à régler. Le barème est fixe et communiqué avant tout paiement."
      />
      <div className="mt-10 max-w-3xl">
        <PricingGrid grid={pricingGrid} />
      </div>
      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ardoise">
        Le montant exact vous est toujours confirmé avant que vous ne régliez quoi que ce soit.
      </p>
      <div className="mt-12 max-w-3xl">
        <DotationCalculator />
      </div>

      <div className="mt-10">
        <CTAButton href="/contact">Demander un devis précis</CTAButton>
      </div>
    </Container>
  );
}
