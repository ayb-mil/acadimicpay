"use client";

import { useState } from "react";
import type { FaqItem } from "@/types/content";

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-brume overflow-hidden rounded-xl border border-brume bg-white shadow-card">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className={isOpen ? "bg-papier/60" : ""}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${item.id}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-encre transition-colors hover:text-bleu-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu-600"
              >
                {item.question}
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bleu-50 text-lg leading-none text-ocre-600 transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
            </h3>
            {isOpen && (
              <div id={`faq-panel-${item.id}`} className="px-5 pb-4 text-sm leading-relaxed text-ardoise">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
