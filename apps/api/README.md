# API SIRA

API REST de SIRA : comptes, organisations, profils candidats, offres, candidatures et IA. Elle suit le plan de conception (sections 4, 7, 8, 9 et 11).

- **Pile.** NestJS 11, PostgreSQL 16, Prisma 7, Zod 4, TypeScript 5.9.
- **IA.** Modèles gratuits de Hugging Face, derrière une couche d'abstraction qui permet de changer de fournisseur.
- **Documentation interactive.** http://localhost:4000/api/docs une fois l'API lancée, et le schéma OpenAPI sur `/api/docs/openapi.json`.

## Démarrer en local

Prérequis : Node.js 20.12 ou plus récent, Docker.

```bash
# À la racine du dépôt
npm install
docker compose up -d                 # PostgreSQL sur le port 5440, bases sira et sira_test

cd apps/api
cp .env.example .env                 # puis compléter JWT_ACCESS_SECRET et HF_TOKEN
npm run db:deploy                    # applique les migrations
npm run db:seed                      # comptes, organisations et offres du site
npm run dev                          # http://localhost:4000/api/v1
```

Le seed charge les données de démonstration du site : 4 comptes, 10 organisations et 18 offres. Les dates sont décalées pour que les offres restent ouvertes. Les comptes partagent le mot de passe `Demo-SIRA-2026` :

| Rôle | Adresse |
|---|---|
| Candidate | awa.sawadogo@example.bf |
| Recruteur (Sahel Agro) | recrutement@sahelagro.bf |
| Formateur | contact@numerika.bf |
| Administration | admin@sira.bf |

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur avec rechargement à chaud |
| `npm run build`, `npm start` | Construction puis lancement de `dist/` |
| `npm run typecheck` | Vérification TypeScript |
| `npm test` | Tests unitaires, sans base de données |
| `npm run test:e2e` | Tests de bout en bout sur `DATABASE_URL_TEST`, vidée à chaque lancement |
| `npm run db:migrate` | Crée une migration après modification du schéma |
| `npm run db:deploy` | Applique les migrations |
| `npm run db:seed` | Charge les données de démonstration (refusé en production) |

Chaque commande reconstruit d'abord le paquet partagé et le client Prisma.

Pour mettre à jour les données de démonstration après une modification des données du site :

```bash
npx tsx scripts/export-demo-data.ts
```

## IA : Hugging Face gratuit

L'IA passe par le routeur d'inférence de Hugging Face, avec un jeton gratuit de type « Read », à créer sur https://huggingface.co/settings/tokens puis à placer dans `HF_TOKEN`.

| Usage | Modèle par défaut | Pourquoi |
|---|---|---|
| Explication du score | `Qwen/Qwen3-4B-Instruct-2507` | Respecte les schémas JSON imposés, français propre, 1 à 2 secondes |
| Assistant | `meta-llama/Llama-3.1-8B-Instruct` | Le plus juste en conversation française |
| Secours | `Qwen/Qwen3-4B-Instruct-2507` | Pris quand le premier modèle est saturé ou indisponible |

Ces choix viennent d'essais comparatifs. Llama 3.1 refuse les schémas JSON chez le fournisseur qui le sert, et s'est trompé une fois sur un chiffre dans une explication. Tous les modèles se changent par variable d'environnement.

**Sans jeton, l'API fonctionne entièrement.** Le score est calculé de la même façon, son explication est construite à partir du calcul, et l'assistant renvoie les offres correspondantes avec un message préparé. `AI_PROVIDER=offline` force ce mode.

### Ce que fait le modèle, et ce qu'il ne fait pas

Le **score** est calculé par des règles, pas par le modèle : même profil et même offre donnent toujours le même chiffre. La formule est celle de la section 9.4 du plan :

```
score = 100 × (0,35·compétences + 0,20·expérience + 0,15·formation
             + 0,15·localisation + 0,10·langues + 0,05·disponibilité)
```

Un critère indispensable non rempli plafonne le score à 40.

Le modèle ne fait que **rédiger l'explication**, à partir du seul détail du calcul, sans l'identité du candidat. Son texte est écarté, au profit d'une explication construite à partir du calcul, s'il :

- cite un nombre absent des données fournies ;
- promet une embauche ;
- tutoie le candidat, ou répète un mot.

