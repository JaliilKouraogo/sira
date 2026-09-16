"use client";

import { useState } from "react";
import { Alert, Badge, Button, Card, CardHeader, Checkbox, Field, Input, Progress, Select, Tag, Textarea } from "@/components/ui";
import {
  TRAINING_ACCESS,
  TRAINING_ACCESS_LABEL,
  TRAINING_FORMATS,
  TRAINING_FORMAT_LABEL,
  formatMoney,
  type TrainingAccess,
  type TrainingFormat,
} from "@/lib/enums";

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"] as const;

interface FormState {
  title: string;
  category: string;
  description: string;
  objectives: string;
  prerequisites: string;
  durationHours: string;
  format: TrainingFormat;
  access: TrainingAccess;
  price: string;
  startDate: string;
  endDate: string;
  trainerName: string;
  certificate: boolean;
  seats: string;
  level: (typeof LEVELS)[number];
}

const INITIAL: FormState = {
  title: "",
  category: "",
  description: "",
  objectives: "",
  prerequisites: "",
  durationHours: "",
  format: "presentiel",
  access: "payant",
  price: "",
  startDate: "",
  endDate: "",
  trainerName: "",
  certificate: false,
  seats: "",
  level: "Débutant",
};

/**
 * Création d'une formation — les douze champs de [T §8.1].
 *
 * Le formulaire n'écrit rien : il valide, prévisualise et affiche la fiche
 * telle qu'elle paraîtrait au catalogue. Les champs obligatoires sont ceux
 * sans lesquels un candidat ne peut pas décider de s'inscrire.
 */
