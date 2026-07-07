import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import StepsList from "@/components/StepsList";
import CTAButton from "@/components/CTAButton";
import PaymentJourney from "@/components/PaymentJourney";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Le processus étape par étape pour régler un paiement académique international.",
};

export default function HowItWorksPage() {
  const site = getSiteContent();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Comment ça marche"
        title="Un cycle simple, entièrement traçable"
        description="Vous réglez en dirhams, je règle le fournisseur à l'étranger, vous recevez la preuve de paiement. Chaque étape est documentée."
      />

      {/* Élément signature : le trajet du paiement, révélé au scroll. */}
      <div className="mt-12">
        <PaymentJourney />
      </div>

      <div className="mt-14">
        <StepsList steps={site.steps} />
      </div>

      <div className="mt-12 max-w-2xl space-y-4 text-sm leading-relaxed text-ardoise">
        <p>
          <strong>1. Vous envoyez votre demande.</strong> Décrivez le service souhaité (revue,
          abonnement, examen…), le fournisseur concerné et le montant en devise. Je confirme la
          faisabilité et la commission avant tout engagement.
        </p>
        <p>
          <strong>2. Vous réglez en dirhams.</strong> Par virement bancaire ou Cash Plus, selon les
          modalités communiquées après confirmation.
        </p>
        <p>
          <strong>3. Je règle le fournisseur international.</strong> Le paiement est effectué
          directement auprès de l&apos;éditeur, de la plateforme d&apos;examen ou du service concerné, dans
          les délais annoncés.
        </p>
        <p>
          <strong>4. Vous recevez la preuve de paiement.</strong> Facture, reçu et référence de
          transaction vous sont transmis pour vos justificatifs administratifs ou de recherche.
        </p>
      </div>

      <div className="mt-10">
        <CTAButton href="/contact">Démarrer une demande</CTAButton>
      </div>
    </Container>
  );
}
