import type { TrustPoint } from "@/types/content";

export default function TrustPoints({ points }: { points: TrustPoint[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {points.map((point) => (
        <div
          key={point.title}
          className="relative rounded-xl border border-brume bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-6 h-8 w-[3px] rounded-r bg-ocre-500"
          />
          <h3 className="font-serif text-base font-semibold text-encre">{point.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ardoise">{point.description}</p>
        </div>
      ))}
    </div>
  );
}
