"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/*
 * Scènes WebGL (Three.js / React Three Fiber) : chargées côté client
 * uniquement (WebGL n'existe pas côté serveur), avec un placeholder lumineux
 * pendant le téléchargement du bundle 3D.
 */
function SceneLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-24 w-24 animate-pulse rounded-full bg-gradient-to-br from-[#2DD4CF]/40 to-[#8B7CF6]/40 blur-xl" />
    </div>
  );
}
const HeroScene = dynamic(() => import("./_three/HeroScene"), { ssr: false, loading: SceneLoader });
const PortfolioCarousel3D = dynamic(() => import("./_three/PortfolioCarousel3D"), {
  ssr: false,
  loading: SceneLoader,
});
const ConfiguratorStack3D = dynamic(() => import("./_three/ConfiguratorStack3D"), {
  ssr: false,
  loading: SceneLoader,
});

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTES À ÉDITER — tout est ici, rien de dispersé dans le JSX.
   ══════════════════════════════════════════════════════════════════════════ */

/** Numéro WhatsApp au format international sans « + » (= +212 6 09 64 88 11). */
const WHATSAPP = "212609648811";

/** Devise affichée partout. */
const CURRENCY = "MAD";

/**
 * Grille tarifaire. Les prix sont en MAD, les délais en jours.
 * - `base` : prestation de départ (mise en forme seule).
 * - `addons` : options qui s'ajoutent au prix ET au délai de la base.
 * - `packs` : forfaits tout compris (contenu rédigé + animations inclus).
 */
const OFFERS = {
  base: { slides: 15, price: 50, days: 1 },
  addons: {
    content: { price: 30, days: 1 },
    animations: { price: 10, days: 1 },
  },
  packs: [
    { slides: 30, price: 140, days: 3 },
    { slides: 60, price: 265, days: 4 },
  ],
} as const;

/**
 * Section « Avis » : masquée tant qu'il n'y a pas de vrais retours clients.
 * Passer à `true` dès le premier témoignage réel, puis remplacer le texte et
 * les attributions dans `content.{fr,ar,en}.reviews`. Rien d'autre à toucher.
 */
const SHOW_REVIEWS = false;

/** Bloc « À propos ». `photo` vide → emplacement gris affiché. */
const ABOUT = {
  name: "Ayoub El Mqarta",
  // Même portrait que la page Confiance d'acadpay.me.
  photo: "/images/ayoub-el-mqarta.jpg",
};

/* ══════════════════════════════════════════════════════════════════════════
   CONTENU — trois langues parallèles. Aucune chaîne en dur dans le JSX.
   ══════════════════════════════════════════════════════════════════════════ */

type Locale = "fr" | "ar" | "en";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "ar", label: "العربية" },
  { code: "en", label: "EN" },
];

