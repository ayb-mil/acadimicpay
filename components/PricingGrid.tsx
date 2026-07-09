import type { PricingGrid as PricingGridData } from "@/types/content";

/**
 * Barème tarifaire par paliers de montant + exemple de calcul concret.
 * Contenu éditable dans content/fr/pricing.json.
 */
export default function PricingGrid({ grid }: { grid: PricingGridData }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-brume shadow-card">
        <table className="min-w-full divide-y divide-brume text-left text-sm">
          <thead className="bg-bleu-50">
            <tr>
              <th scope="col" className="px-5 py-3 font-serif font-semibold text-encre">
                Montant du paiement
              </th>
              <th scope="col" className="px-5 py-3 font-serif font-semibold text-encre">
                Nos frais
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brume bg-white">
            {grid.tiers.map((tier) => (
              <tr key={tier.range} className="transition-colors hover:bg-papier">
                <td className="px-5 py-4 font-medium text-encre">{tier.range}</td>
                <td className="px-5 py-4 text-ardoise">{tier.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exemple de calcul concret. */}
      <div className="mt-5 rounded-xl border border-ocre-200 bg-ocre-50/60 p-5">
        <p className="flex gap-3 text-sm leading-relaxed text-encre">
          <span
            aria-hidden="true"
            className="mt-0.5 h-5 w-1 shrink-0 rounded-full bg-ocre-500"
          />
          <span>{grid.example}</span>
        </p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ardoise">{grid.exchangeNote}</p>
    </div>
  );
}
