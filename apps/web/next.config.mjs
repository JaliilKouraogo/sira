/**
 * Deux modes de construction :
 * - par défaut, application Next.js classique (`next dev`, `next build`) ;
 * - `GITHUB_PAGES=true`, export statique servi sous `/sira` sur GitHub Pages.
 *
 * En export statique, aucune fonctionnalité serveur n'est disponible : les
 * filtres lisent l'adresse côté navigateur, les routes dynamiques sont
 * pré-générées et les images ne passent pas par l'optimiseur de Next.js.
 */

const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? "/sira" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isPages
    ? {
        output: "export",
        basePath,
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: isPages,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_EXPORT: isPages ? "true" : "false",
  },
  // Autorise l'inspection du serveur de développement via 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
