/**
 * Paramètres — [T §6.11].
 *
 * Sept sections : préférences, confidentialité, WhatsApp, notifications,
 * marketing, sécurité et zone de danger.
 *
 * La matrice de notifications lit `CONSENT_MATRIX` et respecte les trois
 * bases de la section 10.2 : une ligne « service » est cochée et verrouillée,
 * une préférence se désactive librement, un consentement exige un opt-in
 * explicite et par défaut décoché.
 */

import Link from "next/link";
import { SimulatedActionBar } from "@/components/account-actions";
import { SettingsSection } from "@/components/account-shared";
import {
  IconAlert,
  IconBell,
  IconCheckCircle,
  IconMegaphone,
  IconSettings,
  IconShield,
  IconWhatsApp,
} from "@/components/icons";
import {
  Alert,
  Badge,
  Checkbox,
  Field,
  Input,
  PageHeader,
  Select,
  cx,
  formatDate,
} from "@/components/ui";
import { getCandidateProfile, getConsents, getCurrentUser } from "@/data/queries";
import {
  CITIES,
  CONSENT_BASIS_LABEL,
  CONSENT_MATRIX,
  CONSENT_TYPES,
  CONSENT_TYPE_LABEL,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABEL,
  PROFILE_VISIBILITIES,
  PROFILE_VISIBILITY_LABEL,
  type ConsentBasis,
  type ConsentType,
  type NotificationChannel,
} from "@/lib/enums";

export const metadata = {
  title: "Paramètres — SIRA",
};

/** Ce que chaque niveau de visibilité implique concrètement. */
const VISIBILITY_DETAIL: Record<(typeof PROFILE_VISIBILITIES)[number], string> = {
  invisible:
    "Aucun recruteur ne peut vous trouver dans la recherche de talents. Vous continuez à postuler normalement : seules vos candidatures vous rendent visible.",
  anonyme:
    "Les recruteurs voient votre expérience, vos compétences et votre domaine, sans votre nom, votre photo ni vos coordonnées. Ils peuvent vous contacter par un message relayé par SIRA.",
  complet:
    "Les recruteurs vérifiés voient votre profil complet et peuvent vous contacter directement. Vos coordonnées restent masquées tant que vous n'avez pas candidaté chez eux.",
};

/** Tournure française correcte pour chaque canal, dans une phrase. */
const CHANNEL_PHRASE: Record<NotificationChannel, string> = {
  in_app: "dans l'application",
  email: "par e-mail",
  whatsapp: "par WhatsApp",
};

const BASIS_TONE: Record<ConsentBasis, "info" | "neutral" | "accent"> = {
  service: "info",
  preference: "neutral",
  consentement: "accent",
};

