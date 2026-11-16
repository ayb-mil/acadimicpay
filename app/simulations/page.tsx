"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import {
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import SimPreview, { type PreviewKind } from "./_hub/SimPreview";

const HeroScene = dynamic(() => import("./_hub/HeroScene"), { ssr: false });

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTES À ÉDITER — tout est ici, rien de dispersé dans le JSX.
   ══════════════════════════════════════════════════════════════════════════ */

/** Numéro WhatsApp au format international sans « + » (= +212 6 09 64 88 11). */
const WHATSAPP = "212609648811";

/** Bloc « À propos ». */
const ABOUT = {
  name: "Ayoub El Mqarta",
  // Même portrait que la page Confiance d'acadpay.me et que /presentations.
  photo: "/images/ayoub-el-mqarta.jpg",
};

type Domain = "mechanics" | "electricity" | "chemistry" | "nuclear" | "optics";

/** Métadonnées communes aux trois langues (les titres sont dans `content`). */
const SIMS: { href: string; kind: PreviewKind; domain: Domain; eq: string }[] = [
  { href: "/simulations/mouvement-projectile", kind: "projectile", domain: "mechanics", eq: "y = −g·x² / (2v₀²·cos²α) + x·tan α" },
  { href: "/simulations/pendule-simple", kind: "pendulum", domain: "mechanics", eq: "θ'' + (g/L)·sin θ = 0" },
  { href: "/simulations/circuit-rc", kind: "rc", domain: "electricity", eq: "u(t) = E·(1 − e^(−t/τ))" },
  { href: "/simulations/titrage-acido-basique", kind: "titration", domain: "chemistry", eq: "pH = −log [H₃O⁺]" },
  { href: "/simulations/oscillateur-rlc", kind: "rlc", domain: "electricity", eq: "u'' + (R/L)·u' + u/(LC) = 0" },
  { href: "/simulations/decroissance-radioactive", kind: "decay", domain: "nuclear", eq: "N(t) = N₀·e^(−λt)" },
  { href: "/simulations/refraction-lumiere", kind: "refraction", domain: "optics", eq: "n₁·sin i₁ = n₂·sin i₂" },
  { href: "/simulations/pile-daniell", kind: "daniell", domain: "chemistry", eq: "E = E° − 0,03·log Q" },
];

