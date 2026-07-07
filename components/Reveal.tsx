"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Enveloppe de scroll-reveal légère.
 *
 * Le contenu apparaît (fondu + petite translation) lorsqu'il entre dans le
 * viewport, une seule fois. Sobre par conception.
 *
 * Garanties :
 *  - SSR-safe : sans JS, le contenu reste visible (voir fallback ci-dessous).
 *  - Accessibilité : `prefers-reduced-motion` neutralise l'effet (géré en CSS
 *    dans globals.css), et l'observer révèle de toute façon le contenu.
 *
 * @param as    Balise HTML de rendu (div par défaut).
 * @param delay Retard optionnel (ms) pour créer un léger effet d'escalier.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Si l'utilisateur préfère moins d'animations, on révèle immédiatement.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
