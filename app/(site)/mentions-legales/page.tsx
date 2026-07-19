import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales et conditions d'utilisation du service.",
};

export default function LegalPage() {
  const site = getSiteContent();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading eyebrow="Mentions légales" title="Mentions légales et conditions" />

      <div className="mt-10 max-w-2xl space-y-6 text-sm leading-relaxed text-ardoise">
        <section>
          <h2 className="font-serif text-base font-semibold text-encre">Éditeur du site</h2>
          <p className="mt-2">
            {site.founder.name} — {site.founder.status}, {site.founder.affiliation}. Contact :{" "}
            {site.contact.email}.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-base font-semibold text-encre">Nature du service</h2>
          <p className="mt-2">
            Ce site est un site vitrine de prise de contact. Il ne propose aucune passerelle de
            paiement en ligne, aucun compte utilisateur, aucun portefeuille numérique et aucune
            intégration crypto. Chaque opération de paiement est négociée et confirmée
            individuellement par email ou WhatsApp après contact via ce site, puis réglée par les
            moyens décrits sur la page Contact.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-base font-semibold text-encre">Responsabilité</h2>
          <p className="mt-2">
            Le service agit en tant qu&apos;intermédiaire de paiement sur demande explicite du client,
            pour des frais académiques légitimes identifiés par le client (facture, référence de
            fournisseur). Une preuve de paiement (facture, reçu, référence de transaction) est
            systématiquement transmise pour chaque opération réalisée.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-base font-semibold text-encre">Données personnelles</h2>
          <p className="mt-2">
            Les informations transmises via le formulaire de contact (nom, coordonnées, service
            souhaité, montant, message) sont utilisées uniquement pour traiter votre demande.
            Elles ne sont ni revendues ni partagées avec des tiers.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-base font-semibold text-encre">Cookies</h2>
          <p className="mt-2">
            Ce site n&apos;utilise pas de cookies de suivi publicitaire ni d&apos;outils d&apos;analyse tiers
            intrusifs.
          </p>
        </section>
      </div>
    </Container>
  );
}
