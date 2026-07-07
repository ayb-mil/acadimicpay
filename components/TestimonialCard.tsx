import type { Testimonial } from "@/types/content";

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="relative flex h-full flex-col rounded-xl border border-brume bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
      {/* Guillemet décoratif serif, en ocre pâle. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-2 font-serif text-5xl leading-none text-ocre-100"
      >
        &rdquo;
      </span>
      <blockquote className="relative flex-1 text-sm leading-relaxed text-encre/90">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-5 border-t border-brume pt-4">
        <p className="text-sm font-semibold text-encre">{testimonial.name}</p>
        <p className="mt-0.5 text-xs text-ardoise">
          {testimonial.role} · {testimonial.affiliation}
        </p>
      </figcaption>
    </figure>
  );
}
