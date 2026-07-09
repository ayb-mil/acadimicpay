import fs from "fs";
import path from "path";
import type {
  Benefit,
  CaseStudy,
  FaqItem,
  Locale,
  PredatoryGuide,
  PricingGrid,
  Service,
  SiteContent,
  Testimonial,
} from "@/types/content";

export const DEFAULT_LOCALE: Locale = "fr";

const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * Adding a new locale (ar/en) only requires creating content/<locale>/*.json.
 * Missing files silently fall back to the default locale (fr) so the site
 * keeps working while translations are filled in incrementally.
 */
function readJson<T>(locale: Locale, filename: string): T {
  const localePath = path.join(CONTENT_ROOT, locale, filename);
  const fallbackPath = path.join(CONTENT_ROOT, DEFAULT_LOCALE, filename);
  const targetPath = fs.existsSync(localePath) ? localePath : fallbackPath;
  const raw = fs.readFileSync(targetPath, "utf-8");
  return JSON.parse(raw) as T;
}

export function getSiteContent(locale: Locale = DEFAULT_LOCALE): SiteContent {
  return readJson<SiteContent>(locale, "site.json");
}

export function getServices(locale: Locale = DEFAULT_LOCALE): Service[] {
  const services = readJson<Service[]>(locale, "services.json");
  return [...services].sort((a, b) => a.order - b.order);
}

export function getServiceBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE
): Service | undefined {
  return getServices(locale).find((service) => service.slug === slug);
}

export function getTestimonials(locale: Locale = DEFAULT_LOCALE): Testimonial[] {
  return readJson<Testimonial[]>(locale, "testimonials.json");
}

export function getFaq(locale: Locale = DEFAULT_LOCALE): FaqItem[] {
  return readJson<FaqItem[]>(locale, "faq.json");
}

export function getPricingGrid(locale: Locale = DEFAULT_LOCALE): PricingGrid {
  return readJson<PricingGrid>(locale, "pricing.json");
}

export function getBenefits(locale: Locale = DEFAULT_LOCALE): Benefit[] {
  return readJson<Benefit[]>(locale, "benefits.json");
}

export function getCaseStudy(locale: Locale = DEFAULT_LOCALE): CaseStudy {
  return readJson<CaseStudy>(locale, "case-study.json");
}

export function getPredatoryGuide(locale: Locale = DEFAULT_LOCALE): PredatoryGuide {
  return readJson<PredatoryGuide>(locale, "predatory-guide.json");
}
