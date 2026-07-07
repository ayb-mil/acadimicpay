"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ÉLÉMENT SIGNATURE — « Le trajet du paiement ».
 *
 * Visualise la promesse centrale du service (la traçabilité) :
 *   Dirham  →  Fournisseur international  →  Reçu + référence
 *
 * Comportement :
 *  - Quand la section entre dans le viewport, une ligne se « dessine »
 *    (dégradé bleu → ocre) et les trois jalons se révèlent en séquence.
 *  - Horizontal sur desktop, vertical sur mobile.
 *  - `prefers-reduced-motion` : tout est affiché immédiatement, sans tracé
 *    ni décalage (géré via l'état `active` forcé à true).
 *
 * Ce n'est PAS un objet 3D décoratif : chaque nœud porte du sens
 * (l'argent part en dirhams, le fournisseur est réglé, la preuve revient).
 */

type Node = {
  label: string;
  caption: string;
  icon: "dirham" | "transfer" | "receipt";
};

const NODES: Node[] = [
  {
    label: "Vous réglez en dirhams",
    caption: "Virement bancaire ou Cash Plus, après confirmation du montant et de la commission.",
    icon: "dirham",
  },
  {
    label: "Je règle le fournisseur",
    caption: "Paiement effectué directement auprès de l'éditeur, de la plateforme ou du service.",
    icon: "transfer",
  },
  {
    label: "Vous recevez la preuve",
    caption: "Facture, reçu et référence de transaction pour vos justificatifs.",
    icon: "receipt",
  },
];

function Icon({ name }: { name: Node["icon"] }) {
  const common = {
    className: "h-6 w-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "dirham") {
    // Pièces empilées : la valeur de départ, en monnaie locale.
    return (
      <svg {...common}>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
        <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
      </svg>
    );
  }

  if (name === "transfer") {
    // Globe + flèche : le règlement part à l'international.
    return (
      <svg {...common}>
        <circle cx="11" cy="12" r="7" />
        <path d="M4 12h14M11 5c2 2.2 2 11.8 0 14M11 5c-2 2.2-2 11.8 0 14" />
        <path d="M16 6l4-2-2 4" />
      </svg>
    );
  }

  // Reçu avec coche : la preuve revient, documentée.
  return (
    <svg {...common}>
      <path d="M7 3h10a1 1 0 011 1v16l-2.5-1.5L13 20l-2.5-1.5L8 20l-2.5-1.5L3 20V6" />
      <path d="M9 9h6M9 12.5h4" />
      <path d="M14.5 15.5l1.4 1.4 2.6-2.8" />
    </svg>
  );
}

export default function PaymentJourney() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Reduced-motion : on affiche l'état final sans jouer le tracé.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-brume bg-white p-6 shadow-card sm:p-10"
    >
      <ol className="relative grid gap-8 sm:grid-cols-3 sm:gap-6">
        {/* Ligne connectrice — desktop (horizontale) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-7 hidden h-[2px] bg-brume sm:block"
        >
          <div
            className="h-full origin-left bg-gradient-to-r from-bleu-500 to-ocre-500 transition-transform duration-[1100ms] ease-out"
            style={{ transform: active ? "scaleX(1)" : "scaleX(0)" }}
          />
        </div>

        {/* Ligne connectrice — mobile (verticale) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-8 left-7 top-8 w-[2px] bg-brume sm:hidden"
        >
          <div
            className="w-full origin-top bg-gradient-to-b from-bleu-500 to-ocre-500 transition-transform duration-[1100ms] ease-out"
            style={{ transform: active ? "scaleY(1)" : "scaleY(0)" }}
          />
        </div>

        {NODES.map((node, index) => (
          <li
            key={node.label}
            className="relative flex gap-4 transition-all duration-700 ease-out sm:flex-col sm:gap-0"
            style={{
              transitionDelay: active ? `${250 + index * 300}ms` : "0ms",
              opacity: active ? 1 : 0,
              transform: active ? "translateY(0)" : "translateY(10px)",
            }}
          >
            {/* Jalon numéroté */}
            <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brume bg-papier text-bleu-700 shadow-sm">
              <Icon name={node.icon} />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ocre-500 text-[11px] font-bold text-white">
                {index + 1}
              </span>
            </div>

            <div className="sm:mt-5">
              <p className="font-serif text-base font-semibold text-encre">
                {node.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ardoise">
                {node.caption}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