const DOMAIN_COLOR: Record<Domain, string> = {
  mechanics: "#22E4D9",
  electricity: "#9B7BFF",
  chemistry: "#FF5CC8",
  nuclear: "#4ADE80",
  optics: "#FFB547",
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
    wordmark: "Simulations PC",
    langAria: "Choisir la langue",
    hero: {
      eyebrow: "Simulations interactives · Physique-chimie · Lycée",
      h1Lead: "La physique que vos élèves",
      h1Accent: "voient enfin bouger.",
      sub: "Simulations HTML sur mesure, adaptées à votre chapitre du programme marocain. Utilisables en classe sans installation, sur ordinateur ou vidéoprojecteur.",
      cta: "Contacter sur WhatsApp",
      cta2: "Voir les simulations",
      stats: ["8 simulations en ligne", "Programme marocain", "Hors-ligne, sans installation"],
      scroll: "Défiler",
    },
    domains: { mechanics: "Mécanique", electricity: "Électricité", chemistry: "Chimie", nuclear: "Nucléaire", optics: "Optique" },
    demos: {
      eyebrow: "Laboratoire en ligne",
      title: "Simulations déjà en ligne",
      sub: "Huit exemples fonctionnels, à tester dès maintenant.",
      live: "Aperçu animé",
      cta: "Ouvrir",
      items: [
        { title: "Mouvement d'un projectile", href: "/simulations/mouvement-projectile" },
        { title: "Pendule simple", href: "/simulations/pendule-simple" },
        { title: "Charge et décharge d'un condensateur", href: "/simulations/circuit-rc" },
        { title: "Titrage acido-basique", href: "/simulations/titrage-acido-basique" },
        { title: "Oscillations libres dans un dipôle RLC", href: "/simulations/oscillateur-rlc" },
        { title: "Décroissance radioactive", href: "/simulations/decroissance-radioactive" },
        { title: "Réfraction de la lumière", href: "/simulations/refraction-lumiere" },
        { title: "Pile Daniell", href: "/simulations/pile-daniell" },
      ],
    },
    service: {
      eyebrow: "Sur mesure",
      title: "Pour vos cours de physique-chimie",
      text: "Vous m'envoyez le chapitre ou le phénomène à illustrer, je construis une simulation interactive adaptée à votre niveau : vos élèves font varier des paramètres et observent le résultat en temps réel.",
      examplesTitle: "Exemples de sujets",
      examples: [
        "Chute libre & mouvement",
        "Circuits RC / RLC",
        "Ondes mécaniques",
        "Titrage acido-basique",
        "Pile électrochimique",
        "Radioactivité",
      ],
    },
    proof: {
      eyebrow: "Rigueur scientifique",
      title: "Des modèles, pas des animations",
      sub: "Chaque simulation calcule la vraie physique : vos élèves peuvent vérifier les valeurs au tableau.",
      items: [
        { t: "Physique exacte", d: "Pendule résolu par Runge-Kutta 4 (sans approximation des petits angles), RLC par sa solution exacte, radioactivité par Monte-Carlo." },
        { t: "Sur mesure pour votre chapitre", d: "Paramètres, notations et niveau alignés sur votre cours du programme marocain." },
        { t: "Hors-ligne, sans installation", d: "Un fichier HTML autonome qui s'ouvre dans n'importe quel navigateur, sur PC ou vidéoprojecteur." },
        { t: "Pensé pour le vidéoprojecteur", d: "Grands tracés lisibles, contrôles simples : on manipule en direct devant la classe." },
      ],
    },
    pricing: {
      eyebrow: "Devis gratuit",
      title: "Tarif",
      text: "Le prix dépend de la complexité du sujet, du nombre de paramètres interactifs et du délai souhaité. Envoyez-moi votre chapitre pour un devis gratuit.",
      cta: "Demander un devis sur WhatsApp",
      payment: "Paiement par virement bancaire ou CashPlus, confirmé sur WhatsApp.",
    },
    steps: {
      eyebrow: "Processus",
      title: "Comment ça marche",
      items: [
        { t: "Vous me contactez sur WhatsApp", d: "Envoyez-moi le chapitre ou le phénomène à simuler." },
        { t: "On confirme le sujet", d: "Paramètres à faire varier, niveau et délai. Vous réglez ensuite par virement ou CashPlus." },
        { t: "Vous recevez votre simulation", d: "Un fichier HTML autonome, utilisable hors-ligne dans un navigateur." },
      ],
    },
    about: {
      eyebrow: "Le concepteur",
      title: "À propos",
      text: "Étudiant en Master à l'ENS Meknès (Université Moulay Ismaïl), physique. Je conçois et développe moi-même chaque simulation, sans sous-traitance.",
      photoAlt: "Photo",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Questions fréquentes",
      items: [
        { q: "Comment fonctionne la simulation ?", a: "C'est une page web interactive : vous ou vos élèves modifiez des paramètres (vitesse, angle, concentration…) et observez le résultat en temps réel." },
        { q: "Ai-je besoin d'internet ou d'une installation ?", a: "Non. La simulation est livrée en fichier HTML autonome : elle fonctionne hors-ligne, dans n'importe quel navigateur, sur PC ou vidéoprojecteur." },
        { q: "Quels sujets sont possibles ?", a: "Tout chapitre du programme marocain de physique-chimie au lycée (tronc commun, 1re et 2e Bac) : mécanique, électricité, ondes, chimie des solutions, etc." },
        { q: "Puis-je demander des modifications ?", a: "Oui, des ajustements sont inclus après la première version." },
        { q: "Comment se fait le paiement ?", a: "Par virement bancaire ou CashPlus, après accord sur les détails via WhatsApp. Aucun paiement n'est encaissé sur ce site." },
      ],
    },
    footer: {
      wa: "Contacter sur WhatsApp",
      back: "Retour à acadpay.me",
      mentions: "Mentions légales",
      note: "Service indépendant de simulations pédagogiques.",
    },
    sticky: "Demander un devis",
    waFloat: "Écrire sur WhatsApp",
    wa: "Bonjour, je suis enseignant(e) de physique-chimie et je souhaite une simulation interactive pour le lycée.",
  },

  ar: {
    dir: "rtl" as const,
    wordmark: "محاكاة ف.ك",
    langAria: "اختيار اللغة",
    hero: {
      eyebrow: "محاكاة تفاعلية · الفيزياء والكيمياء · الثانوي",
      h1Lead: "الفيزياء التي سيراها تلاميذك",
      h1Accent: "تتحرك أمامهم.",
      sub: "محاكاة بصيغة HTML مصممة خصيصاً حسب درسكم في المنهاج المغربي. تُستعمل في القسم دون أي تثبيت، على حاسوب أو عبر جهاز العرض.",
      cta: "تواصل عبر واتساب",
      cta2: "شاهد المحاكاة",
      stats: ["8 محاكاة متوفرة", "المنهاج المغربي", "دون إنترنت ولا تثبيت"],
      scroll: "مرّر",
    },
    domains: { mechanics: "الميكانيك", electricity: "الكهرباء", chemistry: "الكيمياء", nuclear: "الفيزياء النووية", optics: "البصريات" },
    demos: {
      eyebrow: "مختبر على الإنترنت",
      title: "محاكاة متوفرة الآن",
      sub: "ثماني أمثلة تشتغل فعلياً، جرّبها الآن.",
      live: "معاينة حية",
      cta: "فتح",
      items: [
        { title: "حركة قذيفة", href: "/simulations/mouvement-projectile" },
        { title: "البندول البسيط", href: "/simulations/pendule-simple" },
        { title: "شحن وتفريغ مكثف", href: "/simulations/circuit-rc" },
        { title: "المعايرة الحمضية القاعدية", href: "/simulations/titrage-acido-basique" },
        { title: "التذبذبات الحرة في ثنائي القطب RLC", href: "/simulations/oscillateur-rlc" },
        { title: "التناقص الإشعاعي", href: "/simulations/decroissance-radioactive" },
        { title: "انكسار الضوء", href: "/simulations/refraction-lumiere" },
        { title: "عمود دانيال", href: "/simulations/pile-daniell" },
      ],
    },
    service: {
      eyebrow: "حسب الطلب",
      title: "لدروسكم في الفيزياء والكيمياء",
      text: "ترسلون لي الدرس أو الظاهرة المراد توضيحها، وأبني محاكاة تفاعلية مناسبة لمستوى تلاميذكم: يغيّرون المُعطيات ويشاهدون النتيجة مباشرة.",
      examplesTitle: "أمثلة عن مواضيع",
      examples: [
        "السقوط الحر والحركة",
        "دارات RC / RLC",
        "الموجات الميكانيكية",
        "المعايرة الحمضية القاعدية",
        "العمود الكهركيميائي",
        "النشاط الإشعاعي",
      ],
    },
    proof: {
      eyebrow: "دقة علمية",
      title: "نماذج حقيقية، لا مجرد رسوم متحركة",
      sub: "كل محاكاة تحسب الفيزياء الحقيقية: يستطيع تلاميذك التحقق من القيم على السبورة.",
      items: [
        { t: "فيزياء دقيقة", d: "البندول محلول بطريقة رونج-كوتا 4 دون تقريب الزوايا الصغيرة، ودارة RLC بحلها المضبوط، والنشاط الإشعاعي بطريقة مونت كارلو." },
        { t: "حسب درسكم", d: "المُعطيات والرموز والمستوى متوافقة مع درسكم في المنهاج المغربي." },
        { t: "دون إنترنت ولا تثبيت", d: "ملف HTML مستقل يُفتح في أي متصفح، على حاسوب أو عبر جهاز العرض." },
        { t: "مصممة لجهاز العرض", d: "منحنيات كبيرة واضحة وأزرار بسيطة: تتحكم فيها مباشرة أمام القسم." },
      ],
    },
    pricing: {
      eyebrow: "عرض ثمن مجاني",
      title: "الثمن",
      text: "يعتمد الثمن على تعقيد الموضوع وعدد المُعطيات التفاعلية والمدة المطلوبة. أرسل لي درسك للحصول على عرض ثمن مجاني.",
      cta: "طلب عرض ثمن عبر واتساب",
      payment: "الأداء عبر تحويل بنكي أو CashPlus، ويُؤكَّد عبر واتساب.",
    },
    steps: {
      eyebrow: "المراحل",
      title: "كيف تتم العملية",
      items: [
        { t: "تتواصل معي عبر واتساب", d: "أرسل لي الدرس أو الظاهرة المراد محاكاتها." },
        { t: "نتفق على الموضوع", d: "المُعطيات المراد تغييرها، المستوى، والمدة، ثم تؤدي عبر تحويل بنكي أو CashPlus." },
        { t: "تستلم محاكاتك", d: "ملف HTML مستقل، يشتغل دون اتصال بالإنترنت في أي متصفح." },
      ],
    },
    about: {
      eyebrow: "المصمم",
      title: "من أنا",
      text: "طالب في سلك الماستر بالمدرسة العليا للأساتذة بمكناس (جامعة مولاي إسماعيل)، تخصص فيزياء. أصمم وأطوّر كل محاكاة بنفسي، دون وساطة.",
      photoAlt: "صورة",
    },
    faq: {
      eyebrow: "أسئلة",
      title: "أسئلة شائعة",
      items: [
        { q: "كيف تشتغل المحاكاة؟", a: "هي صفحة ويب تفاعلية: أنت أو تلاميذك تغيّرون مُعطيات (السرعة، الزاوية، التركيز…) وتشاهدون النتيجة مباشرة." },
        { q: "هل أحتاج إلى الإنترنت أو تثبيت؟", a: "لا. تُسلَّم المحاكاة كملف HTML مستقل: تشتغل دون اتصال بالإنترنت، في أي متصفح، على حاسوب أو عبر جهاز العرض." },
        { q: "ما هي المواضيع الممكنة؟", a: "كل دروس المنهاج المغربي للفيزياء والكيمياء بالثانوي (الجذع المشترك، الأولى والثانية بكالوريا): الميكانيك، الكهرباء، الموجات، كيمياء المحاليل، إلخ." },
        { q: "هل يمكنني طلب تعديلات؟", a: "نعم، بعض التعديلات مُدرَجة بعد النسخة الأولى." },
        { q: "كيف يتم الأداء؟", a: "عبر تحويل بنكي أو CashPlus، بعد الاتفاق على التفاصيل في واتساب. لا يتم أي أداء عبر هذا الموقع." },
      ],
    },
    footer: {
      wa: "تواصل عبر واتساب",
      back: "العودة إلى acadpay.me",
      mentions: "معلومات قانونية",
      note: "خدمة مستقلة للمحاكاة التربوية.",
    },
    sticky: "طلب عرض ثمن",
    waFloat: "راسلني على واتساب",
    wa: "مرحباً، أنا أستاذ(ة) للفيزياء والكيمياء وأرغب في محاكاة تفاعلية للثانوي.",
  },

  en: {
    dir: "ltr" as const,
    wordmark: "PC Simulations",
    langAria: "Choose language",
    hero: {
      eyebrow: "Interactive simulations · Physics-chemistry · High school",
      h1Lead: "The physics your students",
      h1Accent: "finally see move.",
      sub: "Custom HTML simulations matched to your chapter in the Moroccan curriculum. Usable in class with no installation, on a computer or projector.",
      cta: "Contact on WhatsApp",
      cta2: "See the simulations",
      stats: ["8 simulations online", "Moroccan curriculum", "Offline, no install"],
      scroll: "Scroll",
    },
    domains: { mechanics: "Mechanics", electricity: "Electricity", chemistry: "Chemistry", nuclear: "Nuclear", optics: "Optics" },
    demos: {
      eyebrow: "Online lab",
      title: "Simulations already online",
      sub: "Eight working examples, ready to try now.",
      live: "Live preview",
      cta: "Open",
      items: [
        { title: "Projectile motion", href: "/simulations/mouvement-projectile" },
        { title: "Simple pendulum", href: "/simulations/pendule-simple" },
        { title: "Capacitor charge and discharge", href: "/simulations/circuit-rc" },
        { title: "Acid-base titration", href: "/simulations/titrage-acido-basique" },
        { title: "Free oscillations in an RLC dipole", href: "/simulations/oscillateur-rlc" },
        { title: "Radioactive decay", href: "/simulations/decroissance-radioactive" },
        { title: "Refraction of light", href: "/simulations/refraction-lumiere" },
        { title: "Daniell cell", href: "/simulations/pile-daniell" },
      ],
    },
    service: {
      eyebrow: "Made to order",
      title: "For your physics-chemistry lessons",
      text: "Send me the chapter or phenomenon to illustrate, and I build an interactive simulation suited to your level: your students change parameters and see the result in real time.",
      examplesTitle: "Example topics",
      examples: [
        "Free fall & motion",
        "RC / RLC circuits",
        "Mechanical waves",
        "Acid-base titration",
        "Electrochemical cell",
        "Radioactivity",
      ],
    },
    proof: {
      eyebrow: "Scientific rigor",
      title: "Real models, not just animations",
      sub: "Every simulation computes the actual physics: your students can check the values on the board.",
      items: [
        { t: "Exact physics", d: "Pendulum solved with Runge-Kutta 4 (no small-angle approximation), RLC by its exact solution, radioactivity by Monte-Carlo." },
        { t: "Built for your chapter", d: "Parameters, notation and level matched to your lesson in the Moroccan curriculum." },
        { t: "Offline, no install", d: "A self-contained HTML file that opens in any browser, on a computer or projector." },
        { t: "Made for the projector", d: "Large, readable curves and simple controls: drive it live in front of the class." },
      ],
    },
    pricing: {
      eyebrow: "Free quote",
      title: "Price",
      text: "The price depends on the topic's complexity, the number of interactive parameters, and the requested deadline. Send me your chapter for a free quote.",
      cta: "Ask for a quote on WhatsApp",
      payment: "Payment by bank transfer or CashPlus, confirmed on WhatsApp.",
    },
    steps: {
      eyebrow: "Process",
      title: "How it works",
      items: [
        { t: "You contact me on WhatsApp", d: "Send me the chapter or phenomenon to simulate." },
        { t: "We confirm the topic", d: "Parameters to vary, level and deadline. You then pay by bank transfer or CashPlus." },
        { t: "You receive your simulation", d: "A self-contained HTML file, usable offline in any browser." },
      ],
    },
    about: {
      eyebrow: "The maker",
      title: "About",
      text: "Master's student at ENS Meknès (Moulay Ismaïl University), physics. I design and build every simulation myself, with no outsourcing.",
      photoAlt: "Photo",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Frequently asked questions",
      items: [
        { q: "How does the simulation work?", a: "It's an interactive web page: you or your students change parameters (speed, angle, concentration…) and watch the result update live." },
        { q: "Do I need internet or an installation?", a: "No. The simulation is delivered as a self-contained HTML file: it works offline, in any browser, on a computer or projector." },
        { q: "Which topics are possible?", a: "Any chapter of the Moroccan high-school physics-chemistry curriculum (common core, 1st and 2nd Bac): mechanics, electricity, waves, solution chemistry, etc." },
        { q: "Can I ask for changes?", a: "Yes, some adjustments are included after the first version." },
        { q: "How is payment made?", a: "By bank transfer or CashPlus, after agreeing the details on WhatsApp. No payment is taken on this site." },
      ],
    },
    footer: {
      wa: "Contact on WhatsApp",
      back: "Back to acadpay.me",
      mentions: "Legal notice",
      note: "Independent educational simulation service.",
    },
    sticky: "Ask for a quote",
    waFloat: "Message me on WhatsApp",
    wa: "Hello, I am a physics-chemistry teacher and I would like an interactive simulation for high school.",
  },
};

