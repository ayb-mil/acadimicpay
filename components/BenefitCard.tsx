import type { Benefit } from "@/types/content";

/**
 * Carte « bénéfice concret » (section « Ce que vous gagnez »).
 * Icône déterminée par la clé `icon` du contenu JSON — ajouter un bénéfice
 * = ajouter une entrée dans benefits.json (et éventuellement une icône ici).
 */

function BenefitIcon({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
    "aria-hidden": true,
  };

  switch (name) {
    case "no-crypto":
      // Pièce barrée : aucune crypto à manipuler.
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9.5 9.5h3.2a1.8 1.8 0 010 3.6H9.5M9.5 12.5h3M11 8v1.5M11 14.6V16" />
          <path d="M5 5l14 14" />
        </svg>
      );
    case "receipt":
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-2.5-1.5L13 21l-3-1.5L7 21l-1-1V3" />
          <path d="M9 8h6M9 11.5h4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20a6.5 6.5 0 0113 0" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 016.5 5H18a1 1 0 011 1v1H6.5" />
          <path d="M3 8h16a1 1 0 011 1v9a1 1 0 01-1 1H5a2 2 0 01-2-2V8z" />
          <circle cx="16.5" cy="13.5" r="1.2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
  }
}

export default function BenefitCard({ benefit }: { benefit: Benefit }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-brume bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-bleu-50 text-bleu-700">
        <BenefitIcon name={benefit.icon} />
      </div>
      <h3 className="font-serif text-base font-semibold text-encre">{benefit.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ardoise">{benefit.description}</p>
    </div>
  );
}
