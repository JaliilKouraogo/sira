/**
 * Formations — [T §6.8].
 *
 * Cinq onglets et cinq filtres, tous portés par l'URL. Le site étant exporté
 * en fichiers statiques, l'en-tête, les inscriptions en cours et l'encart
 * Premium sont rendus ici, tandis que les onglets, les filtres et le catalogue
 * le sont par `TrainingsCatalog`, qui lit l'adresse dans le navigateur. Sur
 * les onglets de recommandation, chaque formation dit explicitement **quelle
 * lacune elle comble** et sur quelle offre cette lacune a été détectée.
 */

import { Suspense } from "react";
import { SimulatedActionBar } from "@/components/account-actions";
import { PremiumCallout } from "@/components/account-shared";
import { IconCheckCircle } from "@/components/icons";
import { Badge, Card, PageHeader, Progress, formatDate } from "@/components/ui";
import { getEnrollments } from "@/data/queries";
import { TRAINING_FORMAT_LABEL } from "@/lib/enums";
import { TabbedListSkeleton } from "../list-skeleton";
import { TrainingsCatalog } from "./trainings-client";

export const metadata = {
  title: "Formations — SIRA",
};

export default function TrainingsPage() {
  const enrollments = getEnrollments();

  return (
    <>
      <PageHeader
        title="Formations"
        description="Des formations reliées à vos lacunes réelles, détectées sur les offres que vous visez."
      />

      {/* ---------------- Inscriptions en cours ---------------- */}
      {enrollments.length > 0 ? (
        <section className="mb-7">
          <h2 className="mb-3 text-[17px] font-semibold text-[var(--color-text)]">Mes inscriptions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {enrollments.map(({ enrollment, training }) => {
              const done = enrollment.progress >= 100;
              return (
                <Card key={enrollment.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14.5px] font-semibold leading-snug text-[var(--color-text)]">
                        {training.title}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                        Inscrite le {formatDate(enrollment.enrolledAt)} · {training.durationHours} h ·{" "}
                        {TRAINING_FORMAT_LABEL[training.format]}
                      </p>
                    </div>
                    <Badge tone={done ? "success" : "primary"}>{done ? "Terminée" : "En cours"}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
                      <span className="text-[var(--color-text-muted)]">Progression</span>
                      <span className="font-semibold tabular-nums text-[var(--color-text)]">
                        {enrollment.progress} %
                      </span>
                    </div>
                    <Progress
                      value={enrollment.progress}
                      tone={done ? "success" : "primary"}
                      label={`Progression : ${training.title}`}
                    />
                  </div>
                  {done && enrollment.completedAt ? (
                    <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-[var(--color-success)]">
                      <IconCheckCircle size={14} />
                      Achevée le {formatDate(enrollment.completedAt)}
                      {training.certificate ? " · attestation disponible" : ""}
                    </p>
                  ) : (
                    <SimulatedActionBar
                      className="mt-3"
                      actions={[
                        {
                          label: "Reprendre",
                          variant: "primary",
                          message: `Reprise du module en cours de « ${training.title} », là où vous vous êtes arrêtée.`,
                        },
                      ]}
                    />
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <Suspense fallback={<TabbedListSkeleton label="Chargement du catalogue de formations…" rows={4} cards />}>
        <TrainingsCatalog />
      </Suspense>

      <div className="mt-6">
        <PremiumCallout title="Formations incluses avec Premium">
          Les formations marquées « Incluse avec Premium » sont accessibles sans frais supplémentaires avec
          l&apos;abonnement, y compris l&apos;anglais professionnel qui pèse sur plusieurs de vos scores.
        </PremiumCallout>
      </div>
    </>
  );
}
