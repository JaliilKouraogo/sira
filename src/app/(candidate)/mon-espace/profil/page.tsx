/**
 * Mon profil — sections éditables et indicateur de complétude.
 *
 * Le profil, et non le fichier CV, alimente les scores de compatibilité :
 * l'écran dit donc à chaque section ce qu'elle apporte, et la complétude
 * n'est pas un pourcentage décoratif mais une liste d'actions chiffrées.
 */

import Link from "next/link";
import { SimulatedActionBar } from "@/components/account-actions";
import { PremiumCallout, SettingsSection } from "@/components/account-shared";
import {
  IconBriefcase,
  IconCheckCircle,
  IconGraduation,
  IconMapPin,
  IconSettings,
  IconSparkles,
  IconTarget,
  IconUser,
} from "@/components/icons";
import {
  Alert,
  Avatar,
  Badge,
  Checkbox,
  DataList,
  Field,
  Input,
  PageHeader,
  Progress,
  Select,
  Tag,
  Textarea,
  formatDate,
} from "@/components/ui";
import { getCandidateProfile, getCurrentUser, getResumes } from "@/data/queries";
import {
  AVAILABILITIES,
  CITIES,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABEL,
  DOMAINS,
  EDUCATION_LEVELS,
  LANGUAGE_LEVELS,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABEL,
  PROFILE_VISIBILITY_LABEL,
  WORK_MODES,
  WORK_MODE_LABEL,
  formatMoney,
} from "@/lib/enums";

export const metadata = {
  title: "Mon profil — SIRA",
};

const SKILL_LEVEL_LABEL: Record<"debutant" | "intermediaire" | "avance" | "expert", string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
  expert: "Expert",
};

