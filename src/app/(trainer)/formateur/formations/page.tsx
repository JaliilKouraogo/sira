/**
 * Espace formateur — catalogue de l'organisme [T §3.4].
 *
 * Direction épurée : tableau posé à même la page, chiffres clés neutres et
 * sections séparées par un filet de 1 pixel.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { AdminActions } from "@/components/admin-actions";
import {
  BarChart,
  Table,
  Td,
  TdMuted,
  Tr,
  formatInt,
  formatPercent,
} from "@/components/admin-kit";
import { IconPlus } from "@/components/icons";
import { IllustrationNoTrainings } from "@/components/illustrations";
import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  Progress,
  Stat,
  Tag,
  formatDate,
} from "@/components/ui";
import {
  TRAINING_ACCESS_LABEL,
  TRAINING_FORMATS,
  TRAINING_FORMAT_LABEL,
  formatMoney,
} from "@/lib/enums";
import { getTrainerTrainings } from "../../trainer-context";

export const metadata: Metadata = {
  title: "Mes formations | Espace formateur SIRA",
};

export default function TrainerTrainingsPage() {
  const trainings = getTrainerTrainings();

  const seats = trainings.reduce((sum, t) => sum + (t.seats ?? 0), 0);
  const taken = trainings.reduce((sum, t) => sum + (t.seatsTaken ?? 0), 0);
  const paying = trainings.filter((t) => t.access === "payant");
  const averageRating =
    trainings.filter((t) => t.rating).length === 0
      ? 0
      : trainings.reduce((sum, t) => sum + (t.rating ?? 0), 0) / trainings.filter((t) => t.rating).length;

  const byFormat = TRAINING_FORMATS.map((format) => ({
    label: TRAINING_FORMAT_LABEL[format],
    value: trainings.filter((t) => t.format === format).length,
  })).filter((row) => row.value > 0);

  const byCategory = Array.from(new Set(trainings.map((t) => t.category)))
    .map((category) => ({ label: category, value: trainings.filter((t) => t.category === category).length }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader
        title="Mes formations"
        description="Votre catalogue tel qu'il apparaît dans l'annuaire public de SIRA. Une fiche complète et datée remonte mieux et rassure le candidat."
        action={
          <ButtonLink href="/formateur/formations/nouvelle">
            <IconPlus size={16} />
            Créer une formation
          </ButtonLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Formations au catalogue" value={formatInt(trainings.length)} />
        <Stat
          label="Taux de remplissage"
          value={formatPercent(seats === 0 ? 0 : (taken / seats) * 100, 0)}
          hint={`${formatInt(taken)} places sur ${formatInt(seats)}`}
        />
        <Stat
          label="Formations payantes"
          value={formatInt(paying.length)}
          hint={`sur ${trainings.length} formations`}
        />
        <Stat label="Note moyenne" value={averageRating.toFixed(1)} hint="Sur 5" />
      </div>

      <Alert tone="info" title="Ce que SIRA fait, et ne fait pas">
        SIRA référence votre formation, la recommande aux candidats dont le profil présente la lacune correspondante,
        et vous apporte des contacts. L&apos;inscription et le règlement se font chez vous : aucune place n&apos;est
        vendue sur la plateforme.
      </Alert>

      {trainings.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<IllustrationNoTrainings size={170} accent="var(--color-zone-trainer)" />}
            title="Aucune formation au catalogue"
            description="Créez votre première fiche : douze champs suffisent pour être référencé dans l'annuaire public."
            action={
              <ButtonLink href="/formateur/formations/nouvelle">Créer une formation</ButtonLink>
            }
          />
        </div>
      ) : (
        <section className="mt-10 border-t border-[var(--color-border)] pt-6">
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)]">{trainings.length} formations</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
              Toutes visibles dans le catalogue public
            </p>
          </div>
          <Table
            head={["Formation", "Catégorie", "Format", "Durée", "Tarif", "Session", "Places", "Actions"]}
            minWidth={1120}
          >
            {trainings.map((training) => {
              const fill = training.seats ? ((training.seatsTaken ?? 0) / training.seats) * 100 : 0;
              return (
                <Tr key={training.id}>
                  <Td className="max-w-[260px]">
                    <Link
                      href={`/formations/${training.slug}`}
                      className="truncate font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                    >
                      {training.title}
                    </Link>
                    <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-text-muted)]">{training.summary}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {training.certificate ? <Badge tone="success">Certificat</Badge> : null}
                      <Badge tone="neutral">{training.level}</Badge>
                    </div>
                  </Td>
                  <Td>
                    <Tag>{training.category}</Tag>
                  </Td>
                  <TdMuted>{TRAINING_FORMAT_LABEL[training.format]}</TdMuted>
                  <TdMuted>{training.durationHours} h</TdMuted>
                  <Td>
                    <Badge tone={training.access === "payant" ? "neutral" : "accent"}>
                      {TRAINING_ACCESS_LABEL[training.access]}
                    </Badge>
                    <p className="mt-0.5 whitespace-nowrap text-[12.5px] text-[var(--color-text-muted)]">
                      {training.access === "payant" ? formatMoney(training.price) : "Sans frais"}
                    </p>
                  </Td>
                  <TdMuted>{training.startDate ? formatDate(training.startDate) : "En continu"}</TdMuted>
                  <Td className="min-w-[130px]">
                    {training.seats ? (
                      <>
                        <Progress value={fill} tone={fill > 85 ? "warning" : "primary"} label="Remplissage" />
                        <span className="mt-1 block text-[12px] tabular-nums text-[var(--color-text-muted)]">
                          {training.seatsTaken ?? 0} / {training.seats}
                        </span>
                      </>
                    ) : (
                      <span className="text-[13px] text-[var(--color-text-subtle)]">Sans limite</span>
                    )}
                  </Td>
                  <Td>
                    <AdminActions
                      subject={`la formation « ${training.title} »`}
                      actions={[
                        { label: "Modifier", variant: "outline" },
                        { label: "Promouvoir", variant: "accent" },
                        { label: "Dépublier", variant: "danger" },
                      ]}
                    />
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </section>
      )}

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par catégorie</h2>
          <div className="mt-4">
            <BarChart items={byCategory} />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par format</h2>
          <div className="mt-4">
            <BarChart items={byFormat} tone="info" />
          </div>
        </div>
      </section>
    </>
  );
}
