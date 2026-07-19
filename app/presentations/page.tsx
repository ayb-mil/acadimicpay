"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTES À ÉDITER — tout est ici, rien de dispersé dans le JSX.
   ══════════════════════════════════════════════════════════════════════════ */

/** Numéro WhatsApp au format international sans « + » (= +212 6 09 93 32 18). */
const WHATSAPP = "212609933218";

/** Devise affichée partout. */
const CURRENCY = "MAD";

/**
 * Grille tarifaire. Les prix sont en MAD, les délais en jours.
 * - `base` : prestation de départ (mise en forme seule).
 * - `addons` : options qui s'ajoutent au prix ET au délai de la base.
 * - `packs` : forfaits tout compris (contenu rédigé + animations inclus).
 */
const OFFERS = {
  base: { slides: 15, price: 120, days: 1 },
  addons: {
    content: { price: 80, days: 1 },
    animations: { price: 40, days: 1 },
  },
  packs: [
    { slides: 30, price: 300, days: 3 },
    { slides: 60, price: 550, days: 4 },
  ],
} as const;

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
      h1: "Vos présentations, mises en forme et prêtes à présenter",
      sub: "Soutenances, exposés, supports de cours. Livrées en .pptx et PDF, en arabe, français ou anglais.",
      cta: "Contacter sur WhatsApp",
      cta2: "Voir les tarifs",
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
      rows: {
        base: "Présentation soignée — 15 diapositives (mise en forme du contenu que vous fournissez)",
        content: "Rédaction du contenu (15 diapositives)",
        animations: "Animations et transitions",
        pack30: "Pack complet 30 diapositives (contenu rédigé + animations)",
        pack60: "Pack complet 60 diapositives (contenu rédigé + animations)",
      },
      rules: [
        "Formats de livraison : .pptx et PDF.",
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
        { t: "Vous recevez votre présentation", d: "En .pptx et PDF, prête à présenter." },
      ],
    },
    portfolio: {
      title: "Exemples de réalisations",
      sub: "Aperçus de diapositives livrées.",
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
      text: "Étudiant en Master à l'ENS Meknès (Université Moulay Ismaïl). Je réalise moi-même chaque présentation, sans sous-traitance.",
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
      h1: "عروض تقديمية منسّقة، جاهزة للعرض",
      sub: "مناقشات، عروض، ودعامات دروس. تُسلَّم بصيغة .pptx و PDF، بالعربية أو الفرنسية أو الإنجليزية.",
      cta: "تواصل عبر واتساب",
      cta2: "الاطلاع على الأسعار",
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
      rows: {
        base: "عرض تقديمي منسّق — 15 شريحة (تنسيق المحتوى الذي تقدّمه)",
        content: "كتابة المحتوى (15 شريحة)",
        animations: "حركات وانتقالات",
        pack30: "باقة كاملة 30 شريحة (محتوى مكتوب + حركات)",
        pack60: "باقة كاملة 60 شريحة (محتوى مكتوب + حركات)",
      },
      rules: [
        "صيغ التسليم: .pptx و PDF.",
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
        { t: "تستلم عرضك التقديمي", d: "بصيغة .pptx و PDF، جاهزاً للعرض." },
      ],
    },
    portfolio: {
      title: "نماذج من الأعمال",
      sub: "لمحات من شرائح سبق تسليمها.",
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
      text: "طالب في سلك الماستر بالمدرسة العليا للأساتذة بمكناس (جامعة مولاي إسماعيل). أنجز كل عرض تقديمي بنفسي، دون وساطة.",
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
      h1: "Presentations, formatted and ready to present",
      sub: "Defences, class presentations, course decks. Delivered as .pptx and PDF, in Arabic, French or English.",
      cta: "Contact on WhatsApp",
      cta2: "See prices",
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
      rows: {
        base: "Formatted presentation — 15 slides (formatting of the content you provide)",
        content: "Content writing (15 slides)",
        animations: "Animations and transitions",
        pack30: "Full pack 30 slides (written content + animations)",
        pack60: "Full pack 60 slides (written content + animations)",
      },
      rules: [
        "Delivery formats: .pptx and PDF.",
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
        { t: "You receive your presentation", d: "As .pptx and PDF, ready to present." },
      ],
    },
    portfolio: {
      title: "Examples of work",
      sub: "Previews of delivered slides.",
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
      text: "Master's student at ENS Meknès (Moulay Ismaïl University). I produce every presentation myself, with no outsourcing.",
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
];

