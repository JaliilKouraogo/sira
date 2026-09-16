/**
 * Choix du type de compte — première étape de l'inscription.
 *
 * Décision de conception : le rôle « formateur » existe bien au référentiel
 * (`USER_ROLES`), mais son parcours d'inscription reste masqué derrière un
 * drapeau jusqu'au lot 7. La carte est donc affichée, visiblement désactivée,
 * plutôt que supprimée : l'utilisateur comprend que la fonction arrive.
 *
 * Direction épurée : les trois choix sont une liste séparée par des filets,
 * pas une pile de cartes bordées.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { IconArrowRight, IconCheck } from "@/components/icons";
import { ZoneMark, type ZoneKey } from "@/components/illustrations";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Choisissez votre type de compte SIRA : candidat, recruteur ou formateur.",
  robots: { index: false, follow: false },
};

type Choice = {
  href: string;
  /** Espace auquel mène ce compte : son glyphe annonce la différenciation. */
  zone: ZoneKey;
  title: string;
  subtitle: string;
  points: string[];
  disabled?: boolean;
};

const CHOICES: Choice[] = [
  {
    href: "/inscription/candidat",
    zone: "candidate",
    title: "Candidat",
    subtitle: "Je cherche un emploi, un stage ou une mission",
    points: [
      "Recevoir les offres qui correspondent à mon profil",
      "Comprendre mon score de compatibilité offre par offre",
      "Préparer CV, lettre et message de candidature",
      "Suivre mes candidatures et me former",
    ],
  },
  {
    href: "/inscription/recruteur",
    zone: "recruiter",
    title: "Recruteur / Entreprise",
    subtitle: "Je recrute pour mon organisation",
    points: [
      "Publier des offres après vérification de l'organisation",
      "Recevoir les candidatures classées par pertinence",
      "Rechercher dans la CVthèque des profils visibles",
      "Gérer mon équipe et mes modèles d'offres",
    ],
  },
  {
    href: "#",
    zone: "trainer",
    title: "Formateur / Organisme",
    subtitle: "Je propose des formations et des campagnes",
    points: [
      "Publier un catalogue de formations",
      "Diffuser des campagnes auprès des candidats ciblés",
      "Suivre les inscriptions et les résultats",
    ],
    disabled: true,
  },
];

export default function InscriptionPage() {
  return (
    <div>
      <h1 className="text-[22px] font-semibold text-[var(--color-text)]">Créer mon compte SIRA</h1>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--color-text-muted)]">
        Choisissez le compte qui vous ressemble. Le parcours et les écrans s&apos;adaptent ensuite à votre
        rôle.
      </p>

      <ul className="mt-8 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {CHOICES.map((choice) => {
          const body = (
            <>
              <div className="flex items-start gap-3">
                {/* Le glyphe de l'espace : la teinte annonce déjà où mène ce compte. */}
                <span
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)]"
                  aria-hidden
                >
                  <ZoneMark zone={choice.zone} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-[var(--color-text)] group-hover:underline">
                      {choice.title}
                    </h2>
                    {choice.disabled ? <Badge tone="accent">Bientôt disponible</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">{choice.subtitle}</p>
                </div>
                {choice.disabled ? null : (
                  <span
                    className="mt-1.5 shrink-0 text-[var(--color-text-subtle)] group-hover:text-[var(--color-primary)]"
                    aria-hidden
                  >
                    <IconArrowRight size={16} />
                  </span>
                )}
              </div>

              <ul className="mt-3 space-y-1.5 pl-11">
                {choice.points.map((point) => (
                  <li key={point} className="flex gap-2 text-[13px] text-[var(--color-text-muted)]">
                    <span
                      className={
                        choice.disabled
                          ? "mt-0.5 shrink-0 text-[var(--color-text-subtle)]"
                          : "mt-0.5 shrink-0 text-[var(--color-success)]"
                      }
                      aria-hidden
                    >
                      <IconCheck size={14} />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </>
          );

          return (
            <li key={choice.title}>
              {choice.disabled ? (
                <div aria-disabled="true" className="cursor-not-allowed py-5 opacity-70">
                  {body}
                  <p className="mt-3 ml-11 border-l border-[var(--color-border)] pl-3 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
                    L&apos;espace formateur ouvrira au lot 7. En attendant, un organisme de formation peut créer
                    un compte recruteur pour publier ses offres.
                  </p>
                </div>
              ) : (
                <Link href={choice.href} className="group block py-5">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-[13px] text-[var(--color-text-muted)]">
        Vous avez déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-[var(--color-primary)] hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
