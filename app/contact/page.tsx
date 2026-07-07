import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";
import { getServices, getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez-nous par formulaire, email ou WhatsApp pour votre paiement académique.",
};

export default function ContactPage() {
  const services = getServices();
  const site = getSiteContent();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Contact"
        title="Parlons de votre besoin"
        description="Remplissez le formulaire ou écrivez directement sur WhatsApp. Réponse rapide avec le montant de la commission et les délais."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContactForm services={services} whatsappNumber={site.contact.whatsappNumber} />
        </div>
        <aside className="space-y-4 rounded-xl border border-brume bg-bleu-50/40 p-6 text-sm text-ardoise shadow-card">
          <div>
            <p className="font-serif font-semibold text-encre">Email</p>
            <a href={`mailto:${site.contact.email}`} className="text-bleu-700 hover:underline">
              {site.contact.email}
            </a>
          </div>
          <div>
            <p className="font-serif font-semibold text-encre">WhatsApp</p>
            <p>{site.contact.whatsappDisplay}</p>
          </div>
          <div>
            <p className="font-serif font-semibold text-encre">Délai de réponse</p>
            <p>Généralement sous 24h ouvrées.</p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