/** Bouton d'ouverture d'un formulaire de section, sans état client. */
function EditDisclosure({ children, label = "Modifier cette section" }: { children: React.ReactNode; label?: string }) {
  return (
    <details className="mt-4 border-t border-[var(--color-border)] pt-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)] [&::-webkit-details-marker]:hidden">
        <IconSettings size={14} />
        {label}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default function ProfilePage() {
  const profile = getCandidateProfile();
  const user = getCurrentUser();
  const resume = getResumes().find((item) => item.isOriginal);

  /** Ce qui reste à faire pour atteindre 100 %, avec le gain de chaque action. */
  const missing = [
    {
      label: "Ajouter une photo de profil",
      points: 8,
      detail: "Un profil avec photo est consulté deux fois plus souvent par les recruteurs vérifiés.",
      href: "#informations",
    },
    {
      label: "Téléverser vos copies de diplômes",
      points: 6,
      detail: "Trois offres que vous visez exigent une copie des diplômes dans le dossier.",
      href: "#formations",
    },
    {
      label: "Détailler votre expérience d'encadrement",
      points: 4,
      detail: "Le management d'équipe manque à votre profil et pèse sur vos scores de responsable.",
      href: "#experiences",
    },
    {
      label: "Compléter vos compétences comportementales",
      points: 4,
      detail: "Vous en déclarez 3 ; cinq est le seuil à partir duquel le profil est considéré complet.",
      href: "#competences",
    },
  ];
  const potential = profile.completionScore + missing.reduce((sum, item) => sum + item.points, 0);

  const done = [
    "CV déposé et analysé",
    "Expériences professionnelles renseignées",
    "Formations et niveau d'études renseignés",
    "Langues déclarées",
    "Attentes salariales précisées",
    "Zones de recherche définies",
  ];

  return (
    <>
      <PageHeader
        title="Mon profil"
        description="C'est ce profil, et non votre fichier CV, qui alimente vos scores de compatibilité."
        action={
          <SimulatedActionBar
            align="end"
            actions={[
              {
                label: "Aperçu recruteur",
                variant: "outline",
                size: "md",
                icon: <IconUser size={15} />,
                message:
                  "Vous verriez votre profil tel qu'un recruteur vérifié le consulte. Vos coordonnées y restent masquées tant que vous n'avez pas candidaté chez lui.",
                tone: "info",
              },
            ]}
          />
        }
      />

      {/* ---------------- Complétude ---------------- */}
      <section className="mb-8 border-y border-[var(--color-border)] py-7">
        <h2 className="text-[17px] font-semibold text-[var(--color-text)]">Complétude de mon profil</h2>
        <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
          Ce qui manque, et ce que chaque action rapporte.
        </p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-none tabular-nums text-[var(--color-text)]">
                {profile.completionScore}
              </span>
              <span className="text-[15px] text-[var(--color-text-muted)]">%</span>
            </div>
            <Progress
              className="mt-2"
              value={profile.completionScore}
              tone={profile.completionScore >= 80 ? "success" : "accent"}
              label="Complétude du profil"
            />
            <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              En traitant les {missing.length} points ci-contre, votre profil atteindrait{" "}
              <strong className="font-semibold text-[var(--color-text)]">{Math.min(100, potential)} %</strong>.
            </p>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[var(--color-text)]">Ce qui manque pour progresser</p>
            <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
              {missing.map((item) => (
                <li key={item.label} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-2.5">
                  <div className="min-w-0">
                    <Link href={item.href} className="text-[13.5px] font-medium text-[var(--color-text)] hover:underline">
                      {item.label}
                    </Link>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-[var(--color-accent-text)]">
                    +{item.points} points
                  </span>
                </li>
              ))}
            </ul>

            <details className="mt-3">
              <summary className="cursor-pointer list-none text-[12.5px] font-medium text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
                Voir ce qui est déjà complété ({done.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {done.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[12.5px] text-[var(--color-text-muted)]">
                    <span className="mt-0.5 shrink-0 text-[var(--color-success)]" aria-hidden>
                      <IconCheckCircle size={13} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {/* ---------------- Informations personnelles ---------------- */}
        <SettingsSection
          id="informations"
          title="Informations personnelles"
          description="Vos coordonnées ne sont transmises à un recruteur qu'après votre candidature."
          icon={<IconUser size={18} />}
        >
          <div className="flex flex-wrap items-center gap-4">
            <Avatar
              initials={`${user.firstName[0]}${user.lastName[0]}`}
              size={64}
              rounded="full"
              color="var(--color-primary)"
            />
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold text-[var(--color-text)]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[13px] text-[var(--color-text-muted)]">{profile.headline}</p>
              <Badge tone="warning" className="mt-1.5">
                Photo de profil manquante
              </Badge>
            </div>
          </div>

          <div className="mt-4">
            <DataList
              rows={[
                { label: "Prénom et nom", value: `${user.firstName} ${user.lastName}` },
                {
                  label: "Adresse e-mail",
                  value: (
                    <span className="flex flex-wrap items-center gap-2">
                      {user.email}
                      {user.emailVerifiedAt ? <Badge tone="success">Vérifiée</Badge> : <Badge tone="warning">À vérifier</Badge>}
                    </span>
                  ),
                },
                {
                  label: "Téléphone",
                  value: (
                    <span className="flex flex-wrap items-center gap-2">
                      {user.phone ?? "Non renseigné"}
                      {user.phoneVerifiedAt ? <Badge tone="success">Vérifié</Badge> : null}
                    </span>
                  ),
                },
                { label: "Ville", value: `${profile.city}, ${profile.country}` },
                { label: "Compte créé le", value: formatDate(user.createdAt) },
              ]}
            />
          </div>

          <EditDisclosure>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prénom" htmlFor="p-prenom" required>
                <Input id="p-prenom" name="prenom" defaultValue={user.firstName} />
              </Field>
              <Field label="Nom" htmlFor="p-nom" required>
                <Input id="p-nom" name="nom" defaultValue={user.lastName} />
              </Field>
              <Field label="Adresse e-mail" htmlFor="p-email" hint="Un changement demande une nouvelle vérification.">
                <Input id="p-email" name="email" type="email" defaultValue={user.email} />
              </Field>
              <Field label="Téléphone" htmlFor="p-tel" hint="Sert aussi à recevoir vos alertes WhatsApp.">
                <Input id="p-tel" name="telephone" type="tel" defaultValue={user.phone ?? ""} />
              </Field>
              <Field label="Ville de résidence" htmlFor="p-ville">
                <Select id="p-ville" name="ville" defaultValue={profile.city}>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Photo de profil" htmlFor="p-photo" hint="Format JPG ou PNG, 2 Mo maximum.">
                <Input id="p-photo" name="photo" type="file" className="pt-2 text-[13px]" />
              </Field>
            </div>
            <SimulatedActionBar
              className="mt-4"
              actions={[
                {
                  label: "Enregistrer",
                  variant: "primary",
                  message: "Vos informations personnelles seraient mises à jour et votre complétude recalculée.",
                },
              ]}
            />
          </EditDisclosure>
        </SettingsSection>

        {/* ---------------- Profil professionnel ---------------- */}
        <SettingsSection
          id="professionnel"
          title="Profil professionnel"
          description="L'accroche et le domaine orientent toutes vos recommandations."
          icon={<IconBriefcase size={18} />}
        >
          <DataList
            rows={[
              { label: "Accroche", value: profile.headline },
              { label: "Domaine", value: profile.domain },
              { label: "Situation", value: profile.professionalSituation },
              { label: "Expérience", value: `${profile.experienceYears} ans` },
              {
                label: "Métiers visés",
                value: (
                  <span className="flex flex-wrap gap-1.5">
                    {profile.targetJobs.map((job) => (
                      <Tag key={job}>{job}</Tag>
                    ))}
                  </span>
                ),
              },
            ]}
          />

          <EditDisclosure>
            <div className="space-y-3">
              <Field label="Accroche" htmlFor="p-headline" hint="Une phrase : votre métier, vos années, votre secteur.">
                <Textarea id="p-headline" name="headline" rows={2} defaultValue={profile.headline} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Domaine principal" htmlFor="p-domaine">
                  <Select id="p-domaine" name="domaine" defaultValue={profile.domain}>
                    {DOMAINS.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Années d'expérience" htmlFor="p-annees">
                  <Input id="p-annees" name="annees" type="number" min={0} defaultValue={profile.experienceYears} />
                </Field>
              </div>
              <Field label="Métiers visés" htmlFor="p-metiers" hint="Séparez-les par une virgule.">
                <Input id="p-metiers" name="metiers" defaultValue={profile.targetJobs.join(", ")} />
              </Field>
            </div>
            <SimulatedActionBar
              className="mt-4"
              actions={[
                {
                  label: "Enregistrer",
                  variant: "primary",
                  message: "Votre profil professionnel serait mis à jour, et vos scores recalculés sur les offres ouvertes.",
                },
              ]}
            />
          </EditDisclosure>
        </SettingsSection>

        {/* ---------------- Expériences ---------------- */}
        <SettingsSection
          id="experiences"
          title="Expériences professionnelles"
          description="La composante « expérience » pèse 20 % de votre score de compatibilité."
          icon={<IconTarget size={18} />}
        >
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {profile.experiences.map((experience) => (
              <li key={`${experience.company}-${experience.startDate}`} className="py-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-[var(--color-text)]">{experience.title}</p>
                  <p className="text-[12.5px] text-[var(--color-text-muted)]">
                    {experience.startDate} → {experience.endDate ?? "en cours"}
                  </p>
                </div>
                <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">{experience.company}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                  {experience.description}
                </p>
              </li>
            ))}
          </ul>

          <Alert tone="warning" title="Une expérience d'encadrement manque">
            Vous coordonnez trois magasiniers chez Faso Distribution, mais cela n&apos;apparaît dans aucune
            description. C&apos;est la lacune « Management d&apos;équipe » qui revient sur vos scores de responsable.
          </Alert>

          <EditDisclosure label="Ajouter une expérience">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Intitulé du poste" htmlFor="x-titre" required>
                <Input id="x-titre" name="titre" placeholder="Responsable logistique" />
              </Field>
              <Field label="Entreprise" htmlFor="x-entreprise" required>
                <Input id="x-entreprise" name="entreprise" placeholder="Nom de l'employeur" />
              </Field>
              <Field label="Début" htmlFor="x-debut">
                <Input id="x-debut" name="debut" type="month" />
              </Field>
              <Field label="Fin" htmlFor="x-fin" hint="Laissez vide si le poste est en cours.">
                <Input id="x-fin" name="fin" type="month" />
              </Field>
            </div>
            <div className="mt-3">
              <Field
                label="Missions et résultats"
                htmlFor="x-description"
                hint="Chiffrez vos résultats : c'est ce que l'IA et les recruteurs retiennent."
              >
                <Textarea id="x-description" name="description" rows={3} />
              </Field>
            </div>
            <SimulatedActionBar
              className="mt-4"
              actions={[
                {
                  label: "Ajouter l'expérience",
                  variant: "primary",
                  message: "L'expérience serait ajoutée à votre profil et prise en compte dans le prochain calcul de score.",
                },
              ]}
            />
          </EditDisclosure>
        </SettingsSection>

        {/* ---------------- Formations ---------------- */}
        <SettingsSection
          id="formations"
          title="Formations et diplômes"
          description="La composante « formation » pèse 15 % de votre score."
          icon={<IconGraduation size={18} />}
        >
          <p className="mb-3 text-[13px] text-[var(--color-text-muted)]">
            Niveau d&apos;études déclaré : <strong className="text-[var(--color-text)]">{profile.educationLevel}</strong>
          </p>
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {profile.educations.map((education) => (
              <li
                key={`${education.degree}-${education.year}`}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3"
              >
                <span className="text-[13.5px] text-[var(--color-text)]">{education.degree}</span>
                <span className="text-[12.5px] text-[var(--color-text-muted)]">
                  {education.school} · {education.year}
                </span>
              </li>
            ))}
          </ul>

          {resume ? (
            <p className="mt-3 text-[12.5px] text-[var(--color-text-muted)]">
              Extraites de {resume.fileName}, analysé le {formatDate(resume.parsedAt ?? resume.createdAt)}.
            </p>
          ) : null}

          <EditDisclosure label="Ajouter une formation">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Diplôme ou certification" htmlFor="f-diplome" required>
                <Input id="f-diplome" name="diplome" />
              </Field>
              <Field label="Établissement" htmlFor="f-ecole">
                <Input id="f-ecole" name="ecole" />
              </Field>
              <Field label="Année d'obtention" htmlFor="f-annee">
                <Input id="f-annee" name="annee" type="number" min={1960} max={2026} />
              </Field>
              <Field label="Niveau d'études" htmlFor="f-niveau">
                <Select id="f-niveau" name="niveau" defaultValue={profile.educationLevel}>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Copie du diplôme" htmlFor="f-piece" hint="PDF ou image, exigée par trois des offres que vous visez.">
                <Input id="f-piece" name="piece" type="file" className="pt-2 text-[13px]" />
              </Field>
            </div>
            <SimulatedActionBar
              className="mt-4"
              actions={[
                {
                  label: "Ajouter la formation",
                  variant: "primary",
                  message: "La formation et sa pièce justificative seraient ajoutées à votre dossier.",
                },
              ]}
            />
          </EditDisclosure>
        </SettingsSection>

        {/* ---------------- Compétences ---------------- */}
        <SettingsSection
          id="competences"
          title="Compétences"
          description="La composante la plus lourde : 35 % de votre score de compatibilité."
          icon={<IconSparkles size={18} />}
        >
          <p className="mb-2 text-[13px] font-medium text-[var(--color-text)]">
            Compétences techniques ({profile.hardSkills.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.hardSkills.map((skill) => (
              <Badge key={skill.name} tone="primary">
                {skill.name}
                {skill.level ? ` · ${SKILL_LEVEL_LABEL[skill.level]}` : ""}
              </Badge>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[13px] font-medium text-[var(--color-text)]">
            Compétences comportementales ({profile.softSkills.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.softSkills.map((skill) => (
              <Tag key={skill.name}>{skill.name}</Tag>
            ))}
          </div>

          <Alert tone="info" title="Deux compétences reviennent dans vos offres">
            « SAP MM » et « Management d&apos;équipe » manquent à votre profil et apparaissent sur plusieurs offres que
            vous visez.{" "}
            <Link href="/mon-espace/formations?onglet=score" className="font-medium underline">
              Voir les formations qui les couvrent
            </Link>
          </Alert>

          <EditDisclosure label="Ajouter une compétence">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Compétence" htmlFor="c-nom" required>
                <Input id="c-nom" name="competence" placeholder="SAP MM" />
              </Field>
              <Field label="Niveau de maîtrise" htmlFor="c-niveau">
                <Select id="c-niveau" name="niveau" defaultValue="intermediaire">
                  {(Object.keys(SKILL_LEVEL_LABEL) as (keyof typeof SKILL_LEVEL_LABEL)[]).map((level) => (
                    <option key={level} value={level}>
                      {SKILL_LEVEL_LABEL[level]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <SimulatedActionBar
              className="mt-4"
              actions={[
                {
                  label: "Ajouter",
                  variant: "primary",
                  message: "La compétence serait ajoutée et vos scores recalculés sur les offres concernées.",
                },
              ]}
            />
          </EditDisclosure>
        </SettingsSection>

        {/* ---------------- Langues ---------------- */}
        <SettingsSection
          id="langues"
          title="Langues"
          description="10 % de votre score. L'anglais professionnel est demandé sur plusieurs offres logistiques."
          icon={<IconMapPin size={18} />}
        >
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {profile.languages.map((language) => (
              <li
                key={language.name}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <span className="text-[13.5px] text-[var(--color-text)]">{language.name}</span>
                <Badge tone={language.level === "Scolaire" || language.level === "Notions" ? "warning" : "success"}>
                  {language.level}
                </Badge>
              </li>
            ))}
          </ul>

          <EditDisclosure label="Ajouter ou corriger une langue">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Langue" htmlFor="l-nom" required>
                <Input id="l-nom" name="langue" placeholder="Anglais" />
              </Field>
              <Field label="Niveau" htmlFor="l-niveau">
                <Select id="l-niveau" name="niveau" defaultValue="Professionnel">
                  {LANGUAGE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <SimulatedActionBar
              className="mt-4"
              actions={[
                {
                  label: "Enregistrer",
                  variant: "primary",
                  message: "Le niveau de langue serait mis à jour et la composante « langues » de vos scores recalculée.",
                },
              ]}
            />
          </EditDisclosure>
        </SettingsSection>

        {/* ---------------- Préférences ---------------- */}
        <SettingsSection
          id="preferences"
          title="Préférences de recherche"
          description="Elles filtrent vos recommandations et alimentent la composante « disponibilité »."
          icon={<IconSettings size={18} />}
        >
          <DataList
            rows={[
              {
                label: "Types d'opportunités",
                value: (
                  <span className="flex flex-wrap gap-1.5">
                    {profile.opportunityTypes.map((type) => (
                      <Tag key={type}>{OPPORTUNITY_TYPE_LABEL[type]}</Tag>
                    ))}
                  </span>
                ),
              },
              {
                label: "Types de contrat",
                value: (
                  <span className="flex flex-wrap gap-1.5">
                    {profile.contractTypes.map((type) => (
                      <Tag key={type}>{CONTRACT_TYPE_LABEL[type]}</Tag>
                    ))}
                  </span>
                ),
              },
              {
                label: "Modes de travail",
                value: (
                  <span className="flex flex-wrap gap-1.5">
                    {profile.workModes.map((mode) => (
                      <Tag key={mode}>{WORK_MODE_LABEL[mode]}</Tag>
                    ))}
                  </span>
                ),
              },
              { label: "Zones de recherche", value: profile.searchZones.join(", ") },
              { label: "Disponibilité", value: profile.availability },
              { label: "Attentes salariales", value: formatMoney(profile.salaryExpectation) },
              { label: "Mobilité géographique", value: profile.geographicMobility ? "Oui" : "Non" },
              {
                label: "Visibilité du profil",
                value: (
                  <span className="flex flex-wrap items-center gap-2">
                    {PROFILE_VISIBILITY_LABEL[profile.profileVisibility]}
                    <Link
                      href="/mon-espace/parametres#confidentialite"
                      className="text-[12.5px] font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Changer
                    </Link>
                  </span>
                ),
              },
            ]}
          />

          <EditDisclosure>
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Types d&apos;opportunités</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {OPPORTUNITY_TYPES.map((type) => (
                    <Checkbox
                      key={type}
                      name="opportunites"
                      value={type}
                      label={OPPORTUNITY_TYPE_LABEL[type]}
                      defaultChecked={profile.opportunityTypes.includes(type)}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Types de contrat</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONTRACT_TYPES.map((type) => (
                    <Checkbox
                      key={type}
                      name="contrats"
                      value={type}
                      label={CONTRACT_TYPE_LABEL[type]}
                      defaultChecked={profile.contractTypes.includes(type)}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-[var(--color-text)]">Modes de travail</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {WORK_MODES.map((mode) => (
                    <Checkbox
                      key={mode}
                      name="modes"
                      value={mode}
                      label={WORK_MODE_LABEL[mode]}
                      defaultChecked={profile.workModes.includes(mode)}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Disponibilité" htmlFor="pr-dispo">
                  <Select id="pr-dispo" name="disponibilite" defaultValue={profile.availability}>
                    {AVAILABILITIES.map((availability) => (
                      <option key={availability} value={availability}>
                        {availability}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Attentes salariales (FCFA)" htmlFor="pr-salaire">
                  <Input
                    id="pr-salaire"
                    name="salaire"
                    type="number"
                    min={0}
                    step={5000}
                    defaultValue={profile.salaryExpectation}
                  />
                </Field>
              </div>

              <Field label="Zones de recherche" htmlFor="pr-zones" hint="Séparez les villes par une virgule.">
                <Input id="pr-zones" name="zones" defaultValue={profile.searchZones.join(", ")} />
              </Field>

              <Checkbox
                name="mobilite"
                label="Je suis mobile géographiquement"
                description="Les offres hors de vos zones vous seront tout de même proposées, avec une pondération réduite."
                defaultChecked={profile.geographicMobility}
              />
            </div>
            <SimulatedActionBar
              className="mt-4"
              actions={[
                {
                  label: "Enregistrer mes préférences",
                  variant: "primary",
                  message: "Vos préférences seraient enregistrées et vos recommandations rafraîchies dès le prochain calcul.",
                },
              ]}
            />
          </EditDisclosure>
        </SettingsSection>

        <PremiumCallout title="Analyse des points faibles de votre profil">
          Premium repère ce qui vous fait perdre des points offre après offre : formulations trop vagues, compétences
          absentes du marché que vous visez, incohérences entre votre CV et votre profil.
        </PremiumCallout>
      </div>
    </>
  );
}
