# @sira/shared

Référentiel commun au site (`apps/web`) et à l'API (`apps/api`) : énumérations, libellés français, pondérations et mentions du score.

Une valeur se déclare ici une seule fois. Le schéma Prisma de l'API reprend les mêmes valeurs, et un test de l'API vérifie qu'elles restent alignées.

## Deux façons de le lire

- **Le site** importe directement le code TypeScript (`src/`), compilé par Next.js avec le reste de l'application. Aucune étape de construction n'est nécessaire.
- **L'API** lit la version compilée (`dist/`), produite par `npm run build`. Les scripts de l'API la reconstruisent avant chaque lancement.
