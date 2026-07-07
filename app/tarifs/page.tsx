import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import PricingTable from "@/components/PricingTable";
import DotationCalculator from "@/components/DotationCalculator";
import CTAButton from "@/components/CTAButton";
import { getPricing } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Grille tarifaire transparente pour chaque service de paiement académique.",
};

export default function PricingPage() {
  const pricing = getPricing();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Tarifs"
        title="Une commission connue à l'avance, jamais de frais caché"
        description="Le taux ou le forfait de commission est confirmé avant tout paiement. Le taux de change appliqué est celui du jour du règlement."
      />
      <div className="mt-10">
        <PricingTable items={pricing} />
      </div>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ardoise">
        Ces montants sont indicatifs et peuvent être ajustés selon la complexité de l&apos;opération
        (nombre de fournisseurs, urgence, devise). Le montant exact vous est toujours communiqué
        avant que vous ne régliez quoi que ce soit.
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
