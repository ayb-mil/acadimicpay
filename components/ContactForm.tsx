"use client";

import { FormEvent, useMemo, useState } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Service } from "@/types/content";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm({
  services,
  whatsappNumber,
}: {
  services: Service[];
  whatsappNumber: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    serviceSlug: services[0]?.slug ?? "",
    amount: "",
    message: "",
  });

  const whatsappHref = useMemo(() => {
    const serviceTitle =
      services.find((service) => service.slug === form.serviceSlug)?.title ?? "";
    const lines = [
      `Bonjour, je m'appelle ${form.name || "___"}.`,
      `Service souhaité : ${serviceTitle || "___"}`,
      form.amount ? `Montant approximatif : ${form.amount}` : null,
      form.message ? `Message : ${form.message}` : null,
    ].filter(Boolean);
    return buildWhatsAppLink(whatsappNumber, lines.join("\n"));
  }, [form, services, whatsappNumber]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Une erreur est survenue. Veuillez réessayer.");
      }

      setStatus("success");
      setForm({ name: "", contact: "", serviceSlug: services[0]?.slug ?? "", amount: "", message: "" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        <p className="font-semibold">Message envoyé avec succès.</p>
        <p className="mt-2">
          Vous recevrez une réponse par email ou WhatsApp dans les meilleurs délais. Vous pouvez
          aussi continuer directement la conversation sur WhatsApp.
        </p>
        <a
          href={buildWhatsAppLink(whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Écrire sur WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-encre">
            Nom complet
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="mt-1 w-full rounded-md border border-brume bg-white px-3 py-2 text-sm text-encre transition-colors focus:border-bleu-500 focus:outline-none focus:ring-1 focus:ring-bleu-500"
          />
        </div>
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-encre">
            Email ou numéro WhatsApp
          </label>
          <input
            id="contact"
            required
            value={form.contact}
            onChange={(e) => updateField("contact", e.target.value)}
            className="mt-1 w-full rounded-md border border-brume bg-white px-3 py-2 text-sm text-encre transition-colors focus:border-bleu-500 focus:outline-none focus:ring-1 focus:ring-bleu-500"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="serviceSlug" className="block text-sm font-medium text-encre">
            Service souhaité
          </label>
          <select
            id="serviceSlug"
            value={form.serviceSlug}
            onChange={(e) => updateField("serviceSlug", e.target.value)}
            className="mt-1 w-full rounded-md border border-brume bg-white px-3 py-2 text-sm text-encre transition-colors focus:border-bleu-500 focus:outline-none focus:ring-1 focus:ring-bleu-500"
          >
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-encre">
            Montant approximatif
          </label>
          <input
            id="amount"
            placeholder="ex : 500 USD"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            className="mt-1 w-full rounded-md border border-brume bg-white px-3 py-2 text-sm text-encre transition-colors focus:border-bleu-500 focus:outline-none focus:ring-1 focus:ring-bleu-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-encre">
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          required
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
          className="mt-1 w-full rounded-md border border-brume bg-white px-3 py-2 text-sm text-encre transition-colors focus:border-bleu-500 focus:outline-none focus:ring-1 focus:ring-bleu-500"
        />
      </div>

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-md bg-bleu-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-bleu-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Envoi en cours…" : "Envoyer le message"}
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-green-600 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          Écrire directement sur WhatsApp
        </a>
      </div>
    </form>
  );
}
