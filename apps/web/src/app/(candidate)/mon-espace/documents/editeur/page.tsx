import { getCandidateProfile, getCurrentUser } from "@/data/queries";
import { CvEditor } from "./cv-editor";

export const metadata = {
  title: "Éditer mon CV — Syvaa",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function CvEditorPage() {
  const profile = getCandidateProfile();
  const user = getCurrentUser();
  const fullName = `${user.firstName} ${user.lastName}`;
  const experienceHtml = profile.experiences
    .map(
      (experience) =>
        `<h3>${escapeHtml(experience.title)} · ${escapeHtml(experience.company)}</h3><p><em>${escapeHtml(experience.startDate)} – ${escapeHtml(experience.endDate ?? "Aujourd'hui")}</em></p><p>${escapeHtml(experience.description)}</p>`,
    )
    .join("");
  const educationHtml = profile.educations
    .map(
      (education) =>
        `<p><strong>${escapeHtml(education.degree)}</strong> · ${escapeHtml(education.school)} (${escapeHtml(education.year)})</p>`,
    )
    .join("");
  const skillHtml = profile.hardSkills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("");

  const initialContent = [
    `<h1>${escapeHtml(fullName)}</h1>`,
    `<p><strong>${escapeHtml(profile.headline)}</strong></p>`,
    `<p>${escapeHtml(profile.city)} · ${escapeHtml(user.email)}</p>`,
    "<h2>Profil professionnel</h2>",
    `<p>${escapeHtml(profile.domain)} · ${profile.experienceYears} ans d'expérience</p>`,
    "<h2>Expériences professionnelles</h2>",
    experienceHtml,
    "<h2>Formation</h2>",
    educationHtml,
    "<h2>Compétences</h2>",
    `<ul>${skillHtml}</ul>`,
    "<h2>Langues</h2>",
    `<p>${profile.languages.map((language) => `${escapeHtml(language.name)} (${escapeHtml(language.level)})`).join(" · ")}</p>`,
  ].join("");

  return <CvEditor initialContent={initialContent} candidateName={fullName} candidateId={profile.id} />;
}