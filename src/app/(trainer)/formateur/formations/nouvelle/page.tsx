/**
 * Espace formateur — création d'une formation [T §8.1].
 *
 * Les douze champs de la fiche : titre, catégorie, description, objectifs,
 * prérequis, durée, format, prix, dates, formateur, certificat, places.
 *
 * Direction épurée : le parcours est une suite numérotée sobre, sans pastille
 * pleine ni carte, séparée du formulaire par un filet de 1 pixel.
 */

import type { Metadata } from "next";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getTrainings } from "@/data/queries";
import { TrainingForm } from "./training-form";

export const metadata: Metadata = {
  title: "Créer une formation | Espace formateur SIRA",
};

const STEPS = [
  { label: "Rédaction", detail: "Vous remplissez les douze champs de la fiche et vérifiez l'aperçu." },
  { label: "Vérification", detail: "Si votre organisme n'est pas encore vérifié, la fiche passe par un contrôle." },
  { label: "Catalogue", detail: "La fiche paraît dans l'annuaire public et devient recommandable." },
  { label: "Promotion", detail: "Vous pouvez ensuite lancer une campagne ciblée sur cette formation." },
];

export default function NewTrainingPage() {
  const categories = Array.from(new Set(getTrainings().map((t) => t.category))).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Espace formateur", href: "/formateur" },
          { label: "Mes formations", href: "/formateur/formations" },
          { label: "Créer une formation" },
        ]}
      />
      <PageHeader
        title="Créer une formation"
        description="Douze champs composent une fiche de catalogue. Remplissez-les tous : une fiche incomplète est moins consultée et ne déclenche pas la recommandation automatique."
      />

      <section>
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">De la fiche à la promotion</h2>
        <ol className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.label}>
              <span className="font-mono text-[12px] text-[var(--color-text-subtle)]">{`0${i + 1}`}</span>
              <p className="mt-1.5 text-[14px] font-semibold text-[var(--color-text)]">{step.label}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 border-t border-[var(--color-border)] pt-6">
        <TrainingForm categories={categories} />
      </div>
    </>
  );
}
