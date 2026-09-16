/**
 * Back-office — catalogue des formations [T §21.3].
 *
 * SIRA référence et promeut des formations ; elle ne les dispense pas et
 * n'encaisse pas l'inscription. La modération porte donc sur l'exactitude de
 * la fiche et sur l'organisme, pas sur la qualité pédagogique.
 *
 * Direction épurée : tableaux et graphiques posés à même la page, séparés par
 * des filets de 1 pixel, sans carte ni ombre.
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
  VERIFICATION_TONE,
  formatInt,
  formatPercent,
  orgName,
} from "@/components/admin-kit";
import { Alert, Badge, PageHeader, Progress, Stat, Tag, formatDate } from "@/components/ui";
import { getOrganization, getTrainings } from "@/data/queries";
import {
  TRAINING_ACCESS,
  TRAINING_ACCESS_LABEL,
  TRAINING_FORMATS,
  TRAINING_FORMAT_LABEL,
  VERIFICATION_STATUS_LABEL,
  formatMoney,
} from "@/lib/enums";

export const metadata: Metadata = {
  title: "Formations | Administration SIRA",
};

export default function AdminTrainingsPage() {
  const trainings = getTrainings();

  const seats = trainings.reduce((sum, t) => sum + (t.seats ?? 0), 0);
  const taken = trainings.reduce((sum, t) => sum + (t.seatsTaken ?? 0), 0);
  const certified = trainings.filter((t) => t.certificate).length;

  const byAccess = TRAINING_ACCESS.map((access) => ({
    label: TRAINING_ACCESS_LABEL[access],
    value: trainings.filter((t) => t.access === access).length,
  })).filter((row) => row.value > 0);

  const byFormat = TRAINING_FORMATS.map((format) => ({
    label: TRAINING_FORMAT_LABEL[format],
    value: trainings.filter((t) => t.format === format).length,
  })).filter((row) => row.value > 0);

  const categories = Array.from(new Set(trainings.map((t) => t.category)))
    .map((category) => ({ label: category, value: trainings.filter((t) => t.category === category).length }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader
        title="Formations"
        description="Catalogue référencé sur SIRA. L'administration contrôle la fiche, l'organisme et la cohérence du tarif annoncé."
      />

      <Alert tone="info" title="SIRA reste un annuaire de formations">
        L&apos;inscription et le règlement se font chez l&apos;organisme. Une fiche doit donc porter un contact ou un
        lien d&apos;inscription valide : c&apos;est le premier point de contrôle, avant même le contenu pédagogique.
      </Alert>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Formations référencées" value={formatInt(trainings.length)} />
        <Stat
          label="Taux de remplissage"
          value={formatPercent(seats === 0 ? 0 : (taken / seats) * 100, 0)}
          hint={`${formatInt(taken)} places sur ${formatInt(seats)}`}
        />
        <Stat
          label="Avec certificat"
          value={formatInt(certified)}
          hint={`sur ${trainings.length} formations`}
        />
        <Stat
          label="Note moyenne"
          value={(
            trainings.reduce((sum, t) => sum + (t.rating ?? 0), 0) / Math.max(1, trainings.filter((t) => t.rating).length)
          ).toFixed(1)}
          hint="Déclarative, sur 5"
        />
      </div>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">
            {trainings.length} formations au catalogue
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Toutes organisations confondues</p>
        </div>
        <Table
          head={["Formation", "Organisme", "Catégorie", "Format", "Accès", "Places", "Session", "Actions"]}
          minWidth={1160}
        >
          {trainings.map((training) => {
            const org = getOrganization(training.organizationId);
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
                  <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-text-muted)]">
                    {training.durationHours} h · {training.level}
                    {training.certificate ? " · certificat" : ""}
                  </p>
                </Td>
                <Td>
                  <p className="truncate text-[13px]">{orgName(org)}</p>
                  {org ? (
                    <Badge tone={VERIFICATION_TONE[org.verificationStatus]}>
                      {VERIFICATION_STATUS_LABEL[org.verificationStatus]}
                    </Badge>
                  ) : null}
                </Td>
                <Td>
                  <Tag>{training.category}</Tag>
                </Td>
                <TdMuted>{TRAINING_FORMAT_LABEL[training.format]}</TdMuted>
                <Td>
                  <Badge tone={training.access === "payant" ? "neutral" : "accent"}>
                    {TRAINING_ACCESS_LABEL[training.access]}
                  </Badge>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                    {training.access === "payant" ? formatMoney(training.price) : "Sans frais pour le candidat"}
                  </p>
                </Td>
                <Td className="min-w-[130px]">
                  {training.seats ? (
                    <>
                      <Progress value={fill} tone={fill > 85 ? "warning" : "primary"} label="Remplissage" />
                      <p className="mt-1 text-[12.5px] tabular-nums text-[var(--color-text-muted)]">
                        {training.seatsTaken ?? 0} / {training.seats}
                      </p>
                    </>
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-subtle)]">Sans limite</span>
                  )}
                </Td>
                <TdMuted>{training.startDate ? formatDate(training.startDate) : "En continu"}</TdMuted>
                <Td>
                  <AdminActions
                    subject={`la formation « ${training.title} »`}
                    actions={[
                      { label: "Voir la fiche", variant: "outline" },
                      { label: "Dépublier", variant: "danger" },
                    ]}
                  />
                </Td>
              </Tr>
            );
          })}
        </Table>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par catégorie</h2>
          <div className="mt-4">
            <BarChart items={categories} />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par format</h2>
          <div className="mt-4">
            <BarChart items={byFormat} tone="info" />
          </div>
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Par condition d&apos;accès</h2>
          <div className="mt-4">
            <BarChart items={byAccess} tone="accent" />
          </div>
        </div>
      </section>
    </>
  );
}
