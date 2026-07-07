import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import FaqAccordion from "@/components/FaqAccordion";
import { getFaq } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions fréquentes sur le règlement de paiements académiques internationaux.",
};

export default function FaqPage() {
  const faq = getFaq();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading eyebrow="FAQ" title="Questions fréquentes" />
      <div className="mt-10 max-w-2xl">
        <FaqAccordion items={faq} />
      </div>
    </Container>
  );
}
