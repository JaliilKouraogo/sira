# Déploiement Docker Syvaa

Cette stack construit le site Next.js et l'API NestJS en images de production, démarre PostgreSQL 16, applique les migrations Prisma puis lance les applications. La base n'est pas publiée sur un port hôte. Les ports web et API sont liés à `127.0.0.1` par défaut pour être placés derrière un proxy HTTPS.

## Lancer en local sous Windows

Prérequis : Docker Desktop avec Compose v2 démarré.

```powershell
Copy-Item deploy.env.example deploy.env
```

Dans `deploy.env`, remplacez `POSTGRES_PASSWORD` par un mot de passe long aléatoire et `JWT_ACCESS_SECRET` par une valeur aléatoire d'au moins 32 caractères. Configurez également `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` et `WEB_ORIGIN=http://localhost:3100` pour le développement local. Les valeurs de l'exemple sont des marqueurs, pas des secrets utilisables.

```powershell
docker compose --env-file deploy.env -f docker-compose.deploy.yml config
docker compose --env-file deploy.env -f docker-compose.deploy.yml up --build -d
docker compose --env-file deploy.env -f docker-compose.deploy.yml ps
```

- Web : <http://localhost:3100>
- API et documentation : <http://localhost:4000/api/docs>
- Santé API/base : <http://localhost:4000/api/v1/health>

Les migrations s'exécutent à chaque nouveau déploiement avant le démarrage de l'API. Les données PostgreSQL persistent dans le volume `syvaa-deploy-pgdata`.

Pour reconstruire après un changement de code :

```powershell
docker compose --env-file deploy.env -f docker-compose.deploy.yml up --build -d
```

Arrêter sans supprimer les données :

```powershell
docker compose --env-file deploy.env -f docker-compose.deploy.yml down
```

`down -v` supprime les données PostgreSQL ; ne l'utilisez que pour réinitialiser explicitement une base locale jetable.

## Préparer un VPS

1. Installer Docker Engine et le plugin Compose, puis cloner le dépôt sur le serveur.
2. Créer `deploy.env` à partir de `deploy.env.example`. Ne pas transférer ce fichier dans Git. Générer des valeurs secrètes distinctes pour la base et JWT.
3. Régler `WEB_ORIGIN` à l'origine HTTPS du site, par exemple `https://syvaa.example.com`.
4. Régler `NEXT_PUBLIC_API_URL` à l'URL API accessible par le navigateur, par exemple `https://api.syvaa.example.com/api/v1`. Cette valeur est intégrée au bundle lors du build : toute modification nécessite une reconstruction du web.
5. Garder `WEB_BIND_ADDRESS` et `API_BIND_ADDRESS` à `127.0.0.1` et configurer Nginx, Caddy ou Traefik pour terminer TLS puis proxyfier le web vers `127.0.0.1:3100` et l'API vers `127.0.0.1:4000`. Le domaine API doit être autorisé par `WEB_ORIGIN`.
6. Lancer `docker compose --env-file deploy.env -f docker-compose.deploy.yml up --build -d`, puis vérifier `docker compose --env-file deploy.env -f docker-compose.deploy.yml ps` et les journaux `docker compose --env-file deploy.env -f docker-compose.deploy.yml logs -f api web migrate`.

Si le proxy inverse est dans un autre conteneur, reliez-le au réseau Compose et ajustez les adresses de bind selon cette topologie. Ne publiez pas PostgreSQL sur Internet. Configurez des sauvegardes régulières du volume de données et testez leur restauration avant de considérer le VPS en production.

Pour activer l'assistance IA, définissez `AI_PROVIDER=huggingface` et `HF_TOKEN` dans `deploy.env`. Sans cela, l'API démarre en mode hors ligne. Le secret IA est transmis à l'API seulement, jamais au navigateur.

## Images et configuration

- `apps/web/Dockerfile` : build Next.js de production et serveur web non-root.
- `apps/api/Dockerfile` : build NestJS, image runtime non-root et cible build réutilisée pour Prisma migrate.
- `docker-compose.deploy.yml` : base privée, migration ordonnée, API et web avec healthchecks.
- `.dockerignore` exclut les `.env`, dépendances locales, builds et documents de cadrage du contexte Docker.

Le frontend lit encore certaines vues depuis des fixtures de démonstration : cette stack héberge le site et l'API mais ne remplace pas le branchement des écrans du web à leurs endpoints. Le CV édité reste actuellement sauvegardé localement dans le navigateur.