export default function SettingsPage() {
  const user = getCurrentUser();
  const profile = getCandidateProfile();
  const consents = getConsents();

  const consentGranted = (type: ConsentType, channel: NotificationChannel) =>
    consents.find((consent) => consent.consentType === type && consent.channel === channel)?.granted ?? false;

  /** État par défaut d'une case de la matrice, selon la base juridique. */
  const isChecked = (type: ConsentType, channel: NotificationChannel) => {
    const basis = CONSENT_MATRIX[type][channel];
    if (basis === "service") return true;
    if (basis === "preference") return true;
    return consentGranted(type, channel);
  };

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Vos préférences, votre confidentialité, vos consentements et la sécurité de votre compte."
      />

      {/* ---------------- Sommaire ---------------- */}
      <nav aria-label="Sections des paramètres" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {[
            { href: "#preferences", label: "Préférences" },
            { href: "#confidentialite", label: "Confidentialité" },
            { href: "#whatsapp", label: "WhatsApp" },
            { href: "#notifications", label: "Notifications" },
            { href: "#marketing", label: "Communications commerciales" },
            { href: "#securite", label: "Sécurité" },
            { href: "#danger", label: "Suppression du compte" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex items-center rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-5">
        {/* ---------------- Préférences ---------------- */}
        <SettingsSection
          id="preferences"
          title="Préférences"
          description="Langue de l'interface, localisation et rythme des résumés."
          icon={<IconSettings size={18} />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Langue de l'interface" htmlFor="s-langue">
              <Select id="s-langue" name="langue" defaultValue={user.locale}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <Field label="Ville principale" htmlFor="s-ville" hint="Sert au calcul de la composante « localisation ».">
              <Select id="s-ville" name="ville" defaultValue={profile.city}>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Résumé des offres" htmlFor="s-resume">
              <Select id="s-resume" name="resume" defaultValue="hebdomadaire">
                <option value="quotidien">Chaque jour</option>
                <option value="hebdomadaire">Une fois par semaine</option>
                <option value="jamais">Jamais</option>
              </Select>
            </Field>
            <Field label="Format des dates" htmlFor="s-dates">
              <Select id="s-dates" name="dates" defaultValue="long">
                <option value="long">12 septembre 2026</option>
                <option value="court">12/09/26</option>
              </Select>
            </Field>
          </div>

          <SimulatedActionBar
            className="mt-4"
            actions={[
              {
                label: "Enregistrer mes préférences",
                variant: "primary",
                message: "Vos préférences d'affichage seraient appliquées immédiatement sur tous vos écrans.",
              },
            ]}
          />
        </SettingsSection>

        {/* ---------------- Confidentialité ---------------- */}
        <SettingsSection
          id="confidentialite"
          title="Confidentialité du profil"
          description="Vous décidez de ce qu'un recruteur peut voir avant que vous ne postuliez."
          icon={<IconShield size={18} />}
        >
          <fieldset>
            <legend className="sr-only">Visibilité de mon profil</legend>
            <div className="space-y-2">
              {PROFILE_VISIBILITIES.map((visibility) => {
                const selected = profile.profileVisibility === visibility;
                return (
                  <label
                    key={visibility}
                    className={cx(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                      selected
                        ? "border-[var(--color-border-strong)] bg-[var(--color-surface-2)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-2)]",
                    )}
                  >
                    <input
                      type="radio"
                      name="visibilite"
                      value={visibility}
                      defaultChecked={selected}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-[var(--color-text)]">
                        {PROFILE_VISIBILITY_LABEL[visibility]}
                        {selected ? <Badge tone="primary">Réglage actuel</Badge> : null}
                      </span>
                      <span className="mt-1 block text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                        {VISIBILITY_DETAIL[visibility]}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Alert tone="info" title="Vos coordonnées, dans tous les cas">
            Quel que soit le niveau choisi, votre téléphone et votre adresse e-mail ne sont communiqués à une
            organisation <strong>qu&apos;après que vous avez candidaté chez elle</strong>. Aucun recruteur ne peut les
            obtenir depuis la recherche de talents.
          </Alert>

          <SimulatedActionBar
            className="mt-4"
            actions={[
              {
                label: "Enregistrer",
                variant: "primary",
                message: "Le nouveau niveau de visibilité serait appliqué immédiatement à la recherche de talents.",
              },
            ]}
          />
        </SettingsSection>

        {/* ---------------- WhatsApp ---------------- */}
        <SettingsSection
          id="whatsapp"
          title="WhatsApp"
          description="Le canal le plus utilisé au Burkina Faso : alertes d'offres et suivi de candidature."
          icon={<IconWhatsApp size={18} />}
        >
          {profile.whatsappLinked ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-border)] p-3.5">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-[var(--color-text)]">
                  {user.phone ?? "Numéro non renseigné"}
                  <Badge tone="success" icon={<IconCheckCircle size={12} />}>
                    Numéro lié et vérifié
                  </Badge>
                </p>
                <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
                  Vérifié le {user.phoneVerifiedAt ? formatDate(user.phoneVerifiedAt) : "—"} · plan Gratuit :
                  5 notifications WhatsApp par semaine.
                </p>
              </div>
              <SimulatedActionBar
                actions={[
                  {
                    label: "Délier mon numéro",
                    variant: "danger",
                    tone: "neutral",
                    message:
                      "Votre numéro serait dissocié du compte et votre consentement WhatsApp révoqué. Vous ne recevriez plus aucune alerte sur ce canal, sans perdre aucune autre fonction.",
                  },
                  {
                    label: "Changer de numéro",
                    message: "Un code de vérification serait envoyé au nouveau numéro avant toute bascule.",
                    tone: "info",
                  },
                ]}
              />
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-[var(--color-border-strong)] p-4 text-center">
              <p className="text-[13.5px] text-[var(--color-text)]">Aucun numéro WhatsApp lié</p>
              <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
                Liez votre numéro pour recevoir vos alertes d&apos;offres là où vous les lirez vraiment.
              </p>
            </div>
          )}

          <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
            L&apos;envoi sur WhatsApp repose toujours sur un consentement explicite, distinct de vos autres
            préférences, et révocable d&apos;un seul geste depuis cet écran.
          </p>
        </SettingsSection>

        {/* ---------------- Notifications ---------------- */}
        <SettingsSection
          id="notifications"
          title="Notifications"
          description="Croisez le type de message et le canal. Chaque case indique sur quelle base elle repose."
          icon={<IconBell size={18} />}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <caption className="sr-only">
                Matrice des notifications : type de notification en ligne, canal en colonne
              </caption>
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th scope="col" className="py-2 pr-3 text-[12.5px] font-semibold text-[var(--color-text-muted)]">
                    Type de notification
                  </th>
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <th
                      key={channel}
                      scope="col"
                      className="w-28 py-2 px-3 text-center text-[12.5px] font-semibold text-[var(--color-text)]"
                    >
                      {NOTIFICATION_CHANNEL_LABEL[channel]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONSENT_TYPES.map((type) => (
                  <tr key={type} className="border-b border-[var(--color-border)] last:border-0">
                    <th scope="row" className="py-3 pr-3 align-top">
                      <span className="block text-[13px] font-medium text-[var(--color-text)]">
                        {CONSENT_TYPE_LABEL[type]}
                      </span>
                      <span className="mt-1 block">
                        <Badge tone={BASIS_TONE[CONSENT_MATRIX[type].in_app]}>
                          {CONSENT_BASIS_LABEL[CONSENT_MATRIX[type].in_app]}
                        </Badge>
                      </span>
                    </th>
                    {NOTIFICATION_CHANNELS.map((channel) => {
                      const basis = CONSENT_MATRIX[type][channel];
                      const locked = basis === "service";
                      return (
                        <td key={channel} className="py-3 px-3 text-center align-top">
                          <input
                            type="checkbox"
                            name={`notif-${type}-${channel}`}
                            defaultChecked={isChecked(type, channel)}
                            disabled={locked}
                            aria-label={`${CONSENT_TYPE_LABEL[type]} par ${NOTIFICATION_CHANNEL_LABEL[channel]} — ${CONSENT_BASIS_LABEL[basis]}`}
                            title={CONSENT_BASIS_LABEL[basis]}
                            className="h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-primary)] disabled:opacity-60"
                          />
                          <span className="mt-1 block text-[10.5px] leading-tight text-[var(--color-text-subtle)]">
                            {locked ? "Verrouillé" : basis === "preference" ? "Modifiable" : "Opt-in"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-2">
            <Alert tone="info" title={CONSENT_BASIS_LABEL.service}>
              Les messages de service — sécurité du compte, avancement de vos candidatures — sont indispensables au
              fonctionnement de SIRA. Ces cases sont cochées et verrouillées : les désactiver reviendrait à ne plus
              vous prévenir qu&apos;un recruteur a répondu.
            </Alert>
            <Alert tone="neutral" title={CONSENT_BASIS_LABEL.preference}>
              Les alertes d&apos;opportunités relèvent de votre confort : décochez-les quand vous voulez, vos
              candidatures en cours ne changent pas.
            </Alert>
            <Alert tone="accent" title={CONSENT_BASIS_LABEL.consentement}>
              WhatsApp et les communications commerciales exigent un accord explicite de votre part. Ils restent
              décochés tant que vous ne les activez pas, et se révoquent aussi facilement.
            </Alert>
          </div>

          <SimulatedActionBar
            className="mt-4"
            actions={[
              {
                label: "Enregistrer mes choix",
                variant: "primary",
                message:
                  "Vos préférences de notification seraient enregistrées, chacune avec sa base juridique, sa date et son origine, dans votre registre de consentements.",
              },
            ]}
          />
        </SettingsSection>

        {/* ---------------- Marketing ---------------- */}
        <SettingsSection
          id="marketing"
          title="Communications commerciales"
          description="Offres promotionnelles de SIRA et de ses partenaires."
          icon={<IconMegaphone size={18} />}
        >
          <div className="space-y-3">
            {NOTIFICATION_CHANNELS.map((channel) => (
              <Checkbox
                key={channel}
                name={`marketing-${channel}`}
                label={`Recevoir les communications commerciales ${CHANNEL_PHRASE[channel]}`}
                description={
                  consentGranted("marketing", channel)
                    ? "Consentement actuellement accordé. Vous pouvez le retirer à tout moment."
                    : "Consentement non accordé. Rien ne vous est envoyé sur ce canal."
                }
                defaultChecked={consentGranted("marketing", channel)}
              />
            ))}
          </div>

          <Alert tone="success" title="Refuser ne vous retire rien">
            <strong>
              Refuser les communications commerciales n&apos;entraîne aucune restriction sur les fonctions
              essentielles de SIRA.
            </strong>{" "}
            Vos recommandations d&apos;offres, vos scores, la préparation de vos candidatures, vos notifications de
            service et l&apos;ensemble de votre plan continuent de fonctionner à l&apos;identique. Ce choix est
            strictement indépendant de votre usage de la plateforme.
          </Alert>

          <SimulatedActionBar
            className="mt-4"
            actions={[
              {
                label: "Enregistrer",
                variant: "primary",
                message: "Votre choix serait horodaté et consigné dans le registre des consentements, avec sa source.",
              },
            ]}
          />
        </SettingsSection>

        {/* ---------------- Sécurité ---------------- */}
        <SettingsSection
          id="securite"
          title="Sécurité"
          description="Mot de passe, double authentification et sessions."
          icon={<IconShield size={18} />}
        >
          <div className="space-y-5">
            <div>
              <h3 className="mb-3 text-[13.5px] font-semibold text-[var(--color-text)]">Changer de mot de passe</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Mot de passe actuel" htmlFor="sec-actuel">
                  <Input id="sec-actuel" name="actuel" type="password" autoComplete="current-password" />
                </Field>
                <Field label="Nouveau mot de passe" htmlFor="sec-nouveau" hint="12 caractères minimum.">
                  <Input id="sec-nouveau" name="nouveau" type="password" autoComplete="new-password" />
                </Field>
                <Field label="Confirmation" htmlFor="sec-confirm">
                  <Input id="sec-confirm" name="confirmation" type="password" autoComplete="new-password" />
                </Field>
              </div>
              <SimulatedActionBar
                className="mt-3"
                actions={[
                  {
                    label: "Mettre à jour le mot de passe",
                    variant: "primary",
                    message:
                      "Votre mot de passe serait changé et toutes vos autres sessions déconnectées, par précaution.",
                  },
                ]}
              />
            </div>

            <div className="border-t border-[var(--color-border)] pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-[var(--color-text)]">
                    Double authentification (2FA)
                    <Badge tone={user.twoFactorEnabled ? "success" : "warning"}>
                      {user.twoFactorEnabled ? "Activée" : "Désactivée"}
                    </Badge>
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                    Un code à six chiffres vous est envoyé par SMS ou WhatsApp à chaque connexion depuis un nouvel
                    appareil. Recommandé si vous consultez SIRA depuis un téléphone partagé.
                  </p>
                </div>
                <SimulatedActionBar
                  actions={[
                    {
                      label: user.twoFactorEnabled ? "Désactiver la 2FA" : "Activer la 2FA",
                      variant: user.twoFactorEnabled ? "outline" : "primary",
                      message: user.twoFactorEnabled
                        ? "La double authentification serait désactivée après confirmation par un code."
                        : "Un code de vérification serait envoyé à votre numéro pour finaliser l'activation.",
                    },
                  ]}
                />
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-5">
              <h3 className="mb-2 text-[13.5px] font-semibold text-[var(--color-text)]">Sessions actives</h3>
              <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[var(--color-border)] py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--color-text)]">
                    Navigateur web · Ouagadougou, Burkina Faso
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">Session actuelle · aujourd&apos;hui</p>
                </div>
                <Badge tone="success">En cours</Badge>
              </div>
              <SimulatedActionBar
                className="mt-3"
                actions={[
                  {
                    label: "Déconnecter les autres appareils",
                    message: "Toutes les sessions autres que celle-ci seraient fermées immédiatement.",
                  },
                ]}
              />
            </div>
          </div>
        </SettingsSection>

        {/* ---------------- Zone de danger ---------------- */}
        <SettingsSection
          id="danger"
          title="Supprimer mon compte"
          description="Action définitive, encadrée par un délai de rétractation."
          icon={<IconAlert size={18} />}
          tone="danger"
        >
          <div className="space-y-3 text-[13px] leading-relaxed text-[var(--color-text)]">
            <p>
              La suppression est enregistrée immédiatement, mais elle ne devient définitive qu&apos;au bout de{" "}
              <strong>30 jours</strong>. Pendant ce délai de rétractation, il vous suffit de vous reconnecter pour tout
              annuler et retrouver votre compte intact.
            </p>
            <p>
              Passé ce délai, votre profil, votre CV, vos documents générés et votre historique de conversation sont
              effacés. En revanche, les{" "}
              <strong>candidatures que des recruteurs ont déjà reçues ne disparaissent pas de leur espace</strong> :
              elles y sont <strong>anonymisées</strong>. Votre nom, vos coordonnées et votre photo en sont retirés, les
              pièces du dossier restent conservées le temps que la loi impose au recruteur, sans qu&apos;il puisse
              vous réidentifier.
            </p>
            <p className="text-[var(--color-text-muted)]">
              Si vous souhaitez simplement ne plus être sollicitée, réglez votre profil sur «{" "}
              {PROFILE_VISIBILITY_LABEL.invisible} » : c&apos;est réversible, et cela n&apos;efface rien.
            </p>
          </div>

          <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-danger)] p-3.5">
            <Field
              label="Pour confirmer, saisissez SUPPRIMER"
              htmlFor="danger-confirm"
              hint="Cette saisie évite les suppressions accidentelles."
            >
              <Input id="danger-confirm" name="confirmation" placeholder="SUPPRIMER" autoComplete="off" />
            </Field>
            <SimulatedActionBar
              className="mt-3"
              actions={[
                {
                  label: "Supprimer définitivement mon compte",
                  variant: "danger",
                  tone: "danger",
                  message:
                    "La demande serait enregistrée et un e-mail de confirmation vous serait envoyé. Vous disposeriez de 30 jours pour revenir en arrière ; les candidatures déjà reçues par les recruteurs seraient anonymisées.",
                },
                {
                  label: "Exporter mes données avant",
                  tone: "info",
                  message:
                    "Une archive contenant votre profil, vos documents et votre historique vous serait envoyée par e-mail sous 48 heures.",
                },
              ]}
            />
          </div>
        </SettingsSection>
      </div>
    </>
  );
}