/** Construit un lien WhatsApp avec message pré-rempli. */
function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export default function PresentationsPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [audience, setAudience] = useState<"student" | "teacher">("student");
  const [slides, setSlides] = useState<number>(OFFERS.base.slides);
  const [addContent, setAddContent] = useState(false);
  const [addAnimations, setAddAnimations] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const t = content[locale];
  const isAr = locale === "ar";
  const pack = OFFERS.packs.find((p) => p.slides === slides);
  const isPack = Boolean(pack);

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

  /* Lignes du tableau, dérivées d'OFFERS (aucun prix en dur ici). */
  const tableRows = [
    { label: t.table.rows.base, price: OFFERS.base.price, days: OFFERS.base.days, plus: false, strong: false },
    { label: t.table.rows.content, price: OFFERS.addons.content.price, days: OFFERS.addons.content.days, plus: true, strong: false },
    { label: t.table.rows.animations, price: OFFERS.addons.animations.price, days: OFFERS.addons.animations.days, plus: true, strong: false },
    { label: t.table.rows.pack30, price: OFFERS.packs[0].price, days: OFFERS.packs[0].days, plus: false, strong: true },
    { label: t.table.rows.pack60, price: OFFERS.packs[1].price, days: OFFERS.packs[1].days, plus: false, strong: true },
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
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#157F43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#116937] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43]";
  const btnGhost =
    "inline-flex items-center justify-center rounded-xl border border-[#E4E1DA] bg-white px-5 py-3 text-sm font-semibold text-[#141A24] transition hover:border-[#1FA855] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43]";
  const card = "rounded-2xl border border-[#E4E1DA] bg-white";

  return (
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
      className="min-h-screen bg-[#FBFAF7] text-[#141A24]"
    >
      {/* ─────────── Header ─────────── */}
      <header className="border-b border-[#E4E1DA] bg-[#FBFAF7]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="ui-display text-base font-bold tracking-tight">{t.wordmark}</span>
          <div
            role="group"
            aria-label={t.langAria}
            className="flex items-center gap-1 rounded-lg border border-[#E4E1DA] bg-white p-1"
          >
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code)}
                aria-pressed={locale === l.code}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43] ${
                  locale === l.code
                    ? "bg-[#141A24] text-white"
                    : "text-[#5B6472] hover:text-[#141A24]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="pb-28 sm:pb-16">
        {/* ─────────── Hero ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 sm:pt-16">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {t.hero.h1}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5B6472]">{t.hero.sub}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={heroHref} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
              {t.hero.cta}
            </a>
            <a href="#tarifs" className={btnGhost}>
              {t.hero.cta2}
            </a>
          </div>
        </section>

        {/* ─────────── Audience ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
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
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43] ${
                  audience === key
                    ? "border-[#1FA855] bg-[#1FA855]/10 text-[#141A24]"
                    : "border-[#E4E1DA] bg-white text-[#5B6472] hover:text-[#141A24]"
                }`}
              >
                {t.audience[key].tab}
              </button>
            ))}
          </div>

          <div className={`${card} mt-5 p-6`}>
            <h3 className="text-lg font-bold">{aud.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6472]">{aud.text}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {aud.examples.map((ex) => (
                <li
                  key={ex}
                  className="rounded-lg border border-[#E4E1DA] bg-[#FBFAF7] px-3 py-1.5 text-xs font-medium text-[#5B6472]"
                >
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─────────── Configurateur (élément signature) ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <div className={`${card} overflow-hidden`}>
            <div className="border-b border-[#E4E1DA] p-6">
              <h2 className="text-xl font-bold">{t.config.title}</h2>
              <p className="mt-1 text-sm text-[#5B6472]">{t.config.sub}</p>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-6">
                {/* Nombre de diapositives */}
                <div>
                  <p className="text-sm font-semibold">{t.config.slides}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[OFFERS.base.slides, ...OFFERS.packs.map((p) => p.slides)].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSlides(n)}
                        aria-pressed={slides === n}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43] ${
                          slides === n
                            ? "border-[#157F43] bg-[#157F43] text-white"
                            : "border-[#E4E1DA] bg-white text-[#141A24] hover:border-[#1FA855]"
                        }`}
                      >
                        {n}
                      </button>
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
                        isPack ? "border-[#E4E1DA] bg-[#FBFAF7]" : "border-[#E4E1DA] bg-white hover:border-[#1FA855]"
                      } ${isPack ? "cursor-default" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={opt.checked}
                        disabled={isPack}
                        onChange={(e) => opt.set(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#157F43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {opt.label}
                          {isPack && (
                            <span className="ms-2 rounded bg-[#1FA855]/15 px-1.5 py-0.5 text-[11px] font-semibold text-[#116937]">
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

              {/* Total live */}
              <div className="rounded-xl border border-[#E4E1DA] bg-[#FBFAF7] p-5 md:w-64">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6472]">
                  {t.config.total}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums" aria-live="polite">
                  {total} <span className="text-base font-semibold text-[#5B6472]">{CURRENCY}</span>
                </p>
                <p className="mt-2 text-xs text-[#5B6472]">
                  {t.config.delay} : {t.formatDays(days)}
                </p>
                <p className="mt-1 text-xs font-medium text-[#141A24]">{selectionLabel}</p>
                <a
                  href={configHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btnPrimary} mt-4 w-full`}
                >
                  {t.config.cta}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────── Tarifs ─────────── */}
        <section id="tarifs" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.table.title}</h2>
          <div className={`${card} mt-4 overflow-x-auto`}>
            <table className="min-w-full text-start text-sm">
              <thead className="bg-[#FBFAF7]">
                <tr>
                  <th scope="col" className="px-5 py-3 text-start font-semibold">{t.table.colOffer}</th>
                  <th scope="col" className="px-5 py-3 text-start font-semibold">{t.table.colPrice}</th>
                  <th scope="col" className="px-5 py-3 text-start font-semibold">{t.table.colDelay}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DA]">
                {tableRows.map((row) => (
                  <tr key={row.label} className={row.strong ? "bg-[#1FA855]/[0.06]" : undefined}>
                    <td className={`px-5 py-4 ${row.strong ? "font-semibold" : ""}`}>{row.label}</td>
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
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1FA855]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl border border-[#E4E1DA] bg-white px-4 py-3 text-sm font-medium">
            {t.table.payment}
          </p>
        </section>

        {/* ─────────── Étapes ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.steps.title}</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {t.steps.items.map((step, i) => (
              <li key={step.t} className={`${card} p-5`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141A24] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-bold">{step.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5B6472]">{step.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ─────────── Portfolio ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.portfolio.title}</h2>
          <p className="mt-1 text-sm text-[#5B6472]">{t.portfolio.sub}</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PORTFOLIO.map((item, i) => (
              <li key={item.file}>
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  aria-label={`${t.portfolio.open} — ${item.caption}`}
                  className="block w-full overflow-hidden rounded-xl border border-[#E4E1DA] bg-white transition hover:border-[#1FA855] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/portfolio/${item.file}`}
                    alt={item.caption}
                    loading="lazy"
                    className="aspect-video w-full bg-white object-contain"
                  />
                </button>
                <p className="mt-1.5 text-xs leading-snug text-[#5B6472]">{item.caption}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ─────────── Avis ─────────── */}
        {/* TODO: replace with real reviews */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.reviews.title}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {t.reviews.who.map((who) => (
              <li key={who} className={`${card} p-5`}>
                <p className="text-sm leading-relaxed text-[#5B6472]">{t.reviews.quote}</p>
                <p className="mt-3 border-t border-[#E4E1DA] pt-3 text-xs font-semibold">{who}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ─────────── À propos ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.about.title}</h2>
          <div className={`${card} mt-4 flex flex-col gap-5 p-6 sm:flex-row sm:items-center`}>
            {/* nom + photo */}
            {ABOUT.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ABOUT.photo}
                alt={t.about.photoAlt}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-dashed border-[#E4E1DA] bg-[#FBFAF7] text-[10px] font-semibold text-[#5B6472]"
              >
                photo
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base font-bold">{ABOUT.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#5B6472]">{t.about.text}</p>
            </div>
          </div>
        </section>

        {/* ─────────── FAQ ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.faq.title}</h2>
          <div className={`${card} mt-4 divide-y divide-[#E4E1DA]`}>
            {t.faq.items.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43]">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg leading-none text-[#1FA855] transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#5B6472]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* ─────────── Footer ─────────── */}
      <footer className="border-t border-[#E4E1DA] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[#5B6472]">{t.footer.note}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={heroHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#116937] hover:underline"
            >
              {t.footer.wa}
            </a>
            <a href="https://www.acadpay.me" className="text-[#5B6472] hover:text-[#141A24]">
              {t.footer.back}
            </a>
            <a href="https://www.acadpay.me/mentions-legales" className="text-[#5B6472] hover:text-[#141A24]">
              {t.footer.mentions}
            </a>
          </div>
        </div>
      </footer>

      {/* ─────────── Bouton collant mobile ─────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4E1DA] bg-[#FBFAF7]/95 p-3 backdrop-blur sm:hidden">
        <a
          href={configHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnPrimary} w-full`}
        >
          {t.sticky} · {total} {CURRENCY}
        </a>
      </div>

      {/* ─────────── Lightbox ─────────── */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={PORTFOLIO[lightbox].caption}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141A24]/80 p-4"
          onClick={closeLightbox}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
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
              className="absolute end-3 top-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#141A24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t.portfolio.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
