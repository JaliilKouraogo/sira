/**
 * Gabarit des pages légales : sommaire ancré, sections numérotées,
 * typographie sobre et lisible sur mobile.
 */

import type { ReactNode } from "react";
import { Card, formatDate } from "@/components/ui";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export function LegalPage({
  title,
  lead,
  updatedAt,
  sections,
  footer,
}: {
  title: string;
  lead: string;
  updatedAt: string;
  sections: LegalSection[];
  footer?: ReactNode;
}) {
  return (
    <div className="sira-container py-10 md:py-14">
      <div className="max-w-3xl">
        <h1 className="text-[22px] font-semibold text-[var(--color-text)]">{title}</h1>
        <p className="mt-1.5 text-[12px] text-[var(--color-text-subtle)]">
          Dernière mise à jour le {formatDate(updatedAt)}
        </p>
        <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-text-muted)]">{lead}</p>
      </div>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-start">
        <nav aria-label="Sommaire" className="lg:order-2 lg:w-64 lg:shrink-0">
          <Card className="p-4 lg:sticky lg:top-20">
            <h2 className="text-[11.5px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
              Sommaire
            </h2>
            <ol className="mt-3 space-y-1.5">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                  >
                    <span className="tabular-nums text-[var(--color-text-subtle)]">{i + 1}.</span>
                    <span className="min-w-0">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </Card>
        </nav>

        <div className="min-w-0 flex-1 lg:order-1">
          <div className="max-w-3xl divide-y divide-[var(--color-border)]">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 py-6 first:pt-0">
                <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
                  <span className="mr-2 tabular-nums text-[var(--color-text-subtle)]">{i + 1}.</span>
                  {s.title}
                </h2>
                <div className="mt-2.5 space-y-3 text-[13.5px] leading-relaxed text-[var(--color-text-muted)] [&_a]:font-medium [&_a]:text-[var(--color-primary)] [&_a:hover]:underline [&_li]:leading-relaxed [&_strong]:text-[var(--color-text)] [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
          {footer ? <div className="mt-10 max-w-3xl">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** Tableau sobre pour les durées de conservation et les catégories de cookies. */
export function LegalTable({
  caption,
  head,
  rows,
}: {
  caption?: string;
  head: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
      <table className="w-full min-w-[34rem] text-left text-[13px]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-[var(--color-border)] text-[11.5px] uppercase tracking-wider text-[var(--color-text-subtle)]">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, i) => (
                <td
                  key={`${row[0]}-${i}`}
                  className={i === 0 ? "px-4 py-2.5 font-medium text-[var(--color-text)]" : "px-4 py-2.5"}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
