"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTES À ÉDITER — tout est ici, rien de dispersé dans le JSX.
   ══════════════════════════════════════════════════════════════════════════ */

/** Numéro WhatsApp au format international sans « + » (= +212 6 09 93 32 18). */
const WHATSAPP = "212609933218";

/** Bloc « À propos ». */
const ABOUT = {
  name: "Ayoub El Mqarta",
  // Même portrait que la page Confiance d'acadpay.me et que /presentations.
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
    wordmark: "Simulations PC",
    langAria: "Choisir la langue",
    hero: {
      h1: "Simulations interactives de physique-chimie pour le lycée",
      sub: "Simulations HTML sur mesure, adaptées à votre chapitre du programme marocain. Utilisables en classe sans installation, sur ordinateur ou vidéoprojecteur.",
      cta: "Contacter sur WhatsApp",
      cta2: "Comment ça marche",
    },
    service: {
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
    demos: {
      title: "Simulations déjà en ligne",
      sub: "Quatre exemples fonctionnels, à tester dès maintenant.",
      cta: "Ouvrir",
      items: [
        { title: "Mouvement d'un projectile", href: "/simulations/mouvement-projectile" },
        { title: "Pendule simple", href: "/simulations/pendule-simple" },
        { title: "Charge et décharge d'un condensateur", href: "/simulations/circuit-rc" },
        { title: "Titrage acido-basique", href: "/simulations/titrage-acido-basique" },
      ],
    },
    pricing: {
      title: "Tarif",
      text: "Le prix dépend de la complexité du sujet, du nombre de paramètres interactifs et du délai souhaité. Envoyez-moi votre chapitre pour un devis gratuit.",
      cta: "Demander un devis sur WhatsApp",
      payment: "Paiement par virement bancaire ou CashPlus, confirmé sur WhatsApp.",
    },
    steps: {
      title: "Comment ça marche",
      items: [
        { t: "Vous me contactez sur WhatsApp", d: "Envoyez-moi le chapitre ou le phénomène à simuler." },
        { t: "On confirme le sujet", d: "Paramètres à faire varier, niveau et délai. Vous réglez ensuite par virement ou CashPlus." },
        { t: "Vous recevez votre simulation", d: "Un fichier HTML autonome, utilisable hors-ligne dans un navigateur." },
      ],
    },
    about: {
      title: "À propos",
      text: "Étudiant en Master à l'ENS Meknès (Université Moulay Ismaïl), physique. Je conçois et développe moi-même chaque simulation, sans sous-traitance.",
      photoAlt: "Photo",
    },
    faq: {
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
    wa: "Bonjour, je suis enseignant(e) de physique-chimie et je souhaite une simulation interactive pour le lycée.",
  },

  ar: {
    dir: "rtl" as const,
    wordmark: "محاكاة ف.ك",
    langAria: "اختيار اللغة",
    hero: {
      h1: "محاكاة تفاعلية في الفيزياء والكيمياء للثانوي",
      sub: "محاكاة بصيغة HTML مصممة خصيصاً حسب درسكم في المنهاج المغربي. تُستعمل في القسم دون أي تثبيت، على حاسوب أو عبر جهاز العرض.",
      cta: "تواصل عبر واتساب",
      cta2: "كيف تتم العملية",
    },
    service: {
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
    demos: {
      title: "محاكاة متوفرة الآن",
      sub: "أربعة أمثلة تشتغل فعلياً، جرّبها الآن.",
      cta: "فتح",
      items: [
        { title: "حركة قذيفة", href: "/simulations/mouvement-projectile" },
        { title: "البندول البسيط", href: "/simulations/pendule-simple" },
        { title: "شحن وتفريغ مكثف", href: "/simulations/circuit-rc" },
        { title: "المعايرة الحمضية القاعدية", href: "/simulations/titrage-acido-basique" },
      ],
    },
    pricing: {
      title: "الثمن",
      text: "يعتمد الثمن على تعقيد الموضوع وعدد المُعطيات التفاعلية والمدة المطلوبة. أرسل لي درسك للحصول على عرض ثمن مجاني.",
      cta: "طلب عرض ثمن عبر واتساب",
      payment: "الأداء عبر تحويل بنكي أو CashPlus، ويُؤكَّد عبر واتساب.",
    },
    steps: {
      title: "كيف تتم العملية",
      items: [
        { t: "تتواصل معي عبر واتساب", d: "أرسل لي الدرس أو الظاهرة المراد محاكاتها." },
        { t: "نتفق على الموضوع", d: "المُعطيات المراد تغييرها، المستوى، والمدة، ثم تؤدي عبر تحويل بنكي أو CashPlus." },
        { t: "تستلم محاكاتك", d: "ملف HTML مستقل، يشتغل دون اتصال بالإنترنت في أي متصفح." },
      ],
    },
    about: {
      title: "من أنا",
      text: "طالب في سلك الماستر بالمدرسة العليا للأساتذة بمكناس (جامعة مولاي إسماعيل)، تخصص فيزياء. أصمم وأطوّر كل محاكاة بنفسي، دون وساطة.",
      photoAlt: "صورة",
    },
    faq: {
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
    wa: "مرحباً، أنا أستاذ(ة) للفيزياء والكيمياء وأرغب في محاكاة تفاعلية للثانوي.",
  },

  en: {
    dir: "ltr" as const,
    wordmark: "PC Simulations",
    langAria: "Choose language",
    hero: {
      h1: "Interactive physics-chemistry simulations for high school",
      sub: "Custom HTML simulations matched to your chapter in the Moroccan curriculum. Usable in class with no installation, on a computer or projector.",
      cta: "Contact on WhatsApp",
      cta2: "How it works",
    },
    service: {
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
    demos: {
      title: "Simulations already online",
      sub: "Four working examples, ready to try now.",
      cta: "Open",
      items: [
        { title: "Projectile motion", href: "/simulations/mouvement-projectile" },
        { title: "Simple pendulum", href: "/simulations/pendule-simple" },
        { title: "Capacitor charge and discharge", href: "/simulations/circuit-rc" },
        { title: "Acid-base titration", href: "/simulations/titrage-acido-basique" },
      ],
    },
    pricing: {
      title: "Price",
      text: "The price depends on the topic's complexity, the number of interactive parameters, and the requested deadline. Send me your chapter for a free quote.",
      cta: "Ask for a quote on WhatsApp",
      payment: "Payment by bank transfer or CashPlus, confirmed on WhatsApp.",
    },
    steps: {
      title: "How it works",
      items: [
        { t: "You contact me on WhatsApp", d: "Send me the chapter or phenomenon to simulate." },
        { t: "We confirm the topic", d: "Parameters to vary, level and deadline. You then pay by bank transfer or CashPlus." },
        { t: "You receive your simulation", d: "A self-contained HTML file, usable offline in any browser." },
      ],
    },
    about: {
      title: "About",
      text: "Master's student at ENS Meknès (Moulay Ismaïl University), physics. I design and build every simulation myself, with no outsourcing.",
      photoAlt: "Photo",
    },
    faq: {
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
    wa: "Hello, I am a physics-chemistry teacher and I would like an interactive simulation for high school.",
  },
};

/* ══════════════════════════════════════════════════════════════════════════ */

/** Construit un lien WhatsApp avec message pré-rempli. */
function waLink(message: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export default function SimulationsPage() {
  const [locale, setLocale] = useState<Locale>("fr");

  const t = content[locale];
  const isAr = locale === "ar";
  const waHref = waLink(t.wa);

  const btnPrimary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#157F43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#116937] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43]";
  const btnGhost =
    "inline-flex items-center justify-center rounded-xl border border-[#E4E1DA] bg-white px-5 py-3 text-sm font-semibold text-[#141A24] transition hover:border-[#1FA855] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#157F43]";
  const card = "rounded-2xl border border-[#E4E1DA] bg-white";

  return (
    <div
      data-simulations
      dir={t.dir}
      lang={locale}
      style={
        {
          "--ui-body": isAr ? "var(--font-arabic)" : "var(--font-inter)",
          "--ui-display": isAr ? "var(--font-arabic)" : "var(--font-display)",
        } as CSSProperties
      }
      className="min-h-screen overflow-x-hidden bg-[#FBFAF7] text-[#141A24]"
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
        <section className="relative mx-auto max-w-5xl px-4 pt-12 sm:px-6 sm:pt-16">
          <div className="relative max-w-2xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {t.hero.h1}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5B6472]">{t.hero.sub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                {t.hero.cta}
              </a>
              <a href="#comment-ca-marche" className={btnGhost}>
                {t.hero.cta2}
              </a>
            </div>
          </div>
        </section>

        {/* ─────────── Service ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <div className={`${card} p-6`}>
            <h2 className="text-lg font-bold">{t.service.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5B6472]">{t.service.text}</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#5B6472]">
              {t.service.examplesTitle}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.service.examples.map((ex) => (
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

        {/* ─────────── Démos disponibles ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.demos.title}</h2>
          <p className="mt-1 text-sm text-[#5B6472]">{t.demos.sub}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {t.demos.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`${card} flex items-center justify-between gap-3 p-4 transition hover:border-[#1FA855]`}
                >
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span className="shrink-0 rounded-lg border border-[#E4E1DA] bg-[#FBFAF7] px-3 py-1.5 text-xs font-semibold text-[#116937]">
                    {t.demos.cta}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ─────────── Tarif ─────────── */}
        <section id="tarif" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.pricing.title}</h2>
          <div className={`${card} mt-4 p-6`}>
            <p className="text-sm leading-relaxed text-[#5B6472]">{t.pricing.text}</p>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} mt-5`}>
              {t.pricing.cta}
            </a>
            <p className="mt-5 border-t border-[#E4E1DA] pt-4 text-sm font-medium">
              {t.pricing.payment}
            </p>
          </div>
        </section>

        {/* ─────────── Étapes ─────────── */}
        <section id="comment-ca-marche" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-14 sm:px-6">
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

        {/* ─────────── À propos ─────────── */}
        <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-bold">{t.about.title}</h2>
          <div className={`${card} mt-4 flex flex-col gap-5 p-6 sm:flex-row sm:items-center`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ABOUT.photo}
              alt={t.about.photoAlt}
              className="h-20 w-20 shrink-0 rounded-full object-cover"
            />
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
              href={waHref}
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
        <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} w-full`}>
          {t.sticky}
        </a>
      </div>
    </div>
  );
}
