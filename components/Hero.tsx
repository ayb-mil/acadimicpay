import CTAButton from "@/components/CTAButton";
import HeroProof from "@/components/HeroProof";

export default function Hero({
  tagline,
  shortPitch,
}: {
  tagline: string;
  shortPitch: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-brume bg-gradient-to-b from-bleu-50/60 to-papier">
      {/* Filet supérieur ocre : discret rappel du « cachet » de la maison. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-bleu-600 via-bleu-400 to-ocre-500" />

      <div className="mx-auto grid max-w-content items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
        {/* Colonne gauche : le message. */}
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brume bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bleu-700">
            <span className="h-1.5 w-1.5 rounded-full bg-ocre-500" aria-hidden="true" />
            Paiements académiques internationaux
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-encre sm:text-5xl lg:text-[3.25rem]">
            {tagline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ardoise">{shortPitch}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <CTAButton href="/contact">Nous contacter</CTAButton>
            <CTAButton href="/services" variant="secondary">
              Voir les services
            </CTAButton>
          </div>
        </div>

        {/* Colonne droite : panneau de preuve (desktop uniquement). */}
        <div className="hidden lg:block">
          <HeroProof />
        </div>
      </div>
    </section>
  );
}
