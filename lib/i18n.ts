import fs from "fs";
import path from "path";
import type { Locale, UiDictionary } from "@/types/content";
import { DEFAULT_LOCALE } from "@/lib/content";

const LOCALES_ROOT = path.join(process.cwd(), "content", "locales");

/**
 * UI chrome strings (nav/cta/footer). Add ar.json / en.json under
 * content/locales/ to enable a new language without touching components.
 */
export function getDictionary(locale: Locale = DEFAULT_LOCALE): UiDictionary {
  const localePath = path.join(LOCALES_ROOT, `${locale}.json`);
  const fallbackPath = path.join(LOCALES_ROOT, `${DEFAULT_LOCALE}.json`);
  const targetPath = fs.existsSync(localePath) ? localePath : fallbackPath;
  const raw = fs.readFileSync(targetPath, "utf-8");
  return JSON.parse(raw) as UiDictionary;
}
