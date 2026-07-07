import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import TestimonialCard from "@/components/TestimonialCard";
import Reveal from "@/components/Reveal";
import { getTestimonials } from "@/lib/content";

export const metadata: Metadata = {
  title: "Témoignages",
  description: "Avis de chercheurs et enseignants-chercheurs ayant utilisé le service.",
};

export default function TestimonialsPage() {
  const testimonials = getTestimonials();

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading eyebrow="Témoignages" title="Ce qu'en disent les chercheurs" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Reveal key={testimonial.id} delay={index * 90}>
            <TestimonialCard testimonial={testimonial} />
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
