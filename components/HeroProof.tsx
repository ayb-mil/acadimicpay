/**
 * Panneau latéral du hero (desktop).
 *
 * Matérialise la promesse centrale — « une preuve pour chaque opération » —
 * sans fausse donnée ni faux justificatif : on liste honnêtement ce que le
 * client reçoit réellement (facture, reçu, référence). Sobre et statique.
 *
 * Une légère profondeur est donnée par une carte décalée à l'arrière
 * (effet « documents empilés »), sans animation ni rotation continue.
 */

const ITEMS = [
  {
    title: "Facture officielle du fournisseur",
    caption: "Émise à votre nom par l'éditeur ou la plateforme.",
  },
  {
    title: "Reçu de paiement daté",
    caption: "La confirmation du règlement effectué à l'étranger.",
  },
  {
    title: "Référence de transaction",
    caption: "Un identifiant vérifiable pour vos justificatifs.",
  },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12.5l4 4 10-10" />
    </svg>
  );
}

export default function HeroProof() {
  return (
    <div className="relative">
      {/* Carte fantôme à l'arrière : profondeur discrète (documents empilés). */}
      <div
        aria-hidden="true"
        className="absolute -right-3 -top-3 h-full w-full rounded-2xl border border-brume bg-ocre-50/60"
      />

      <div className="relative rounded-2xl border border-brume bg-white p-7 shadow-card">
        {/* Sceau discret en coin. */}
        <span
          aria-hidden="true"
          className="absolute -right-3 -top-3 flex h-12 w-12 rotate-6 items-center justify-center rounded-full border border-ocre-200 bg-papier text-[10px] font-bold uppercase tracking-wide text-ocre-600 shadow-sm"
        >
          Payé
        </span>

        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ocre-600">
          <span className="h-px w-6 bg-ocre-400" aria-hidden="true" />
          Ce que vous recevez
        </p>
        <h2 className="mt-3 font-serif text-xl font-semibold text-encre">
          Une preuve pour chaque opération
        </h2>

        <ul className="mt-6 space-y-4">
          {ITEMS.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bleu-700 text-white">
                <CheckIcon />
              </span>
              <span>
                <span className="block text-sm font-semibold text-encre">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ardoise">
                  {item.caption}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-2 border-t border-brume pt-4 text-xs font-medium text-bleu-700">
          <span className="h-1.5 w-1.5 rounded-full bg-ocre-500" aria-hidden="true" />
          Traçabilité complète, du dirham au reçu.
        </div>
      </div>
    </div>
  );
}
