import type { PricingItem } from "@/types/content";

export default function PricingTable({ items }: { items: PricingItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brume shadow-card">
      <table className="min-w-full divide-y divide-brume text-left text-sm">
        <thead className="bg-bleu-50">
          <tr>
            <th scope="col" className="px-4 py-3 font-serif font-semibold text-encre">Service</th>
            <th scope="col" className="px-4 py-3 font-serif font-semibold text-encre">Commission</th>
            <th scope="col" className="px-4 py-3 font-serif font-semibold text-encre">Exemple</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brume bg-white">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-papier">
              <td className="px-4 py-4 font-medium text-encre">{item.service}</td>
              <td className="px-4 py-4 text-ardoise">{item.commissionDetail}</td>
              <td className="px-4 py-4 text-ardoise">{item.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