const content = {
  fr: {
    dir: "ltr" as const,
    wordmark: "Présentations",
    langAria: "Choisir la langue",
    hero: {
      eyebrow: "Service indépendant · ENS Meknès",
      h1Pre: "Conception de présentations",
      h1Accent: "professionnelles",
      h1Post: "",
      toolsLine: "pptx · Canva · Google Slides · Prezi",
      sub: "Soutenances, exposés, supports de cours. Livrées dans le format de votre choix. Pour toute question ou demande, n'hésitez pas à nous contacter.",
      cta: "Contacter sur WhatsApp",
      cta2: "Voir les tarifs",
      badge: "Mise en forme + rédaction + animations",
    },
    audience: {
      title: "Vous êtes…",
      student: {
        tab: "Étudiant",
        title: "Pour une soutenance ou un exposé",
        text: "Soutenance de PFE ou de thèse, exposé de module, rapport de projet à présenter. Vous m'envoyez votre document ou votre plan, je le mets en forme.",
        examples: ["Soutenance de PFE", "Exposé de module", "Rapport de stage"],
      },
      teacher: {
        tab: "Enseignant / formateur",
        title: "Pour un cours ou une formation",
        text: "Support de cours en .pptx, présentation de chapitre, diaporama de formation ou de conférence. Vous fournissez le contenu, je construis la séance.",
        examples: ["Support de cours", "Présentation de chapitre", "Diaporama de formation"],
      },
    },
    config: {
      title: "Composez votre présentation",
      sub: "Le total se met à jour selon vos choix.",
      slides: "Nombre de diapositives",
      addContent: "Rédaction du contenu",
      addContentHint: "Sinon, je mets en forme le contenu que vous fournissez.",
      addAnimations: "Animations et transitions",
      included: "Inclus",
      total: "Total",
      delay: "Délai",
      cta: "Contacter sur WhatsApp",
      labelPack: (n: number) => `Pack complet ${n} diapositives`,
      labelBase: (n: number) => `${n} diapositives`,
      withContent: "rédaction du contenu",
      withAnimations: "animations",
    },
    table: {
      title: "Tarifs",
      colOffer: "Offre",
      colPrice: "Prix",
      colDelay: "Délai",
      bestValue: "Meilleur rapport qualité-prix",
      rows: {
        base: "Présentation soignée — 15 diapositives (mise en forme du contenu que vous fournissez)",
        content: "Rédaction du contenu (15 diapositives)",
        animations: "Animations et transitions",
        pack30: "Pack complet 30 diapositives (contenu rédigé + animations)",
        pack60: "Pack complet 60 diapositives (contenu rédigé + animations)",
      },
      rules: [
        "Langues disponibles : arabe, français, anglais.",
        "3 révisions de forme incluses après livraison.",
        "Par défaut, la rédaction du contenu n'est pas incluse : je mets en forme le contenu que vous fournissez, sauf si vous choisissez un pack complet.",
      ],
      payment: "Paiement par virement bancaire ou CashPlus, confirmé sur WhatsApp.",
    },
    steps: {
      title: "Comment ça se passe",
      items: [
        { t: "Vous me contactez sur WhatsApp", d: "Envoyez-moi votre sujet ou votre document." },
        { t: "On confirme", d: "Nombre de diapositives, style et délai. Vous réglez ensuite par virement ou CashPlus." },
        { t: "Vous recevez votre présentation", d: "Prête à présenter." },
      ],
    },
    portfolio: {
      title: "Exemples de réalisations",
      sub: "Aperçus de présentations que j'ai réalisées.",
      dragHint: "Faites glisser pour parcourir · touchez une diapositive pour l'agrandir",
      allWorks: "Titres de ces exemples",
      open: "Agrandir",
      close: "Fermer",
    },
    reviews: {
      title: "Avis",
      quote: "Emplacement réservé : cet avis sera remplacé par un retour client réel.",
      who: ["Étudiant, FST", "Étudiante, ENS"],
    },
    about: {
      title: "À propos",
      text: "Designer professionnel et étudiant en Master (Université Moulay Ismaïl). Je crée pour vous une présentation impressionnante, exactement comme vous l'imaginez.",
      photoAlt: "Photo",
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        { q: "Quel est le délai de livraison ?", a: "De 1 à 4 jours selon le nombre de diapositives et les options choisies. Le délai exact est confirmé avant de commencer." },
        { q: "Puis-je demander des modifications ?", a: "Oui, 3 révisions de forme sont incluses après la livraison." },
        { q: "Dans quelles langues travaillez-vous ?", a: "Arabe, français et anglais." },
        { q: "Comment se fait le paiement ?", a: "Par virement bancaire ou CashPlus, après accord sur les détails via WhatsApp. Aucun paiement n'est encaissé sur ce site." },
        { q: "Mon contenu reste-t-il confidentiel ?", a: "Oui. Vos fichiers et votre sujet ne sont partagés avec personne et ne sont pas utilisés comme exemples sans votre accord." },
      ],
    },
    footer: {
      wa: "Contacter sur WhatsApp",
      back: "Retour à acadpay.me",
      mentions: "Mentions légales",
      note: "Service indépendant de conception de présentations.",
    },
    sticky: "Contacter sur WhatsApp",
    formatDays: (n: number) => (n > 1 ? `${n} jours` : `${n} jour`),
    wa: {
      generic: "Bonjour, je souhaite une présentation.",
      offer: (label: string) => `Bonjour, je souhaite une présentation (${label}).`,
      tag: { student: " — étudiant", teacher: " — enseignant" },
    },
  },

  ar: {
    dir: "rtl" as const,
    wordmark: "عروض تقديمية",
    langAria: "اختيار اللغة",
    hero: {
      eyebrow: "خدمة مستقلة · المدرسة العليا للأساتذة بمكناس",
      h1Pre: "تصميم عروض بوربوينت",
      h1Accent: "احترافية",
      h1Post: "",
      toolsLine: "pptx · Canva · Google Slides · Prezi",
      sub: "مناقشات، عروض، ودعامات دروس. تُسلَّم بالصيغة التي تريدها، ولأي استفسار أو طلب لا تتردد في التواصل معنا.",
      cta: "تواصل عبر واتساب",
      cta2: "الاطلاع على الأسعار",
      badge: "تنسيق + كتابة محتوى + حركات",
    },
    audience: {
      title: "أنت…",
      student: {
        tab: "طالب",
        title: "لمناقشة أو عرض",
        text: "مناقشة مشروع التخرج أو الأطروحة، عرض في مادة، أو تقرير مشروع. ترسل لي ملفك أو تصميمك، وأتولّى التنسيق.",
        examples: ["مناقشة مشروع التخرج", "عرض في مادة", "تقرير تدريب"],
      },
      teacher: {
        tab: "أستاذ / مكوّن",
        title: "لدرس أو تكوين",
        text: "دعامة درس بصيغة .pptx، عرض فصل، أو عرض تكوين أو ندوة. أنت تقدّم المحتوى، وأنا أبني الحصة.",
        examples: ["دعامة درس", "عرض فصل", "عرض تكوين"],
      },
    },
    config: {
      title: "كوّن عرضك التقديمي",
      sub: "يتغيّر المجموع تلقائياً حسب اختياراتك.",
      slides: "عدد الشرائح",
      addContent: "كتابة المحتوى",
      addContentHint: "بدونها، أقوم بتنسيق المحتوى الذي تقدّمه.",
      addAnimations: "حركات وانتقالات",
      included: "مُدرَج",
      total: "المجموع",
      delay: "مدة التسليم",
      cta: "تواصل عبر واتساب",
      labelPack: (n: number) => `باقة كاملة ${n} شريحة`,
      labelBase: (n: number) => `${n} شريحة`,
      withContent: "كتابة المحتوى",
      withAnimations: "حركات",
    },
    table: {
      title: "الأسعار",
      colOffer: "العرض",
      colPrice: "الثمن",
      colDelay: "مدة التسليم",
      bestValue: "أفضل قيمة مقابل السعر",
      rows: {
        base: "عرض تقديمي منسّق — 15 شريحة (تنسيق المحتوى الذي تقدّمه)",
        content: "كتابة المحتوى (15 شريحة)",
        animations: "حركات وانتقالات",
        pack30: "باقة كاملة 30 شريحة (محتوى مكتوب + حركات)",
        pack60: "باقة كاملة 60 شريحة (محتوى مكتوب + حركات)",
      },
      rules: [
        "اللغات المتاحة: العربية، الفرنسية، الإنجليزية.",
        "ثلاث تعديلات على الشكل مُدرَجة بعد التسليم.",
        "كتابة المحتوى غير مُدرَجة افتراضياً: أقوم بتنسيق المحتوى الذي تقدّمه، إلا إذا اخترت باقة كاملة.",
      ],
      payment: "الأداء عبر تحويل بنكي أو CashPlus، ويُؤكَّد عبر واتساب.",
    },
    steps: {
      title: "كيف تتم العملية",
      items: [
        { t: "تتواصل معي عبر واتساب", d: "أرسل لي موضوعك أو ملفك." },
        { t: "نتفق على التفاصيل", d: "عدد الشرائح والأسلوب ومدة التسليم، ثم تؤدي عبر تحويل بنكي أو CashPlus." },
        { t: "تستلم عرضك التقديمي", d: "جاهزاً للعرض." },
      ],
    },
    portfolio: {
      title: "نماذج من الأعمال",
      sub: "لمحات من عروض تقديمية أنجزتُها.",
      dragHint: "اسحب للتصفح · اضغط على أي شريحة لتكبيرها",
      allWorks: "عناوين هذه النماذج",
      open: "تكبير",
      close: "إغلاق",
    },
    reviews: {
      title: "آراء",
      quote: "مكان مخصّص: سيُستبدل هذا الرأي بشهادة زبون حقيقية.",
      who: ["طالب، كلية العلوم والتقنيات", "طالبة، المدرسة العليا للأساتذة"],
    },
    about: {
      title: "من أنا",
      text: "مصمم احترافي وطالب في سلك الماستر (جامعة مولاي إسماعيل). سأصنع لك عرضاً تقديمياً مبهراً كما تتخيله.",
      photoAlt: "صورة",
    },
    faq: {
      title: "أسئلة شائعة",
      items: [
        { q: "ما هي مدة التسليم؟", a: "من يوم واحد إلى أربعة أيام حسب عدد الشرائح والخيارات المختارة. تُحدَّد المدة بدقة قبل بدء العمل." },
        { q: "هل يمكنني طلب تعديلات؟", a: "نعم، ثلاث تعديلات على الشكل مُدرَجة بعد التسليم." },
        { q: "ما هي اللغات المتاحة؟", a: "العربية والفرنسية والإنجليزية." },
        { q: "كيف يتم الأداء؟", a: "عبر تحويل بنكي أو CashPlus، بعد الاتفاق على التفاصيل في واتساب. لا يتم أي أداء عبر هذا الموقع." },
        { q: "هل يبقى محتواي سرياً؟", a: "نعم. لا أشارك ملفاتك ولا موضوعك مع أي طرف، ولا أستعملها كنماذج دون إذنك." },
      ],
    },
    footer: {
      wa: "تواصل عبر واتساب",
      back: "العودة إلى acadpay.me",
      mentions: "معلومات قانونية",
      note: "خدمة مستقلة لتصميم العروض التقديمية.",
    },
    sticky: "تواصل عبر واتساب",
    formatDays: (n: number) => (n === 1 ? "يوم واحد" : n === 2 ? "يومان" : `${n} أيام`),
    wa: {
      generic: "مرحباً، أرغب في عرض تقديمي.",
      offer: (label: string) => `مرحباً، أرغب في عرض تقديمي (${label}).`,
      tag: { student: " — طالب", teacher: " — أستاذ" },
    },
  },

  en: {
    dir: "ltr" as const,
    wordmark: "Presentations",
    langAria: "Choose language",
    hero: {
      eyebrow: "Independent service · ENS Meknès",
      h1Pre: "Professional presentation",
      h1Accent: "design",
      h1Post: "",
      toolsLine: "pptx · Canva · Google Slides · Prezi",
      sub: "Defences, class presentations, course decks. Delivered in the format you want. For any question or request, feel free to contact us.",
      cta: "Contact on WhatsApp",
      cta2: "See prices",
      badge: "Formatting + writing + animations",
    },
    audience: {
      title: "You are…",
      student: {
        tab: "Student",
        title: "For a defence or a class presentation",
        text: "Final-year project or thesis defence, module presentation, project report. Send me your document or outline and I format it.",
        examples: ["Project defence", "Module presentation", "Internship report"],
      },
      teacher: {
        tab: "Teacher / trainer",
        title: "For a course or a training",
        text: "Course deck in .pptx, chapter presentation, training or conference slides. You provide the content, I build the session.",
        examples: ["Course deck", "Chapter presentation", "Training deck"],
      },
    },
    config: {
      title: "Build your presentation",
      sub: "The total updates with your choices.",
      slides: "Number of slides",
      addContent: "Content writing",
      addContentHint: "Otherwise I format the content you provide.",
      addAnimations: "Animations and transitions",
      included: "Included",
      total: "Total",
      delay: "Delivery",
      cta: "Contact on WhatsApp",
      labelPack: (n: number) => `Full pack ${n} slides`,
      labelBase: (n: number) => `${n} slides`,
      withContent: "content writing",
      withAnimations: "animations",
    },
    table: {
      title: "Prices",
      colOffer: "Offer",
      colPrice: "Price",
      colDelay: "Delivery",
      bestValue: "Best value",
      rows: {
        base: "Formatted presentation — 15 slides (formatting of the content you provide)",
        content: "Content writing (15 slides)",
        animations: "Animations and transitions",
        pack30: "Full pack 30 slides (written content + animations)",
        pack60: "Full pack 60 slides (written content + animations)",
      },
      rules: [
        "Available languages: Arabic, French, English.",
        "3 formatting revisions included after delivery.",
        "By default, content writing is not included: I format the content you provide, unless you choose a full pack.",
      ],
      payment: "Payment by bank transfer or CashPlus, confirmed on WhatsApp.",
    },
    steps: {
      title: "How it works",
      items: [
        { t: "You contact me on WhatsApp", d: "Send me your topic or your document." },
        { t: "We confirm", d: "Number of slides, style and deadline. You then pay by bank transfer or CashPlus." },
        { t: "You receive your presentation", d: "Ready to present." },
      ],
    },
    portfolio: {
      title: "Examples of work",
      sub: "Previews of presentations I have made.",
      dragHint: "Drag to browse · tap a slide to enlarge it",
      allWorks: "Titles of these examples",
      open: "Enlarge",
      close: "Close",
    },
    reviews: {
      title: "Reviews",
      quote: "Placeholder: this review will be replaced by a real client testimonial.",
      who: ["Student, FST", "Student, ENS"],
    },
    about: {
      title: "About",
      text: "Professional designer and Master's student (Moulay Ismaïl University). I will create a stunning presentation for you, exactly as you imagine it.",
      photoAlt: "Photo",
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        { q: "What is the delivery time?", a: "From 1 to 4 days depending on the number of slides and the options chosen. The exact deadline is confirmed before starting." },
        { q: "Can I ask for changes?", a: "Yes, 3 formatting revisions are included after delivery." },
        { q: "Which languages do you work in?", a: "Arabic, French and English." },
        { q: "How is payment made?", a: "By bank transfer or CashPlus, after agreeing the details on WhatsApp. No payment is taken on this site." },
        { q: "Does my content stay confidential?", a: "Yes. Your files and your topic are not shared with anyone and are not used as examples without your permission." },
      ],
    },
    footer: {
      wa: "Contact on WhatsApp",
      back: "Back to acadpay.me",
      mentions: "Legal notice",
      note: "Independent presentation design service.",
    },
    sticky: "Contact on WhatsApp",
    formatDays: (n: number) => (n > 1 ? `${n} days` : `${n} day`),
    wa: {
      generic: "Hello, I would like a presentation.",
      offer: (label: string) => `Hello, I would like a presentation (${label}).`,
      tag: { student: " — student", teacher: " — teacher" },
    },
  },
};

