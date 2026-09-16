# SIRA — Le chemin vers l'opportunité

Plateforme panafricaine de mise en relation entre talents, recruteurs et organismes de formation : offres d'emploi et de stage, score de compatibilité expliqué, préparation de candidature assistée et formations pour combler les écarts.

**Démonstration en ligne : https://jaliilkouraogo.github.io/sira/**

Ce dépôt contient le frontend web. Il n'est pas encore relié à une API : toutes les données sont des données de démonstration.

## Parcourir la démonstration

| Espace | Adresse |
|---|---|
| Site public | `/` |
| Plan de tous les écrans | `/demo/` |
| Espace candidat | `/mon-espace/` |
| Espace recruteur | `/recruteur/` |
| Espace formateur | `/formateur/` |
| Administration | `/admin/` |

L'authentification n'est pas branchée : chaque espace s'ouvre directement par son adresse.

## Lancer le projet en local

Prérequis : Node.js 20.9 ou plus récent.

```bash
npm install
npm run dev
```

Le site est alors disponible sur http://localhost:3100.

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Construction de l'application Next.js |
| `npm run typecheck` | Vérification TypeScript |
| `GITHUB_PAGES=true npm run build` | Export statique dans `out/`, servi sous `/sira` |

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Polices Inter et Instrument Sans, auto-hébergées par `next/font`
- Aucune autre dépendance : icônes, illustrations et animations sont écrites à la main

## Organisation du code

```
src/
├── app/
│   ├── (public)/      Site vitrine : accueil, emplois, stages, formations,
│   │                  recruteurs, conseils, à propos, contact, pages légales
│   ├── (auth)/        Inscription, connexion, vérification, double authentification
│   ├── (candidate)/   Espace candidat
│   ├── (recruiter)/   Espace recruteur
│   ├── (trainer)/     Espace formateur
│   └── (admin)/       Back-office
├── components/
│   └── site/          Kit du site vitrine : blocs, cartes, animations, navigation
├── data/              Données de démonstration et couche d'accès
└── lib/               Référentiel des énumérations, types, chemin de base
```

## Design

Le site vitrine reprend la **grammaire de mise en page** du modèle Webflow « HireEdge » (blocs arrondis, navigation flottante, cartes à bordure basse épaissie, animations d'entrée, rideaux sur les images, défilements infinis). Aucun code, aucune image et aucun texte de ce modèle n'est réutilisé : l'implémentation, les contenus et l'identité visuelle sont propres à SIRA.

- Fond blanc, blocs marine et gris très clair, filets or sur les blocs et les cartes.
- Couleurs de marque relevées sur le logo : marine `#19196F`, or `#C6A11D`.
- Points de rupture : 480, 768 et 992 pixels. Les écrans sont vérifiés en bureau et sur mobile Android.
- Le réglage système « mouvement réduit » désactive toutes les animations.

Les espaces applicatifs (candidat, recruteur, formateur, administration) ont leur propre système visuel, avec thème clair et sombre.

## Déploiement

Chaque envoi sur la branche `main` déclenche le workflow `.github/workflows/deploy.yml`, qui construit l'export statique et le publie sur GitHub Pages.

L'export statique impose quelques règles, documentées dans `src/lib/base-path.ts` :

- aucune page ne lit les paramètres d'adresse côté serveur, les filtres fonctionnent côté navigateur ;
- chaque route dynamique déclare ses pages à générer ;
- les images, les formulaires et les liens bruts passent par `asset()` et `route()`.

## À remplacer avant une mise en production

- **Témoignages** : ils sont fictifs et doivent être remplacés par des retours réels et autorisés.
- **Chiffres** : ce sont des objectifs, présentés comme tels.
- **Articles de conseils, organisations et offres** : contenus de démonstration.
- **Coordonnées** du pied de page et de la page contact.

## Crédits

Photographies : Unsplash, sous licence Unsplash. Détail dans `public/images/CREDITS.md`.

## Licence

Tous droits réservés. Aucune licence d'utilisation n'est accordée à ce stade.