/* ══════════════════════════════════════════════════════════════════════════ */

/** Construit un lien WhatsApp avec message pré-rempli. */
function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

const DISPLAY = "font-[family-name:var(--ui-display)]";
const MONO = "font-mono";
const GRAD_TEXT = "bg-gradient-to-r from-[#22E4D9] via-[#7FD8FF] to-[#9B7BFF] bg-clip-text text-transparent";
const BTN_WA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-[#04121A] shadow-[0_0_32px_-8px_rgba(37,211,102,0.8)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-[#E8EEFA] backdrop-blur transition hover:border-[#22E4D9]/70 hover:bg-[#22E4D9]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22E4D9]";
const GLASS = "rounded-3xl border border-white/[0.08] bg-[#0A1226]/70 backdrop-blur-xl";

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41" />
    </svg>
  );
}

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal>
      <p className={`${MONO} text-xs font-semibold uppercase tracking-[0.2em] text-[#22E4D9]`}>{eyebrow}</p>
      <h2 className={`${DISPLAY} mt-3 text-3xl font-bold tracking-tight sm:text-4xl`}>{title}</h2>
      {sub ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#8C9CC0]">{sub}</p> : null}
    </Reveal>
  );
}

/* Carte inclinable au survol (souris uniquement) + halo qui suit le pointeur. */
function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 22 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    if (reduce || e.pointerType !== "mouse") return;
    ry.set((px - 0.5) * 8);
    rx.set(-(py - 0.5) * 8);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Onde statique affichée tout de suite, avant que la scène WebGL ne soit prête. */
