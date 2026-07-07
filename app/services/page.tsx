import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import Reveal from "@/components/Reveal";
import { getServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Vue d'ensemble des services de paiement académique international.",
};

export default function ServicesPage() {
  const services = getServices();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Services"
        title="Tous les paiements académiques pris en charge"
        description="Chaque service suit le même engagement : transparence sur la commission, vérification préalable si nécessaire, et preuve de paiement systématique."
      />

      {/* Avantage structurel : préservation de la dotation du client. */}
      <div className="mt-8 flex max-w-3xl gap-3 rounded-xl border border-ocre-200 bg-ocre-50/60 p-5">
        <span
          aria-hidden="true"
          className="mt-0.5 h-5 w-1 shrink-0 rounded-full bg-ocre-500"
        />
        <p className="text-sm leading-relaxed text-encre">
          <strong className="font-semibold">Un avantage souvent méconnu :</strong> en
          passant par notre service, vous préservez votre propre dotation annuelle de
          change pour vos besoins personnels — nous réglons le paiement via notre canal,
          pas le vôtre.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, index) => (
          <Reveal key={service.slug} delay={index * 90}>
            <ServiceCard service={service} />
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
