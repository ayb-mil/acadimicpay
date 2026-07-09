export type Locale = "fr" | "ar" | "en";

export interface SiteStep {
  title: string;
  description: string;
}

export interface TrustPoint {
  title: string;
  description: string;
}

export interface SiteContent {
  siteName: string;
  tagline: string;
  shortPitch: string;
  founder: {
    name: string;
    affiliation: string;
    status: string;
    /** Photo de profil (chemin dans /public, ex: /images/photo.jpg). Optionnel. */
    photo?: string;
    /** Lien externe ouvert au clic sur la photo (ex: publication Facebook). */
    photoUrl?: string;
    /** Légende discrète sous la photo indiquant où mène le lien. */
    photoCaption?: string;
    /** Texte de présentation affiché sous la photo. */
    bio?: string;
  };
  contact: {
    email: string;
    whatsappNumber: string;
    whatsappDisplay: string;
  };
  steps: SiteStep[];
  trustPoints: TrustPoint[];
}

export interface Service {
  slug: string;
  order: number;
  title: string;
  shortDescription: string;
  icon: string;
  intro: string;
  details: string[];
  whoFor: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  quote: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/** Un palier du barème tarifaire (par tranche de montant). */
export interface PricingTier {
  range: string;
  fee: string;
}

/** Barème tarifaire complet : paliers + exemple de calcul + note de change. */
export interface PricingGrid {
  tiers: PricingTier[];
  example: string;
  exchangeNote: string;
}

export interface UiDictionary {
  nav: Record<string, string>;
  cta: Record<string, string>;
  footer: Record<string, string>;
}

/** Bénéfices concrets affichés sur l'accueil (« Ce que vous gagnez »). */
export interface Benefit {
  id: string;
  icon: string; // clé d'icône : no-crypto | receipt | shield | user | wallet
  title: string;
  description: string;
}

/** Étude de cas réelle et anonymisée (page Confiance + aperçu accueil). */
export interface CaseStudy {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  transition: string;
}

/** Un signal d'alerte de la checklist « revue prédatrice ». */
export interface PredatorySignal {
  title: string;
  description: string;
}

/** Contenu complet de la page éducative sur les revues prédatrices. */
export interface PredatoryGuide {
  title: string;
  intro: string;
  signals: PredatorySignal[];
  ctaTitle: string;
  ctaText: string;
}