function PosterWave() {
  const path = (phase: number, amp: number) => {
    let d = "";
    for (let i = 0; i <= 120; i++) {
      const x = (i / 120) * 1200;
      const env = Math.pow(Math.sin(Math.PI * (i / 120)), 0.7);
      const y = 300 + amp * env * Math.sin((i / 120) * Math.PI * 6 + phase);
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  };
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <path d={path(0, 130)} fill="none" stroke="#22E4D9" strokeOpacity="0.55" strokeWidth="2.5" />
      <path d={path(0, 60)} fill="none" stroke="#9B7BFF" strokeOpacity="0.45" strokeWidth="2.5" />
      <line x1="0" y1="300" x2="1200" y2="300" stroke="#C8D6F5" strokeOpacity="0.25" />
    </svg>
  );
}

function ProofIcon({ i }: { i: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      {i === 0 && <path {...common} d="M3 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0" />}
      {i === 1 && (
        <g {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" />
        </g>
      )}
      {i === 2 && (
        <g {...common}>
          <path d="M4 6h16v10H4z" />
          <path d="M9 20h6M12 16v4" />
          <path d="M8 11l2.5 2.5L16 8" />
        </g>
      )}
      {i === 3 && (
        <g {...common}>
          <path d="M3 8h14v8H3z" />
          <circle cx="10" cy="12" r="2" />
          <path d="M17 10l4-2v8l-4-2" />
        </g>
      )}
    </svg>
  );
}

export default function SimulationsPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const t = content[locale];
  const isAr = locale === "ar";
  const waHref = waLink(t.wa);
  const reduce = useReducedMotion();

  const heroRef = useRef<HTMLElement | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const stepsRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: stepsRef, offset: ["start 85%", "end 55%"] });
  const stepsLine = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <MotionConfig reducedMotion="user">
      <div
        dir={t.dir}
        lang={locale}
        style={
          {
            "--ui-body": isAr ? "var(--font-arabic)" : "var(--font-inter)",
            "--ui-display": isAr ? "var(--font-arabic)" : "var(--font-display)",
            fontFamily: "var(--ui-body), system-ui, sans-serif",
          } as CSSProperties
        }
        className="relative min-h-screen overflow-x-hidden bg-[#05080F] text-[#E8EEFA] antialiased selection:bg-[#22E4D9]/30"
      >
        {/* Trame de points discrète sur toute la page. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(140,156,192,0.13)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
        />

        {/* ─────────── Header ─────────── */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#05080F]/55 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <a href="#top" className={`${DISPLAY} flex items-center gap-2.5 text-base font-bold tracking-tight`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#22E4D9]/40 bg-[#22E4D9]/10 text-[#22E4D9] shadow-[0_0_20px_-6px_#22E4D9]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M2 12c2.5-7 5-7 7.5 0s5 7 7.5 0 3.5-5 5-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </span>
              {t.wordmark}
            </a>
            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label={t.langAria}
                className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-1"
              >
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLocale(l.code)}
                    aria-pressed={locale === l.code}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22E4D9] ${
                      locale === l.code ? "bg-[#22E4D9] text-[#04121A]" : "text-[#8C9CC0] hover:text-[#E8EEFA]"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.footer.wa}
                className="hidden items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-[#04121A] transition hover:brightness-110 sm:inline-flex"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </header>

        <main id="top" className="relative pb-28 sm:pb-20">
          {/* ─────────── Hero ─────────── */}
          <section ref={heroRef} className="relative isolate flex min-h-[100svh] items-start overflow-hidden pb-10 pt-[44svh] sm:items-center sm:pb-0 sm:pt-24">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(34,228,217,0.14),transparent_60%),radial-gradient(ellipse_60%_50%_at_20%_80%,rgba(155,123,255,0.12),transparent_60%)]"
            />
            <div
              aria-hidden="true"
              className={`absolute inset-x-0 top-0 -z-20 h-[50svh] transition-opacity duration-1000 sm:inset-0 sm:h-auto ${sceneReady ? "opacity-0" : "opacity-100"}`}
            >
              <PosterWave />
            </div>
            <div
              aria-hidden="true"
              dir="ltr"
              className={`absolute inset-x-0 top-0 -z-20 h-[50svh] transition-opacity duration-1000 sm:inset-0 sm:h-auto ${sceneReady ? "opacity-100" : "opacity-0"}`}
            >
              <HeroScene active={heroVisible && !reduce} side={isAr ? -1 : 1} onReady={() => setSceneReady(true)} />
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[36svh] -z-10 h-[28svh] bg-gradient-to-b from-transparent via-[#05080F] to-transparent sm:hidden" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-r from-[#05080F] via-[#05080F]/70 to-transparent sm:block rtl:bg-gradient-to-l" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#05080F] to-transparent" />

            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
              <div className="max-w-2xl">
                <p
                  className="animate-[reveal-up_0.8s_cubic-bezier(0.22,1,0.36,1)_both] inline-flex items-center gap-2 rounded-full border border-[#22E4D9]/30 bg-[#22E4D9]/[0.07] px-3 py-1.5 text-xs font-semibold text-[#9FF3EE]"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-70 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" />
                  </span>
                  {t.hero.eyebrow}
                </p>
                <h1
                  className={`${DISPLAY} animate-[reveal-up_0.8s_cubic-bezier(0.22,1,0.36,1)_both] [animation-delay:100ms] mt-5 text-[2.3rem] sm:mt-6 font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl`}
                >
                  {t.hero.h1Lead} <span className={`${GRAD_TEXT} drop-shadow-[0_0_30px_rgba(34,228,217,0.35)]`}>{t.hero.h1Accent}</span>
                </h1>
                <p
                  className="animate-[reveal-up_0.8s_cubic-bezier(0.22,1,0.36,1)_both] [animation-delay:250ms] mt-6 max-w-xl text-base leading-relaxed text-[#A9B6D3] sm:text-lg"
                >
                  {t.hero.sub}
                </p>
                <div
                  className="animate-[reveal-up_0.8s_cubic-bezier(0.22,1,0.36,1)_both] [animation-delay:400ms] mt-8 flex flex-wrap gap-3"
                >
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className={BTN_WA}>
                    <WhatsAppIcon />
                    {t.hero.cta}
                  </a>
                  <a href="#simulations" className={BTN_GHOST}>
                    {t.hero.cta2}
                    <span aria-hidden="true" className="inline-block rtl:-scale-x-100">→</span>
                  </a>
                </div>
                <ul
                  className="animate-[reveal-up_0.8s_cubic-bezier(0.22,1,0.36,1)_both] [animation-delay:550ms] mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#8C9CC0]"
                >
                  {t.hero.stats.map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ["#22E4D9", "#9B7BFF", "#4ADE80"][i] }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <a
              href="#simulations"
              className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#8C9CC0] transition hover:text-[#E8EEFA] sm:flex"
            >
              {t.hero.scroll}
              <span className="flex h-8 w-5 justify-center rounded-full border border-white/20 pt-1.5">
                <span className="h-1.5 w-1 rounded-full bg-[#22E4D9] motion-safe:animate-bounce" />
              </span>
            </a>
          </section>

          {/* ─────────── Galerie des simulations ─────────── */}
          <section id="simulations" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 pt-16 sm:px-6 sm:pt-24">
            <SectionHead eyebrow={t.demos.eyebrow} title={t.demos.title} sub={t.demos.sub} />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {t.demos.items.map((item, i) => {
                const meta = SIMS.find((s) => s.href === item.href);
                if (!meta) return null;
                const color = DOMAIN_COLOR[meta.domain];
                return (
                  <li key={item.href}>
                    <Reveal delay={(i % 4) * 0.06} className="h-full">
                      <TiltCard className="group relative h-full rounded-3xl p-px transition-shadow duration-300 hover:shadow-[0_0_50px_-12px_rgba(34,228,217,0.55)]">
                        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl bg-white/[0.09]" />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-[#22E4D9] via-[#9B7BFF] to-[#4ADE80] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                        <a
                          href={item.href}
                          className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#0A1226] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22E4D9]"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.06]">
                            <SimPreview kind={meta.kind} animate={!reduce} />
                            <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#05080F]/70 px-2 py-0.5 text-[10px] font-semibold text-[#8C9CC0] backdrop-blur">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
                              {t.demos.live}
                            </span>
                          </div>
                          <div className="relative flex flex-1 flex-col p-5">
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 [background:radial-gradient(300px_circle_at_var(--mx,50%)_var(--my,0%),rgba(34,228,217,0.10),transparent_60%)] group-hover:opacity-100"
                            />
                            <span
                              className="w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ color, borderColor: `${color}55`, background: `${color}12` }}
                            >
                              {t.domains[meta.domain]}
                            </span>
                            <h3 className={`${DISPLAY} mt-3 text-lg font-bold leading-snug`}>{item.title}</h3>
                            <p dir="ltr" className={`${MONO} mt-2 truncate text-start text-xs text-[#8C9CC0] rtl:text-end`}>
                              {meta.eq}
                            </p>
                            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[#22E4D9]">
                              {t.demos.cta}
                              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1">
                                →
                              </span>
                            </span>
                          </div>
                        </a>
                      </TiltCard>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ─────────── Sur mesure ─────────── */}
          <section className="relative mx-auto max-w-7xl px-4 pt-24 sm:px-6">
            <Reveal>
              <div className={`${GLASS} relative overflow-hidden p-7 sm:p-12`}>
                <div aria-hidden="true" className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-[#9B7BFF]/20 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-[#22E4D9]/15 blur-3xl" />
                <p className={`${MONO} text-xs font-semibold uppercase tracking-[0.2em] text-[#9B7BFF]`}>{t.service.eyebrow}</p>
                <h2 className={`${DISPLAY} mt-3 max-w-3xl text-2xl font-bold tracking-tight sm:text-4xl`}>{t.service.title}</h2>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#A9B6D3] sm:text-lg">{t.service.text}</p>
                <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-[#8C9CC0]">{t.service.examplesTitle}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {t.service.examples.map((ex) => (
                    <li key={ex} className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-[#C8D6F5]">
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </section>

          {/* ─────────── Rigueur scientifique ─────────── */}
          <section className="relative mx-auto max-w-7xl px-4 pt-24 sm:px-6">
            <SectionHead eyebrow={t.proof.eyebrow} title={t.proof.title} sub={t.proof.sub} />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.proof.items.map((item, i) => {
                const color = ["#22E4D9", "#9B7BFF", "#4ADE80", "#FFB547"][i];
                return (
                  <li key={item.t}>
                    <Reveal delay={i * 0.07} className="h-full">
                      <div className={`${GLASS} group h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20`}>
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border transition group-hover:scale-110"
                          style={{ color, borderColor: `${color}55`, background: `${color}14`, boxShadow: `0 0 24px -8px ${color}` }}
                        >
                          <ProofIcon i={i} />
                        </span>
                        <h3 className={`${DISPLAY} mt-5 text-base font-bold`}>{item.t}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#8C9CC0]">{item.d}</p>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ─────────── Étapes ─────────── */}
          <section id="comment-ca-marche" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-6">
            <SectionHead eyebrow={t.steps.eyebrow} title={t.steps.title} />
            <div ref={stepsRef} className="relative mt-12">
              <div aria-hidden="true" className="absolute start-[22px] top-0 h-full w-px bg-white/10 sm:start-0 sm:top-[22px] sm:h-px sm:w-full" />
              <motion.div
                aria-hidden="true"
                style={{ scaleY: stepsLine }}
                className="absolute start-[22px] top-0 h-full w-px origin-top bg-gradient-to-b from-[#22E4D9] to-[#9B7BFF] sm:hidden"
              />
              <motion.div
                aria-hidden="true"
                style={{ scaleX: stepsLine }}
                className="absolute start-0 top-[22px] hidden h-px w-full origin-left bg-gradient-to-r from-[#22E4D9] to-[#9B7BFF] shadow-[0_0_12px_#22E4D9] sm:block rtl:origin-right rtl:bg-gradient-to-l"
              />
              <ol className="relative grid gap-10 sm:grid-cols-3 sm:gap-8">
                {t.steps.items.map((step, i) => (
                  <li key={step.t} className="relative flex gap-5 sm:block">
                    <Reveal delay={i * 0.1}>
                      <span className={`${MONO} relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#22E4D9]/50 bg-[#05080F] text-sm font-bold text-[#22E4D9] shadow-[0_0_24px_-6px_#22E4D9]`}>
                        0{i + 1}
                      </span>
                    </Reveal>
                    <Reveal delay={i * 0.1 + 0.05}>
                      <h3 className={`${DISPLAY} text-lg font-bold sm:mt-6`}>{step.t}</h3>
                      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#8C9CC0]">{step.d}</p>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ─────────── Tarif ─────────── */}
          <section id="tarif" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-6">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-[#22E4D9]/25 bg-gradient-to-br from-[#0E1830] via-[#0A1226] to-[#120E2E] p-7 sm:p-12">
                <div aria-hidden="true" className="pointer-events-none absolute -end-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#22E4D9]/15 blur-3xl" />
                <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                  <div>
                    <p className={`${MONO} text-xs font-semibold uppercase tracking-[0.2em] text-[#4ADE80]`}>{t.pricing.eyebrow}</p>
                    <h2 className={`${DISPLAY} mt-3 text-3xl font-bold tracking-tight sm:text-4xl`}>{t.pricing.title}</h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-[#A9B6D3]">{t.pricing.text}</p>
                  </div>
                  <div className="flex flex-col gap-4 lg:items-end">
                    <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${BTN_WA} w-full lg:w-auto`}>
                      <WhatsAppIcon />
                      {t.pricing.cta}
                    </a>
                    <p className="text-sm text-[#8C9CC0] lg:text-end">{t.pricing.payment}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ─────────── À propos ─────────── */}
          <section className="relative mx-auto max-w-7xl px-4 pt-24 sm:px-6">
            <SectionHead eyebrow={t.about.eyebrow} title={t.about.title} />
            <Reveal>
              <div className={`${GLASS} mt-8 flex flex-col gap-6 p-7 sm:flex-row sm:items-center`}>
                <div className="relative h-24 w-24 shrink-0">
                  <div aria-hidden="true" className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#22E4D9] to-[#9B7BFF] opacity-80 blur-[2px]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ABOUT.photo} alt={t.about.photoAlt} className="relative h-24 w-24 rounded-full border-2 border-[#05080F] object-cover" />
                </div>
                <div className="min-w-0">
                  <p className={`${DISPLAY} text-xl font-bold`}>{ABOUT.name}</p>
                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-[#A9B6D3]">{t.about.text}</p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ─────────── FAQ ─────────── */}
          <section className="relative mx-auto max-w-4xl px-4 pt-24 sm:px-6">
            <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} />
            <Reveal>
              <div className={`${GLASS} mt-8 divide-y divide-white/[0.07]`}>
                {t.faq.items.map((item) => (
                  <details key={item.q} className="group p-5 sm:p-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22E4D9]">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#22E4D9]/40 text-lg leading-none text-[#22E4D9] transition group-open:rotate-45 group-open:bg-[#22E4D9]/10"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-[#A9B6D3]">{item.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </section>
        </main>

        {/* ─────────── Footer ─────────── */}
        <footer className="relative border-t border-white/[0.06] bg-[#05080F]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22E4D9]/60 to-transparent" />
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[#8C9CC0]">{t.footer.note}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#25D366] hover:underline">
                {t.footer.wa}
              </a>
              <a href="https://www.acadpay.me" className="text-[#8C9CC0] hover:text-[#E8EEFA]">
                {t.footer.back}
              </a>
              <a href="https://www.acadpay.me/mentions-legales" className="text-[#8C9CC0] hover:text-[#E8EEFA]">
                {t.footer.mentions}
              </a>
            </div>
          </div>
        </footer>

        {/* ─────────── WhatsApp flottant (desktop) ─────────── */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.waFloat}
          title={t.waFloat}
          className="fixed bottom-6 end-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#04121A] shadow-[0_0_40px_-6px_rgba(37,211,102,0.85)] transition hover:scale-105 sm:flex"
        >
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 motion-safe:animate-ping" />
          <WhatsAppIcon className="relative h-7 w-7" />
        </a>

        {/* ─────────── Bouton collant mobile ─────────── */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#05080F]/85 p-3 backdrop-blur-xl sm:hidden">
          <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${BTN_WA} w-full`}>
            <WhatsAppIcon />
            {t.sticky}
          </a>
        </div>
      </div>
    </MotionConfig>
  );
}
