import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SIM_CLASSES, simThemeVars } from "../../_theme";
import { PROGRAMME, coverage, findLesson, waRequest } from "../../_programme";

export function generateStaticParams() {
  return PROGRAMME.flatMap((u) => u.lessons.map((l) => ({ lecon: l.slug })));
}

export function generateMetadata({ params }: { params: { lecon: string } }): Metadata {
  const found = findLesson(params.lecon);
  if (!found) return {};
  return {
    title: { absolute: `${found.lesson.title} — Simulations 2ème Bac PC` },
    description: `Simulations interactives pour chaque partie de la leçon « ${found.lesson.title} » (2ème Bac Sciences Physiques, BIOF) : ${found.lesson.summary}`,
  };
}

export default function LessonPage({ params }: { params: { lecon: string } }) {
  const found = findLesson(params.lecon);
  if (!found) notFound();
  const { unit, lesson, prev, next } = found;
  const { covered, total } = coverage(lesson);

  return (
    <div style={simThemeVars()} className="min-h-screen bg-[var(--sim-page)] text-[var(--sim-text)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <a href="/simulations#programme" className="text-sm font-medium text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]">
          ‹ Programme 2ème Bac PC
        </a>
        <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sim-accent)]">
          {unit.title} · Leçon {lesson.num}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--sim-text-muted)]">{lesson.summary}</p>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--sim-border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#22E4D9] to-[#4ADE80]"
              style={{ width: `${(covered / total) * 100}%` }}
            />
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">
            {covered}/{total} parties avec simulation
          </p>
        </div>

        <ol className="mt-8 space-y-3">
          {lesson.parts.map((part, i) => (
            <li key={part.title} className={`${SIM_CLASSES.card} flex flex-col gap-4 p-5 sm:flex-row sm:items-start`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--sim-accent)]/50 font-mono text-sm font-bold text-[var(--sim-accent)]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold">{part.title}</h2>
                {part.detail ? (
                  <p className="mt-1 text-sm leading-relaxed text-[var(--sim-text-muted)]">{part.detail}</p>
                ) : null}
                {part.formulas?.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {part.formulas.map((f) => (
                      <li
                        key={f}
                        className="rounded-lg border border-[var(--sim-border)] bg-[var(--sim-panel-alt)] px-2.5 py-1 font-serif text-sm italic"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="shrink-0 sm:w-56 sm:text-end">
                {part.sim ? (
                  <a href={part.sim.href} className={`${SIM_CLASSES.btnPrimary} w-full sm:w-auto`}>
                    Ouvrir la simulation →
                  </a>
                ) : (
                  <div className="flex flex-col gap-2 sm:items-end">
                    <span className="w-fit rounded-full border border-[var(--sim-border)] px-3 py-1 text-xs font-semibold text-[var(--sim-text-muted)]">
                      En préparation
                    </span>
                    <a
                      href={waRequest(lesson, part)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#25D366] hover:underline"
                    >
                      La demander sur WhatsApp
                    </a>
                  </div>
                )}
                {part.sim ? (
                  <p className="mt-2 text-xs text-[var(--sim-text-muted)]">{part.sim.label}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <nav className="mt-10 flex flex-wrap justify-between gap-4 border-t border-[var(--sim-border)] pt-6 text-sm">
          {prev ? (
            <a href={`/simulations/programme/${prev.slug}`} className="text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]">
              ‹ Leçon {prev.num} : {prev.title}
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={`/simulations/programme/${next.slug}`} className="text-[var(--sim-text-muted)] hover:text-[var(--sim-text)]">
              Leçon {next.num} : {next.title} ›
            </a>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
