import Link from "next/link";
import ServiceIcon from "@/components/ServiceIcon";
import type { Service } from "@/types/content";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-brume bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu-600"
    >
      {/* Liseré ocre qui apparaît au survol (sceau discret). */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-ocre-500 transition-transform duration-300 group-hover:scale-x-100"
      />
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-bleu-50 text-bleu-700 transition-colors duration-300 group-hover:bg-bleu-100">
        <ServiceIcon name={service.icon} />
      </div>
      <h3 className="font-serif text-lg font-semibold text-encre transition-colors group-hover:text-bleu-700">
        {service.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ardoise">
        {service.shortDescription}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ocre-600">
        En savoir plus
        <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}
