import type { SiteStep } from "@/types/content";

export default function StepsList({ steps }: { steps: SiteStep[] }) {
  return (
    <ol className="grid gap-6 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="group relative rounded-xl border border-brume bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bleu-700 font-serif text-sm font-semibold text-white">
              {index + 1}
            </span>
            <span className="h-px flex-1 bg-brume" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-serif text-base font-semibold text-encre">
            {step.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ardoise">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
