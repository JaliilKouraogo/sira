import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const icon = { src: "/icon.svg", sizes: "any", type: "image/svg+xml" };
  return {
    id: "/",
    name: "Syvaa — Le chemin vers l'opportunité",
    short_name: "Syvaa",
    description: "Offres, candidatures, talents et formations en Afrique.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#19196f",
    categories: ["business", "education", "social"],
    icons: [
      { ...icon, purpose: "any" },
      { ...icon, purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Espace candidat", short_name: "Candidat", url: "/mon-espace", icons: [icon] },
      { name: "Espace recruteur", short_name: "Recruteur", url: "/recruteur", icons: [icon] },
      { name: "Espace formateur", short_name: "Formateur", url: "/formateur", icons: [icon] },
      { name: "Administration", short_name: "Admin", url: "/admin", icons: [icon] },
    ],
  };
}
