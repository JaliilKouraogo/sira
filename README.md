# SIRA — Le chemin vers l'opportunité

Plateforme de mise en relation entre talents, recruteurs et organismes de formation, lancée au Burkina Faso.

**Démonstration en ligne : https://jaliilkouraogo.github.io/sira/**

## Contenu du dépôt

| Dossier | Rôle | Documentation |
|---|---|---|
| `apps/web` | Site public et espaces candidat, recruteur, formateur et administration (Next.js) | [apps/web/README.md](apps/web/README.md) |
| `apps/api` | API REST : comptes, offres, candidatures, score et IA Hugging Face (NestJS, PostgreSQL) | [apps/api/README.md](apps/api/README.md) |
| `packages/shared` | Référentiel commun : énumérations, libellés et pondérations du score | [packages/shared/README.md](packages/shared/README.md) |

Le site lit encore ses données de démonstration. L'API charge les mêmes, pour que le branchement se fasse sans surprise.

## Démarrer

Prérequis : Node.js 20.12 ou plus récent ; Docker pour l'API.

```bash
npm install              # installe tous les espaces de travail
npm run dev:web          # site sur http://localhost:3100
```

Pour l'API, voir [apps/api/README.md](apps/api/README.md) : base de données, variables d'environnement et données de démonstration.

| Commande (à la racine) | Effet |
|---|---|
| `npm run dev:web` | Site en développement |
| `npm run dev:api` | API en développement |
| `npm run typecheck` | Vérification TypeScript de tous les espaces |
| `npm test` | Tests unitaires |
| `docker compose up -d` | PostgreSQL local pour l'API, port 5440 |

## Intégration continue

- `.github/workflows/deploy.yml` construit l'export statique du site et le publie sur GitHub Pages à chaque envoi qui touche le site.
- `.github/workflows/api.yml` vérifie l'API à chaque envoi qui la touche : types, tests unitaires, tests de bout en bout sur PostgreSQL, construction.