/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * Portfolio : les fichiers vivent dans /public/portfolio/.
 * Remplacez les images par vos vraies captures (même noms) et ajustez les
 * légendes ci-dessous. L'ordre d'affichage suit ce tableau.
 */
const PORTFOLIO = [
  { file: "01.jpg", caption: "Nanomatériaux pour le hardware quantique — soutenance de master" },
  { file: "02.jpg", caption: "CVD et spectroscopie Mössbauer — exposé" },
  { file: "03.jpg", caption: "Quantité de matière & théories d'apprentissage — supports de cours" },
  { file: "04.jpg", caption: "Champ électrostatique — 1re Bac SM" },
  { file: "05.jpg", caption: "IT Services Workflow — infographies de processus" },
  { file: "06.jpg", caption: "Ingénierie des défauts dans le hBN — résultats" },
  { file: "07.jpg", caption: "Parcours académique & projet de recherche" },
];

/** Construit un lien WhatsApp avec message pré-rempli. */
function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   PRIMITIVES VISUELLES — scroll-reveal, tilt 3D léger, décor ambiant.
   Tout respecte prefers-reduced-motion (via MotionConfig + useReducedMotion).
   ══════════════════════════════════════════════════════════════════════════ */

/** Révélation au scroll (fondu + léger déplacement), une seule fois. */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Carte avec inclinaison 3D douce qui suit la souris (desktop uniquement,
 * neutralisée si prefers-reduced-motion). Purement décoratif : aucune
 * information n'est encodée dans l'inclinaison, elle reste accessible au
 * clavier et au clic normalement.
 */
