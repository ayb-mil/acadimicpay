"use client";

import { useMemo, useState } from "react";

/**
 * Calculateur de dotation — outil interactif, calcul entièrement côté client
 * (aucun backend). Donne une estimation indicative : le paiement entre-t-il
 * dans la dotation e-commerce individuelle annuelle (20 000 DH/an) ?
 *
 * Volontairement prudent : parle d'« estimation indicative », le taux de
 * change est approximatif et signalé comme tel.
 */

// Plafond réglementaire de la dotation e-commerce individuelle (DH / an).
const DOTATION_ANNUELLE = 20000;

// Taux de conversion approximatif USD → MAD (indicatif, non contractuel).
const APPROX_USD_TO_MAD = 10.1;

function formatDH(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Math.round(value)
  );
}

export default function DotationCalculator() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "MAD">("USD");
  const [used, setUsed] = useState("");

  const result = useMemo(() => {
    const rawAmount = parseFloat(amount.replace(",", "."));
    if (!rawAmount || rawAmount <= 0) return null;

    const amountMAD = currency === "USD" ? rawAmount * APPROX_USD_TO_MAD : rawAmount;

    const rawUsed = parseFloat(used.replace(",", ".")) || 0;
    const remaining = Math.max(0, DOTATION_ANNUELLE - Math.max(0, rawUsed));

    const fits = amountMAD <= remaining;
    const gap = fits ? 0 : amountMAD - remaining;

    return { amountMAD, remaining, fits, gap };
  }, [amount, currency, used]);

  return (
    <div className="rounded-2xl border border-brume bg-white p-6 shadow-card sm:p-8">
      <h3 className="font-serif text-xl font-semibold text-encre">
        Calculateur de dotation
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ardoise">
        Estimez si votre paiement entre dans votre dotation e-commerce annuelle
        restante.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {/* Montant à régler + devise */}
        <div>
          <label htmlFor="calc-amount" className="block text-sm font-medium text-encre">
            Montant à régler
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="calc-amount"
              inputMode="decimal"
              placeholder="ex : 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-brume bg-white px-3 py-2 text-sm text-encre transition-colors focus:border-bleu-500 focus:outline-none focus:ring-1 focus:ring-bleu-500"
            />
            <select
              aria-label="Devise"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "USD" | "MAD")}
              className="rounded-md border border-brume bg-white px-2 py-2 text-sm text-encre transition-colors focus:border-bleu-500 focus:outline-none focus:ring-1 focus:ring-bleu-500"
            >
              <option value="USD">USD</option>
              <option value="MAD">DH</option>
            </select>
          </div>
          {currency === "USD" && result && (
            <p className="mt-1 text-xs text-ardoise">
              ≈ {formatDH(result.amountMAD)} DH (taux approximatif)
            </p>
          )}
        </div>

        {/* Montant déjà utilisé (optionnel) */}
        <div>
          <label htmlFor="calc-used" className="block text-sm font-medium text-encre">
            Déjà utilisé cette année{" "}
            <span className="font-normal text-ardoise">(optionnel, en DH)</span>
          </label>
          <input
            id="calc-used"
            inputMode="decimal"
            placeholder="ex : 4000"
            value={used}
            onChange={(e) => setUsed(e.target.value)}
            className="mt-1 w-full rounded-md border border-brume bg-white px-3 py-2 text-sm text-encre transition-colors focus:border-bleu-500 focus:outline-none focus:ring-1 focus:ring-bleu-500"
          />
        </div>
      </div>

      {/* Résultat dynamique */}
      {result && (
        <div
          className={`mt-6 rounded-xl border p-4 text-sm leading-relaxed ${
            result.fits
              ? "border-bleu-200 bg-bleu-50 text-bleu-800"
              : "border-ocre-200 bg-ocre-50 text-ocre-700"
          }`}
          role="status"
          aria-live="polite"
        >
          {result.fits ? (
            <p>
              <strong>Ce montant entre dans votre dotation annuelle restante</strong>{" "}
              ({formatDH(result.remaining)} DH disponibles). Un paiement direct par
              carte est possible.
            </p>
          ) : (
            <p>
              <strong>
                Ce montant dépasse votre dotation restante de {formatDH(result.gap)} DH.
              </strong>{" "}
              Une solution alternative est possible —{" "}
              <a href="/contact" className="font-semibold underline">
                contactez-nous
              </a>{" "}
              pour en discuter.
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ardoise">
        Ce calculateur donne une estimation indicative basée sur la réglementation
        en vigueur (20 000 DH/an pour le e-commerce individuel) ; le montant exact
        peut dépendre de votre banque.
      </p>
    </div>
  );
}
