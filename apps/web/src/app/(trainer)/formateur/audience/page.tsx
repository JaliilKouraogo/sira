/**
 * Espace formateur — audience [T §3.4].
 *
 * Deux chemins mènent un candidat à votre formation : la recommandation
 * automatique, déclenchée par une lacune détectée sur son profil, et la
 * campagne payante, qui vise un domaine et une zone.
 *
 * Direction épurée : tableaux posés à même la page, sections séparées par un
 * filet de 1 pixel, chiffres clés neutres.
 */

import type { Metadata } from "next";
import { BarChart, Table, Td, TdMuted, Tr, formatInt, formatPercent } from "@/components/admin-kit";
import { IllustrationNoTrainings } from "@/components/illustrations";
import { Alert, Badge, EmptyState, PageHeader, Stat, Tag } from "@/components/ui";
import { getConsents, getRecommendedTrainings } from "@/data/queries";
import {
  CONSENT_BASIS_LABEL,
  CONSENT_MATRIX,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABEL,
} from "@/lib/enums";
import { getTrainerCampaigns, getTrainerTrainings } from "../../trainer-context";

export const metadata: Metadata = {
  title: "Audience | Espace formateur SIRA",
};

export default function TrainerAudiencePage() {
  const trainings = getTrainerTrainings();
  const campaigns = getTrainerCampaigns();
  const consents = getConsents();

  const trainerIds = new Set(trainings.map((t) => t.id));
  const recommended = getRecommendedTrainings().filter((r) => trainerIds.has(r.training.id));

  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);

  const targetedDomains = Array.from(new Set(campaigns.flatMap((c) => c.targetDomains)));
  const targetedCities = Array.from(new Set(campaigns.flatMap((c) => c.targetCities)));

  const skills = Array.from(new Set(trainings.flatMap((t) => t.skillsCovered)))
    .map((skill) => ({
      label: skill,
      value: trainings.filter((t) => t.skillsCovered.includes(skill)).length,
    }))
    .sort((a, b) => b.value - a.value);

  const marketingConsents = consents.filter((c) => c.consentType === "marketing");
  const reachable = marketingConsents.filter((c) => c.granted).length;

  return (
    <>
      <PageHeader
        title="Audience"
        description="À qui vos formations sont proposées, et par quel chemin. La recommandation est gratuite et automatique ; la campagne est payante et ciblée."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Formations recommandées"
          value={formatInt(recommended.length)}
          hint="Déclenchées par une lacune détectée"
        />
        <Stat label="Impressions de campagne" value={formatInt(impressions)} />
        <Stat
          label="Taux de clic"
          value={impressions === 0 ? "—" : formatPercent((clicks / impressions) * 100, 2)}
          hint={`${formatInt(clicks)} clics`}
        />
        <Stat
          label="Candidats joignables"
          value={`${reachable} / ${marketingConsents.length}`}
          hint="Consentement commercial accordé"
        />
      </div>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Recommandation automatique</h2>
        <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
          Vos formations sont proposées à la suite d&apos;une lacune détectée : quand le score d&apos;un candidat
          baisse à cause d&apos;une compétence manquante, SIRA lui propose la formation qui la couvre.
        </p>
        <div className="mt-4">
          {recommended.length === 0 ? (
            <EmptyState
              icon={<IllustrationNoTrainings size={170} accent="var(--color-zone-trainer)" />}
              title="Aucune recommandation active"
              description="Aucune compétence couverte par votre catalogue ne correspond aujourd'hui à une lacune détectée. Élargissez les compétences déclarées sur vos fiches."
            />
          ) : (
            <Table head={["Formation", "Compétences qui déclenchent la recommandation", "Places restantes"]} minWidth={720}>
              {recommended.map(({ training, matchedGaps }) => (
                <Tr key={training.id}>
                  <Td className="font-medium">{training.title}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedGaps.map((gap) => (
                        <Badge key={gap} tone="accent">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <TdMuted>
                    {training.seats ? `${training.seats - (training.seatsTaken ?? 0)} sur ${training.seats}` : "Sans limite"}
                  </TdMuted>
                </Tr>
              ))}
            </Table>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--color-border)] pt-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Ciblage actuel de vos campagnes</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">Domaines et zones couverts</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Domaines ciblés</p>
              <div className="flex flex-wrap gap-1.5">
                {targetedDomains.length === 0 ? (
                  <span className="text-[13px] text-[var(--color-text-muted)]">Aucun domaine ciblé</span>
                ) : (
                  targetedDomains.map((domain) => <Tag key={domain}>{domain}</Tag>)
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Zones ciblées</p>
              <div className="flex flex-wrap gap-1.5">
                {targetedCities.length === 0 ? (
                  <span className="text-[13px] text-[var(--color-text-muted)]">Aucune zone ciblée</span>
                ) : (
                  targetedCities.map((city) => <Tag key={city}>{city}</Tag>)
                )}
              </div>
            </div>
            <Alert tone="info" title="Élargir sans diluer">
              Ajouter un domaine multiplie les impressions mais dilue le budget. Un ciblage étroit sur deux villes et
              un domaine donne presque toujours un meilleur taux de clic qu&apos;un ciblage national.
            </Alert>
          </div>
        </div>

        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
            Compétences couvertes par votre catalogue
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Ce qui rend vos fiches recommandables
          </p>
          <div className="mt-4">
            <BarChart items={skills} tone="accent" />
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-[var(--color-border)] pt-6">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Ce que le consentement autorise</h2>
          <p className="mt-0.5 max-w-3xl text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            Une campagne n&apos;atteint que les candidats qui ont accepté les communications commerciales
          </p>
        </div>
        <Table head={["Canal", "Base juridique pour une promotion", "Ce que cela implique pour vous"]} minWidth={720}>
          {NOTIFICATION_CHANNELS.map((channel) => {
            const basis = CONSENT_MATRIX.marketing[channel];
            return (
              <Tr key={channel}>
                <Td className="font-medium">{NOTIFICATION_CHANNEL_LABEL[channel]}</Td>
                <Td>
                  <Badge tone="accent">{CONSENT_BASIS_LABEL[basis]}</Badge>
                </Td>
                <Td className="text-[13px] text-[var(--color-text-muted)]">
                  {channel === "in_app"
                    ? "Même dans l'application, aucun encart sponsorisé n'est montré sans consentement explicite."
                    : channel === "email"
                      ? "L'envoi commercial par e-mail suppose un consentement séparé de l'inscription."
                      : "WhatsApp exige un consentement explicite et un modèle de message approuvé."}
                </Td>
              </Tr>
            );
          })}
        </Table>
      </section>
    </>
  );
}