function TiltCard({
  children,
  className = "",
  strength = 10,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const springX = useSpring(x, { stiffness: 150, damping: 18 });
  const springY = useSpring(y, { stiffness: 150, damping: 18 });
  const rotateX = useTransform(springY, [0, 1], [strength, -strength]);
  const rotateY = useTransform(springX, [0, 1], [-strength, strength]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width);
      y.set((e.clientY - rect.top) / rect.height);
    },
    [reducedMotion, x, y]
  );
  const onMouseLeave = useCallback(() => {
    x.set(0.5);
    y.set(0.5);
  }, [x, y]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Blob décoratif flou en arrière-plan (zones sombres uniquement). */
function Glow({ className }: { className: string }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

/* ══════════════════════════════════════════════════════════════════════════ */

export default function PresentationsPage() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [audience, setAudience] = useState<"student" | "teacher">("student");
  const [slides, setSlides] = useState<number>(OFFERS.base.slides);
  const [addContent, setAddContent] = useState(false);
  const [addAnimations, setAddAnimations] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const t = content[locale];
  const isAr = locale === "ar";
  const pack = OFFERS.packs.find((p) => p.slides === slides);
  const isPack = Boolean(pack);

  /* Hero 3D : la scène suit la souris sur toute la section et réagit au scroll. */
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  /* Total + délai, recalculés à chaque changement. */
  const { total, days } = useMemo(() => {
    if (pack) return { total: pack.price, days: pack.days };
    const price =
      OFFERS.base.price +
      (addContent ? OFFERS.addons.content.price : 0) +
      (addAnimations ? OFFERS.addons.animations.price : 0);
    const d =
      OFFERS.base.days +
      (addContent ? OFFERS.addons.content.days : 0) +
      (addAnimations ? OFFERS.addons.animations.days : 0);
    return { total: price, days: d };
  }, [pack, addContent, addAnimations]);

  /* Libellé de la sélection, réutilisé dans le message WhatsApp. */
  const selectionLabel = useMemo(() => {
    if (pack) return t.config.labelPack(pack.slides);
    const extras = [
      addContent ? t.config.withContent : null,
      addAnimations ? t.config.withAnimations : null,
    ].filter(Boolean);
    const base = t.config.labelBase(OFFERS.base.slides);
    return extras.length ? `${base} + ${extras.join(" + ")}` : base;
  }, [pack, addContent, addAnimations, t]);

  const audienceTag = t.wa.tag[audience];
  const configHref = waLink(`${t.wa.offer(selectionLabel)}${audienceTag}`);
  const heroHref = waLink(`${t.wa.generic}${audienceTag}`);

  /* Meilleur rapport qualité-prix parmi les packs (calcul réel, pas un argument fabriqué). */
  const bestValueSlides = useMemo(() => {
    return OFFERS.packs.reduce((best, p) =>
      p.price / p.slides < best.price / best.slides ? p : best
    ).slides;
  }, []);

  /* Lignes du tableau, dérivées d'OFFERS (aucun prix en dur ici). */
  const tableRows = [
    { key: "base", label: t.table.rows.base, price: OFFERS.base.price, days: OFFERS.base.days, plus: false, strong: false, slides: OFFERS.base.slides },
    { key: "content", label: t.table.rows.content, price: OFFERS.addons.content.price, days: OFFERS.addons.content.days, plus: true, strong: false, slides: null },
    { key: "animations", label: t.table.rows.animations, price: OFFERS.addons.animations.price, days: OFFERS.addons.animations.days, plus: true, strong: false, slides: null },
    { key: "pack30", label: t.table.rows.pack30, price: OFFERS.packs[0].price, days: OFFERS.packs[0].days, plus: false, strong: true, slides: OFFERS.packs[0].slides },
    { key: "pack60", label: t.table.rows.pack60, price: OFFERS.packs[1].price, days: OFFERS.packs[1].days, plus: false, strong: true, slides: OFFERS.packs[1].slides },
  ];

  /* Lightbox : Échap ferme, focus sur le bouton de fermeture. */
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  const aud = t.audience[audience];

  const btnPrimary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1FA855] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1FA855]/20 transition hover:bg-[#188f48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1FA855]";
  const btnGhostDark =
    "inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60";
  const btnGhostLight =
    "inline-flex items-center justify-center rounded-xl border border-[#E6E9F2] bg-white px-5 py-3 text-sm font-semibold text-[#0B1220] transition hover:border-[#2DD4CF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4CF]";
  const card = "rounded-2xl border border-[#E6E9F2] bg-white";

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-presentations
        dir={t.dir}
        lang={locale}
        style={
          {
            "--ui-body": isAr ? "var(--font-arabic)" : "var(--font-inter)",
            "--ui-display": isAr ? "var(--font-arabic)" : "var(--font-display)",
          } as CSSProperties
        }
        className="min-h-screen overflow-x-hidden bg-[#F7F8FC] text-[#0B1220]"
      >
        {/* ─────────── Header (sombre, persiste au-dessus du hero) ─────────── */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A1B3D]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <span className="ui-display text-base font-bold tracking-tight text-white">{t.wordmark}</span>
            <div
              role="group"
              aria-label={t.langAria}
              className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1"
            >
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLocale(l.code)}
                  aria-pressed={locale === l.code}
                  className={`relative rounded-md px-2.5 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4CF] ${
                    locale === l.code ? "text-[#0B1220]" : "text-white/70 hover:text-white"
                  }`}
                >
                  {locale === l.code && (
                    <motion.span
                      layoutId="lang-pill"
                      className="absolute inset-0 rounded-md bg-white"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="pb-28 sm:pb-16">
          {/* ─────────── Hero 3D plein écran (Three.js / WebGL) ─────────── */}
          <section
            ref={heroRef}
            className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0A1B3D] lg:min-h-[92vh] lg:justify-center"
          >
            {/* Scène WebGL : laptop procédural + vraies réalisations en orbite. */}
            <div className="absolute inset-0 -z-10">
              <HeroScene rtl={isAr} scroll={scrollYProgress} eventSource={heroRef} />
            </div>
            {/* Voiles de lisibilité : depuis le haut sur mobile, depuis le côté du texte sur desktop. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0A1B3D] via-[#0A1B3D]/50 to-transparent lg:hidden"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-r from-[#0A1B3D] via-[#0A1B3D]/60 to-transparent rtl:bg-gradient-to-l lg:block"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#0A1B3D] to-transparent"
            />

            <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:py-0">
              <div className="max-w-xl">
                <Reveal>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2DD4CF]" aria-hidden="true" />
                    {t.hero.eyebrow}
                  </span>
                </Reveal>

                <Reveal delay={0.08}>
                  <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {t.hero.h1Pre} <span className="grad-text">{t.hero.h1Accent}</span> {t.hero.h1Post}
                  </h1>
                </Reveal>

                <Reveal delay={0.14}>
                  <ul className="mt-5 flex flex-wrap gap-2" dir="ltr">
                    {t.hero.toolsLine.split(" · ").map((tool) => (
                      <li
                        key={tool}
                        className="rounded-full border border-[#2DD4CF]/30 bg-[#2DD4CF]/10 px-3 py-1 text-xs font-semibold text-[#7FF0EC] backdrop-blur"
                      >
                        {tool}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">{t.hero.sub}</p>
                </Reveal>

                <Reveal delay={0.2}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <motion.a
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ y: -2 }}
                      href={heroHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnPrimary} px-6 py-3.5 text-base`}
                    >
                      <WhatsAppIcon className="h-5 w-5" />
                      {t.hero.cta}
                    </motion.a>
                    <motion.a
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ y: -2 }}
                      href="#tarifs"
                      className={`${btnGhostDark} px-6 py-3.5 text-base`}
                    >
                      {t.hero.cta2}
                    </motion.a>
                  </div>
                </Reveal>
              </div>
            </div>

            {/* Badge flottant au-dessus de la scène (desktop). */}
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="pointer-events-none absolute bottom-28 end-10 hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-md lg:block"
            >
              <span className="me-2 inline-block h-2 w-2 rounded-full bg-[#2DD4CF]" aria-hidden="true" />
              {t.hero.badge}
            </motion.span>

            {/* Indicateur de scroll. */}
            <motion.div
              aria-hidden="true"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-white/50 lg:block"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </section>

          {/* ─────────── Audience ─────────── */}
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
            <Reveal>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5B6472]">
                {t.audience.title}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["student", "teacher"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAudience(key)}
                    aria-pressed={audience === key}
                    className={`relative rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4CF] ${
                      audience === key
                        ? "border-transparent text-white"
                        : "border-[#E6E9F2] bg-white text-[#5B6472] hover:text-[#0B1220]"
                    }`}
                  >
                    {audience === key && (
                      <motion.span
                        layoutId="audience-pill"
                        className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-[#122A57] to-[#1C3A70]"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    {t.audience[key].tab}
                  </button>
                ))}
              </div>
            </Reveal>

            <AnimatePresence mode="wait">
              <motion.div
                key={audience}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`${card} mt-5 p-6 shadow-sm`}
              >
                <h3 className="text-lg font-bold">{aud.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5B6472]">{aud.text}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {aud.examples.map((ex) => (
                    <li
                      key={ex}
                      className="rounded-lg border border-[#E6E9F2] bg-[#F7F8FC] px-3 py-1.5 text-xs font-medium text-[#5B6472]"
                    >
                      {ex}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </section>

          {/* ─────────── Configurateur (élément signature) ─────────── */}
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
            <Reveal>
              <div className={`${card} overflow-hidden shadow-xl shadow-[#0A1B3D]/5`}>
                <div className="h-1 w-full bg-gradient-to-r from-[#2DD4CF] via-[#1C3A70] to-[#8B7CF6]" />
                <div className="border-b border-[#E6E9F2] p-6">
                  <h2 className="text-xl font-bold">{t.config.title}</h2>
                  <p className="mt-1 text-sm text-[#5B6472]">{t.config.sub}</p>
                </div>

                <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="space-y-6">
                    {/* Nombre de diapositives */}
                    <div>
                      <p className="text-sm font-semibold">{t.config.slides}</p>
                      <div className="relative mt-2 flex flex-wrap gap-2">
                        {[OFFERS.base.slides, ...OFFERS.packs.map((p) => p.slides)].map((n) => (
                          <motion.button
                            key={n}
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setSlides(n)}
                            aria-pressed={slides === n}
                            className={`relative rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4CF] ${
                              slides === n
                                ? "border-transparent text-white"
                                : "border-[#E6E9F2] bg-white text-[#0B1220] hover:border-[#2DD4CF]"
                            }`}
                          >
                            {slides === n && (
                              <motion.span
                                layoutId="slides-pill"
                                className="absolute inset-0 -z-10 rounded-lg bg-[#122A57]"
                                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                              />
                            )}
                            {n}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      {(
                        [
                          { key: "content", label: t.config.addContent, hint: t.config.addContentHint, checked: isPack || addContent, set: setAddContent },
                          { key: "animations", label: t.config.addAnimations, hint: null, checked: isPack || addAnimations, set: setAddAnimations },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.key}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                            isPack ? "border-[#E6E9F2] bg-[#F7F8FC]" : "border-[#E6E9F2] bg-white hover:border-[#2DD4CF]"
                          } ${isPack ? "cursor-default" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={opt.checked}
                            disabled={isPack}
                            onChange={(e) => opt.set(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#1C3A70] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4CF]"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">
                              {opt.label}
                              {isPack && (
                                <span className="ms-2 rounded bg-[#2DD4CF]/15 px-1.5 py-0.5 text-[11px] font-semibold text-[#0EA5A0]">
                                  {t.config.included}
                                </span>
                              )}
                            </span>
                            {opt.hint && !isPack && (
                              <span className="mt-0.5 block text-xs text-[#5B6472]">{opt.hint}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Aperçu 3D de la commande + total live */}
                  <div className="flex flex-col gap-3 md:w-72">
                  <div className="relative h-52 overflow-hidden rounded-xl bg-gradient-to-b from-[#0A1B3D] to-[#1C3A70] shadow-inner sm:h-56">
                    <ConfiguratorStack3D
                      slides={slides}
                      content={isPack || addContent}
                      animations={isPack || addAnimations}
                      pack={isPack}
                    />
                    <span className="pointer-events-none absolute start-3 top-3 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      {selectionLabel}
                    </span>
                  </div>
                  <TiltCard strength={4}>
                    <div className="rounded-xl border border-[#E6E9F2] bg-gradient-to-b from-[#F7F8FC] to-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6472]">
                        {t.config.total}
                      </p>
                      <AnimatePresence mode="popLayout">
                        <motion.p
                          key={total}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.25 }}
                          className="mt-1 text-3xl font-bold tabular-nums"
                          aria-live="polite"
                        >
                          {total} <span className="text-base font-semibold text-[#5B6472]">{CURRENCY}</span>
                        </motion.p>
                      </AnimatePresence>
                      <p className="mt-2 text-xs text-[#5B6472]">
                        {t.config.delay} : {t.formatDays(days)}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#0B1220]">{selectionLabel}</p>
                      <motion.a
                        whileTap={{ scale: 0.96 }}
                        href={configHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${btnPrimary} mt-4 w-full`}
                      >
                        {t.config.cta}
                      </motion.a>
                    </div>
                  </TiltCard>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ─────────── Portfolio : galerie 3D (WebGL) ─────────── */}
          <section className="relative mt-16 overflow-hidden bg-[#0A1B3D] py-14">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <Reveal>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  <span className="grad-text">{t.portfolio.title}</span>
                </h2>
                <p className="mt-2 text-sm text-white/65">{t.portfolio.sub}</p>
              </Reveal>
            </div>
            <div className="relative mt-6 h-[420px] sm:h-[520px]">
              <PortfolioCarousel3D onSelect={setLightbox} />
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-0 w-16 bg-gradient-to-r from-[#0A1B3D] to-transparent rtl:bg-gradient-to-l" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 w-16 bg-gradient-to-l from-[#0A1B3D] to-transparent rtl:bg-gradient-to-r" />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-white/50">{t.portfolio.dragHint}</p>
          </section>

          <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
            <Reveal>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#5B6472]">{t.portfolio.allWorks}</h3>
            </Reveal>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {PORTFOLIO.map((item, i) => (
                <Reveal key={item.file} delay={(i % 3) * 0.08}>
                  <li>
                    <TiltCard strength={6} className="block">
                      <button
                        type="button"
                        onClick={() => setLightbox(i)}
                        aria-label={`${t.portfolio.open} — ${item.caption}`}
                        className="block w-full overflow-hidden rounded-xl border border-[#E6E9F2] bg-white shadow-sm transition hover:border-[#2DD4CF] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4CF]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/portfolio/${item.file}`}
                          alt={item.caption}
                          loading="lazy"
                          className="aspect-video w-full bg-white object-contain"
                        />
                      </button>
                    </TiltCard>
                    <p className="mt-1.5 text-xs leading-snug text-[#5B6472]">{item.caption}</p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </section>

          {/* ─────────── Tarifs ─────────── */}
          <section id="tarifs" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-14 sm:px-6">
            <Reveal>
              <h2 className="text-xl font-bold">{t.table.title}</h2>
              <div className={`${card} mt-4 overflow-x-auto shadow-sm`}>
                <table className="min-w-full text-start text-sm">
                  <thead className="bg-[#F7F8FC]">
                    <tr>
                      <th scope="col" className="px-5 py-3 text-start font-semibold">{t.table.colOffer}</th>
                      <th scope="col" className="px-5 py-3 text-start font-semibold">{t.table.colPrice}</th>
                      <th scope="col" className="px-5 py-3 text-start font-semibold">{t.table.colDelay}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E9F2]">
                    {tableRows.map((row) => (
                      <tr
                        key={row.key}
                        className={row.strong ? "bg-gradient-to-r from-[#2DD4CF]/[0.06] to-[#8B7CF6]/[0.06]" : undefined}
                      >
                        <td className={`px-5 py-4 ${row.strong ? "font-semibold" : ""}`}>
                          {row.label}
                          {row.slides === bestValueSlides && (
                            <span className="ms-2 inline-block rounded-full bg-[#8B7CF6]/15 px-2 py-0.5 text-[10px] font-semibold text-[#6D5BD0]">
                              {t.table.bestValue}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold tabular-nums">
                          {row.plus ? "+" : ""}
                          {row.price} {CURRENCY}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[#5B6472]">
                          {t.formatDays(row.days)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="mt-5 space-y-2">
                {t.table.rules.map((rule) => (
                  <li key={rule} className="flex gap-2.5 text-sm leading-relaxed text-[#5B6472]">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2DD4CF]" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl border border-[#E6E9F2] bg-white px-4 py-3 text-sm font-medium">
                {t.table.payment}
              </p>
            </Reveal>
          </section>

          {/* ─────────── Étapes (ligne de progression façon acadpay.me) ─────────── */}
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
            <Reveal>
              <h2 className="text-xl font-bold">{t.steps.title}</h2>
            </Reveal>
            <div className="relative mt-5 grid gap-4 sm:grid-cols-3">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-9 hidden h-px bg-[#E6E9F2] sm:block"
              />
              <ProgressLine />
              {t.steps.items.map((step, i) => (
                <Reveal key={step.t} delay={i * 0.12}>
                  <div className={`${card} relative p-5 shadow-sm`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#122A57] to-[#1C3A70] text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <h3 className="mt-3 text-base font-bold">{step.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#5B6472]">{step.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ─────────── Avis ─────────── */}
          {/* Masqué via SHOW_REVIEWS tant qu'il n'y a pas de vrais retours clients
              (pas de fausse preuve sociale). TODO: replace with real reviews. */}
          {SHOW_REVIEWS && (
            <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
              <Reveal>
                <h2 className="text-xl font-bold">{t.reviews.title}</h2>
              </Reveal>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {t.reviews.who.map((who, i) => (
                  <Reveal key={who} delay={i * 0.1}>
                    <li className={`${card} p-5 shadow-sm`}>
                      <p className="text-sm leading-relaxed text-[#5B6472]">{t.reviews.quote}</p>
                      <p className="mt-3 border-t border-[#E6E9F2] pt-3 text-xs font-semibold">{who}</p>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </section>
          )}

          {/* ─────────── À propos ─────────── */}
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
            <Reveal>
              <h2 className="text-xl font-bold">{t.about.title}</h2>
              <div className={`${card} mt-4 flex flex-col gap-5 p-6 shadow-sm sm:flex-row sm:items-center`}>
                {/* nom + photo */}
                <div className="relative shrink-0">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#2DD4CF] to-[#8B7CF6] opacity-40 blur-md"
                  />
                  {ABOUT.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ABOUT.photo}
                      alt={t.about.photoAlt}
                      className="relative h-20 w-20 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="relative flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-[#E6E9F2] bg-[#F7F8FC] text-[10px] font-semibold text-[#5B6472] ring-2 ring-white"
                    >
                      photo
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold">{ABOUT.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5B6472]">{t.about.text}</p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ─────────── FAQ ─────────── */}
          <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
            <Reveal>
              <h2 className="text-xl font-bold">{t.faq.title}</h2>
              <div className={`${card} mt-4 divide-y divide-[#E6E9F2] shadow-sm`}>
                {t.faq.items.map((item) => (
                  <details key={item.q} className="group p-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4CF]">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-lg leading-none text-[#2DD4CF] transition group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-[#5B6472]">{item.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </section>
        </main>

        {/* ─────────── Footer (sombre, fait écho au hero) ─────────── */}
        <footer className="relative overflow-hidden border-t border-white/10 bg-[#0A1B3D]">
          <Glow className="ambient-blob-slow -bottom-16 start-1/3 h-56 w-56 bg-[#2DD4CF]/15" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-white/60">{t.footer.note}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href={heroHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#2DD4CF] hover:underline"
              >
                {t.footer.wa}
              </a>
              <a href="https://www.acadpay.me" className="text-white/60 hover:text-white">
                {t.footer.back}
              </a>
              <a href="https://www.acadpay.me/mentions-legales" className="text-white/60 hover:text-white">
                {t.footer.mentions}
              </a>
            </div>
          </div>
        </footer>

        {/* ─────────── Bouton WhatsApp flottant (desktop) ─────────── */}
        <motion.a
          href={heroHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.sticky}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 end-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1FA855] text-white shadow-xl shadow-[#1FA855]/30 sm:flex"
        >
          <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-[#1FA855]/50" />
          <WhatsAppIcon className="relative h-7 w-7" />
        </motion.a>

        {/* ─────────── Bouton collant mobile ─────────── */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0A1B3D]/95 p-3 backdrop-blur sm:hidden">
          <motion.a
            whileTap={{ scale: 0.97 }}
            href={configHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnPrimary} w-full`}
          >
            {t.sticky} · {total} {CURRENCY}
          </motion.a>
        </div>

        {/* ─────────── Lightbox ─────────── */}
        <AnimatePresence>
          {lightbox !== null && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={PORTFOLIO[lightbox].caption}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1B3D]/85 p-4 backdrop-blur-sm"
              onClick={closeLightbox}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/portfolio/${PORTFOLIO[lightbox].file}`}
                  alt={PORTFOLIO[lightbox].caption}
                  className="w-full rounded-xl bg-white"
                />
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={closeLightbox}
                  className="absolute end-3 top-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1220] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {t.portfolio.close}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/** Ligne de progression qui se dessine au scroll, entre les 3 étapes (desktop). */
function ProgressLine() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-9 hidden h-px origin-start bg-gradient-to-r from-[#2DD4CF] via-[#1C3A70] to-[#8B7CF6] sm:block"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

/** Icône WhatsApp (trait simple, pas de dépendance externe). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.39a9.9 9.9 0 004.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.02h-.01a8.1 8.1 0 01-4.13-1.13l-.3-.17-3.13.82.84-3.05-.19-.31a8.11 8.11 0 01-1.24-4.28c0-4.48 3.65-8.12 8.13-8.12 2.17 0 4.21.85 5.74 2.38a8.06 8.06 0 012.38 5.75c0 4.48-3.65 8.11-8.09 8.11z" />
    </svg>
  );
}
