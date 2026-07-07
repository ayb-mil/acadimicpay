import Hero from "@/components/Hero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import StepsList from "@/components/StepsList";
import ServiceCard from "@/components/ServiceCard";
import BenefitCard from "@/components/BenefitCard";
import CaseStudyCard from "@/components/CaseStudyCard";
import TestimonialCard from "@/components/TestimonialCard";
import CTAButton from "@/components/CTAButton";
import Reveal from "@/components/Reveal";
import {
  getSiteContent,
  getServices,
  getTestimonials,
  getBenefits,
  getCaseStudy,
} from "@/lib/content";

export default function HomePage() {
  const site = getSiteContent();
  const services = getServices();
  const testimonials = getTestimonials().slice(0, 3);
  const benefits = getBenefits();
  const caseStudy = getCaseStudy();

  return (
    <>
      <Hero tagline={site.tagline} shortPitch={site.shortPitch} />

      <section className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Le processus"
              title="Trois étapes, une traçabilité complète"
              description="Chaque paiement suit le même cycle simple, documenté du début à la fin."
            />
          </Reveal>
          <Reveal className="mt-10" delay={120}>
            <StepsList steps={site.steps} />
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-brume bg-bleu-50/40 py-16 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Services"
              title="Ce que je peux régler pour vous"
              description="Un aperçu des paiements académiques internationaux pris en charge."
            />
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <Reveal key={service.slug} delay={index * 90}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Ce que vous gagnez concrètement"
              title="Des bénéfices concrets, vérifiables"
              description="Pas de promesses vagues : voici ce que le service vous apporte réellement, à chaque opération."
            />
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Reveal key={benefit.id} delay={index * 80}>
                <BenefitCard benefit={benefit} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-brume bg-bleu-50/40 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <CaseStudyCard caseStudy={caseStudy} preview />
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Témoignages"
              title="Ce qu'en disent les chercheurs"
            />
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial.id} delay={index * 90}>
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden border-t border-brume bg-bleu-800 py-16 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-bleu-400 via-ocre-400 to-ocre-500"
        />
        <Container>
          <Reveal>
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              Une question, un paiement à régler ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-bleu-100">
              Décrivez votre besoin, vous recevrez une réponse rapide avec le montant de la
              commission et les délais.
            </p>
            <div className="mt-8 flex justify-center">
              <CTAButton
                href="/contact"
                className="bg-white !text-bleu-800 hover:bg-bleu-50"
              >
                Nous contacter
              </CTAButton>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