L'**assistant** ne peut affirmer que les règles publiées de SIRA et le contenu des offres réelles qui lui sont transmises. Les liens vers des sites extérieurs sont retirés de ses réponses, et les offres sont renvoyées à part, depuis la base.

Chaque appel est journalisé dans `ai_jobs` : fournisseur, modèle, jetons, latence et échec éventuel. Le contenu des échanges n'y est pas conservé.

## Règles métier appliquées

| Règle | Où |
|---|---|
| RM-02 : une offre clôturée, suspendue ou expirée n'accepte plus de candidature | `jobs/job-rules.ts` |
| RM-05 : chaque calcul crée un nouveau score ; la candidature garde celui du dépôt ; un score périmé est signalé | `ai/match.service.ts` |
| RM-06 : rien n'est envoyé sans validation du candidat | `applications/application-rules.ts` |
| RM-07 : coordonnées du candidat révélées au recruteur seulement après candidature | `applications/applications.service.ts` |
| RM-09 : l'IA ne décide jamais ; toute revue est une action du recruteur | `applications/application-rules.ts` |
| RM-10 : seule une offre publiée est visible et cherchable | `jobs/jobs.service.ts` |
| RM-11 : une organisation non vérifiée ne publie pas | `jobs/jobs.service.ts` |
| Critères discriminatoires (âge, sexe, famille, religion, origine, handicap) bloqués à la publication | `jobs/discrimination.ts` |
| Le candidat ne voit jamais l'état interne du recruteur (« shortlist ») ni ses notes | `applications/application-rules.ts` |

## Sécurité

- **Mots de passe.** Hachés en Argon2id, avec les paramètres recommandés par l'OWASP. Une connexion échouée ne dit pas si le compte existe, et prend le même temps.
- **Sessions.** Jeton d'accès de 15 minutes. Le jeton de renouvellement est conservé haché, circule dans un cookie `httpOnly` limité aux routes d'authentification, et change à chaque usage. Rejouer un ancien jeton révoque toute la session.
- **Validation.** Chaque entrée passe par un schéma Zod, avec des messages en français.
- **Débit.** Limité par adresse IP, plus sévèrement sur l'authentification et l'IA. En production derrière un proxy, renseigner `TRUST_PROXY`.
- **Erreurs.** Toujours au format `{ error: { code, message, details, requestId } }`, sans détail technique.
- **Journal d'audit.** Actions d'administration, décisions de revue et consultation des dossiers de candidature.
- **Consentements.** Horodatés dès l'inscription : une ligne par changement, jamais de modification.

## Organisation du code

```
src/
├── auth/             Inscription, connexion, jetons, gardes d'accès
├── users/            Compte courant
├── organizations/    Organisations, membres, vérification
├── candidates/       Profil candidat et complétude
├── jobs/             Offres, recherche, offres enregistrées, contrôle discriminatoire
├── applications/     Candidatures, préparation, envoi, revue, notes
├── ai/
│   ├── providers/    Contrat commun, adaptateur Hugging Face, mode hors ligne
│   ├── scoring/      Moteur de score déterministe
│   ├── match.service.ts   Score et explication contrôlée
│   └── chat.service.ts    Assistant
├── audit/            Journal d'audit
├── common/           Erreurs, validation, pagination, identifiant de requête
└── config/           Variables d'environnement validées au démarrage
prisma/               Schéma, migrations, seed et données de démonstration
test/                 Tests de bout en bout
```

## Pas encore fait

Cette première tranche couvre les comptes, les offres, les candidatures et le score. Voici ce qui reste, dans l'ordre du plan :

- **Connexion par téléphone**, avec code SMS ou WhatsApp, et double authentification.
- **CV**, par téléversement vers un stockage objet, avec analyse automatique.
- **Documents générés** : CV adapté, lettre et message.
- **File de traitements**, avec Redis et BullMQ, pour les calculs de score en masse et les notifications.
- **Notifications**, dans l'application, par e-mail et par WhatsApp.
- **Formations, campagnes, abonnements et paiements** par Mobile Money.
- **Back-office complet**, et modération des signalements.
- **Recherche plein texte** : PostgreSQL `tsvector`, puis OpenSearch au-delà de 50 000 offres.
- **Réponses de l'assistant en flux.** L'adaptateur sait déjà les produire.
- **Branchement du site sur l'API.** Le site lit encore ses données de démonstration.