export function TrainingForm({ categories }: { categories: string[] }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitted(false);
  };

  const objectives = form.objectives
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const prerequisites = form.prerequisites
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.title.trim()) errors.title = "Un intitulé est obligatoire.";
  if (!form.category) errors.category = "Choisissez une catégorie.";
  if (form.description.trim().length < 40) errors.description = "Décrivez la formation en 40 caractères au moins.";
  if (objectives.length === 0) errors.objectives = "Indiquez au moins un objectif pédagogique.";
  if (!form.durationHours || Number(form.durationHours) <= 0) errors.durationHours = "Indiquez une durée en heures.";
  if (form.access === "payant" && (!form.price || Number(form.price) <= 0)) {
    errors.price = "Une formation payante affiche son tarif : le candidat doit pouvoir décider.";
  }
  if (!form.startDate) errors.startDate = "Une session sans date de démarrage remonte mal au catalogue.";
  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    errors.endDate = "La date de fin précède la date de démarrage.";
  }
  if (!form.trainerName.trim()) errors.trainerName = "Nommez le formateur ou l'intervenant principal.";
  if (!form.seats || Number(form.seats) <= 0) errors.seats = "Indiquez le nombre de places ouvertes.";

  const errorCount = Object.keys(errors).length;
  const valid = errorCount === 0;

  /** Complétude : les douze champs de la fiche, remplis ou non. */
  const filled = [
    form.title.trim(),
    form.category,
    form.description.trim(),
    objectives.length > 0 ? "x" : "",
    prerequisites.length > 0 ? "x" : "",
    form.durationHours,
    form.format,
    form.access === "payant" ? form.price : "gratuit",
    form.startDate,
    form.trainerName.trim(),
    form.certificate ? "x" : "x",
    form.seats,
  ].filter(Boolean).length;
  const completion = (filled / 12) * 100;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) {
            setShowErrors(true);
            return;
          }
          setShowErrors(false);
          setSubmitted(true);
        }}
        noValidate
        className="space-y-6"
      >
        <Card>
          <CardHeader title="Présentation" subtitle="Ce que le candidat lit en premier" />
          <div className="space-y-4 p-4">
            <Field
              label="Intitulé de la formation"
              htmlFor="titre"
              required
              error={showErrors ? errors.title : undefined}
              hint="Un intitulé concret : le métier ou la compétence visée, pas le nom de votre programme interne."
            >
              <Input
                id="titre"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Développement web avec React"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Catégorie" htmlFor="categorie" required error={showErrors ? errors.category : undefined}>
                <Select id="categorie" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Choisir une catégorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Niveau visé" htmlFor="niveau">
                <Select
                  id="niveau"
                  value={form.level}
                  onChange={(e) => set("level", e.target.value as FormState["level"])}
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Description"
              htmlFor="description"
              required
              error={showErrors ? errors.description : undefined}
              hint="Déroulé, méthode, mise en pratique. Le candidat doit comprendre ce qu'il saura faire à la fin."
            >
              <Textarea
                id="description"
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Parcours intensif de 8 semaines, projet final encadré…"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Contenu pédagogique" subtitle="Un élément par ligne" />
          <div className="space-y-4 p-4">
            <Field
              label="Objectifs pédagogiques"
              htmlFor="objectifs"
              required
              error={showErrors ? errors.objectives : undefined}
              hint="Un objectif par ligne, formulé à l'infinitif : « Maîtriser les composants et les hooks »."
            >
              <Textarea
                id="objectifs"
                rows={4}
                value={form.objectives}
                onChange={(e) => set("objectives", e.target.value)}
                placeholder={"Maîtriser les composants et les hooks\nConsommer une API\nDéployer une application"}
              />
            </Field>
            <Field
              label="Prérequis"
              htmlFor="prerequis"
              hint="Un prérequis par ligne. Laissez vide si la formation est accessible sans condition."
            >
              <Textarea
                id="prerequis"
                rows={3}
                value={form.prerequisites}
                onChange={(e) => set("prerequisites", e.target.value)}
                placeholder={"JavaScript de base"}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Organisation" subtitle="Durée, format, dates et places" />
          <div className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Durée, en heures"
                htmlFor="duree"
                required
                error={showErrors ? errors.durationHours : undefined}
              >
                <Input
                  id="duree"
                  type="number"
                  min={1}
                  value={form.durationHours}
                  onChange={(e) => set("durationHours", e.target.value)}
                  placeholder="21"
                />
              </Field>
              <Field label="Format" htmlFor="format" required>
                <Select
                  id="format"
                  value={form.format}
                  onChange={(e) => set("format", e.target.value as TrainingFormat)}
                >
                  {TRAINING_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {TRAINING_FORMAT_LABEL[format]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Date de démarrage"
                htmlFor="debut"
                required
                error={showErrors ? errors.startDate : undefined}
              >
                <Input
                  id="debut"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </Field>
              <Field label="Date de fin" htmlFor="fin" error={showErrors ? errors.endDate : undefined}>
                <Input id="fin" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nombre de places"
                htmlFor="places"
                required
                error={showErrors ? errors.seats : undefined}
                hint="Le nombre de places affiché crée l'urgence utile : n'annoncez que ce que vous pouvez tenir."
              >
                <Input
                  id="places"
                  type="number"
                  min={1}
                  value={form.seats}
                  onChange={(e) => set("seats", e.target.value)}
                  placeholder="16"
                />
              </Field>
              <Field
                label="Formateur ou intervenant"
                htmlFor="formateur"
                required
                error={showErrors ? errors.trainerName : undefined}
              >
                <Input
                  id="formateur"
                  value={form.trainerName}
                  onChange={(e) => set("trainerName", e.target.value)}
                  placeholder="Fatoumata Ouédraogo"
                />
              </Field>
            </div>

            <Checkbox
              label="Cette formation délivre un certificat"
              description="Le certificat apparaît sur la fiche publique et sur le profil du candidat qui l'obtient."
              checked={form.certificate}
              onChange={(e) => set("certificate", e.target.checked)}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Conditions d'accès et tarif" subtitle="Le règlement se fait chez vous, pas sur SIRA" />
          <div className="space-y-4 p-4">
            <Field label="Condition d'accès" htmlFor="acces" required>
              <Select
                id="acces"
                value={form.access}
                onChange={(e) => set("access", e.target.value as TrainingAccess)}
              >
                {TRAINING_ACCESS.map((access) => (
                  <option key={access} value={access}>
                    {TRAINING_ACCESS_LABEL[access]}
                  </option>
                ))}
              </Select>
            </Field>

            {form.access === "payant" ? (
              <Field
                label="Prix, en francs CFA"
                htmlFor="prix"
                required
                error={showErrors ? errors.price : undefined}
                hint="Prix par participant, toutes taxes comprises."
              >
                <Input
                  id="prix"
                  type="number"
                  min={0}
                  step={1000}
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="75000"
                />
              </Field>
            ) : (
              <Alert tone="info">
                Une formation gratuite ou incluse dans l&apos;abonnement Premium n&apos;affiche aucun tarif. Elle
                reste soumise aux mêmes contrôles de fiche que les autres.
              </Alert>
            )}
          </div>
        </Card>

        {showErrors && !valid ? (
          <Alert tone="danger" title={`${errorCount} champ(s) à corriger`}>
            La fiche ne part pas au catalogue tant qu&apos;un champ obligatoire manque. Les messages sont affichés
            sous chaque champ concerné.
          </Alert>
        ) : null}

        {submitted ? (
          <Alert tone="success" title="Fiche prête à être publiée">
            Enregistrement simulé : la démonstration n&apos;a pas de backend. Dans le produit, la fiche partirait en
            vérification si votre organisme n&apos;était pas encore vérifié, et au catalogue sinon.
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="accent">
            Publier la formation
          </Button>
          <Button type="button" variant="outline" onClick={() => setSubmitted(true)}>
            Enregistrer comme brouillon
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setForm(INITIAL);
              setShowErrors(false);
              setSubmitted(false);
            }}
          >
            Tout effacer
          </Button>
        </div>
      </form>

      {/* ---- Aperçu de la fiche ---- */}
      <div className="space-y-4 lg:sticky lg:top-20">
        <Card>
          <CardHeader
            title="Complétude de la fiche"
            subtitle="Douze champs composent une fiche de catalogue"
            action={<Badge tone={completion === 100 ? "success" : "neutral"}>{Math.round(completion)} %</Badge>}
          />
          <div className="p-4">
            <Progress value={completion} tone={completion === 100 ? "success" : "primary"} label="Complétude" />
            <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
              {filled} champ(s) sur 12 renseignés. Une fiche complète est mieux classée dans le catalogue et
              déclenche la recommandation automatique aux candidats concernés.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Aperçu au catalogue" subtitle="Ce que verra le candidat" />
          <div className="space-y-3 p-4">
            <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
              {form.title || "Intitulé de votre formation"}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {form.category ? <Tag>{form.category}</Tag> : null}
              <Badge tone="neutral">{TRAINING_FORMAT_LABEL[form.format]}</Badge>
              <Badge tone={form.access === "payant" ? "neutral" : "accent"}>
                {TRAINING_ACCESS_LABEL[form.access]}
              </Badge>
              {form.certificate ? <Badge tone="success">Certificat</Badge> : null}
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              {form.description || "La description apparaîtra ici, telle que vous la rédigez."}
            </p>
            <dl className="space-y-1 text-[12.5px]">
              <div className="flex gap-2">
                <dt className="text-[var(--color-text-muted)]">Durée :</dt>
                <dd>{form.durationHours ? `${form.durationHours} heures` : "à préciser"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[var(--color-text-muted)]">Tarif :</dt>
                <dd>
                  {form.access === "payant"
                    ? form.price
                      ? formatMoney(Number(form.price))
                      : "à préciser"
                    : TRAINING_ACCESS_LABEL[form.access]}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[var(--color-text-muted)]">Démarrage :</dt>
                <dd>{form.startDate || "à préciser"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[var(--color-text-muted)]">Places :</dt>
                <dd>{form.seats || "à préciser"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[var(--color-text-muted)]">Intervenant :</dt>
                <dd>{form.trainerName || "à préciser"}</dd>
              </div>
            </dl>
            {objectives.length > 0 ? (
              <div>
                <p className="text-[12.5px] font-medium text-[var(--color-text)]">Objectifs</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12.5px] text-[var(--color-text-muted)]">
                  {objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {prerequisites.length > 0 ? (
              <div>
                <p className="text-[12.5px] font-medium text-[var(--color-text)]">Prérequis</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12.5px] text-[var(--color-text-muted)]">
                  {prerequisites.map((prerequisite) => (
                    <li key={prerequisite}>{prerequisite}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
