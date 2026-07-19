import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ServiceIcon from "@/components/ServiceIcon";
import CTAButton from "@/components/CTAButton";
import { getServiceBySlug, getServices } from "@/lib/content";

export function generateStaticParams() {
  return getServices().map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const service = getServiceBySlug(params.slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.shortDescription,
  };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = getServiceBySlug(params.slug);
  if (!service) notFound();

  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-bleu-50 text-bleu-700">
          <ServiceIcon name={service.icon} className="h-7 w-7" />
        </div>
        <SectionHeading title={service.title} description={service.intro} />

        <ul className="mt-8 space-y-4">
          {service.details.map((detail) => (
            <li key={detail} className="flex gap-3 text-sm leading-relaxed text-ardoise">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ocre-500" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-xl border border-brume bg-bleu-50/40 p-5">
          <p className="font-serif text-sm font-semibold text-encre">Pour qui ?</p>
          <p className="mt-1 text-sm leading-relaxed text-ardoise">{service.whoFor}</p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <CTAButton href="/contact">Demander ce service</CTAButton>
          <CTAButton href="/tarifs" variant="secondary">
            Voir les tarifs
          </CTAButton>
        </div>
      </div>
    </Container>
  );
}
