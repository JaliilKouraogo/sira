"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { Alert, Badge, Button } from "@/components/ui";

const STORAGE_KEY = "sira.cv-editor.v1";
const SECTION_NAMES = ["Profil professionnel", "Expériences professionnelles", "Formation", "Compétences", "Langues"];
const VAGUE_WORDS = ["participation", "responsable de", "divers", "plusieurs", "aide à", "chargé de"];

type Diagnostic = { label: string; detail: string };
type AiProposal = { rewrittenText: string; changes: { title: string; explanation: string }[]; warnings: string[] };
type CvNode = { type?: string; text?: string; attrs?: { level?: number; src?: string; alt?: string; width?: number; height?: number }; marks?: { type: string }[]; content?: CvNode[] };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function plainTextHtml(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function proposalHtml(value: string): string {
  const sections = /^(profil(?: professionnel)?|expériences?(?: professionnelles?)?|formation(?:s)?|compétences|langues|projets|certifications|bénévolat|centres d'intérêt)\s*:?$/i;
  return value.split(/\r?\n/).map((line, index) => {
    const text = line.trim();
    if (!text) return "";
    if (index === 0 && text.length < 100) return `<h1>${escapeHtml(text)}</h1>`;
    if (sections.test(text)) return `<h2>${escapeHtml(text.replace(/:$/, ""))}</h2>`;
    if (/^[-*•]\s+/.test(text)) return `<p>• ${escapeHtml(text.replace(/^[-*•]\s+/, ""))}</p>`;
    return `<p>${escapeHtml(text)}</p>`;
  }).join("");
}

function richRuns(node: CvNode): TextRun[] {
  if (node.type === "text") {
    const marks = new Set((node.marks ?? []).map((mark) => mark.type));
    return [new TextRun({ text: node.text ?? "", bold: marks.has("bold"), italics: marks.has("italic"), strike: marks.has("strike") })];
  }
  return (node.content ?? []).flatMap(richRuns);
}

function imageRun(node: CvNode): ImageRun | null {
  const match = node.attrs?.src?.match(/^data:image\/(png|jpeg|jpg);base64,([\s\S]+)$/i);
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  return new ImageRun({
    data: bytes,
    type: match[1].toLocaleLowerCase() === "png" ? "png" : "jpg",
    transformation: {
      width: Math.min(node.attrs?.width ?? 220, 520),
      height: Math.min(node.attrs?.height ?? 120, 520),
    },
    altText: { name: node.attrs?.alt ?? "Image du CV" },
  });
}

function docxParagraphs(nodes: CvNode[]): Paragraph[] {
  return nodes.flatMap((node) => {
    if (node.type === "image") {
      const image = imageRun(node);
      return image ? [new Paragraph({ children: [image], spacing: { after: 120 } })] : [];
    }
    if (node.type === "bulletList" || node.type === "orderedList") {
      return (node.content ?? []).flatMap((item, index) =>
        (item.content ?? []).map((child) => new Paragraph({
          children: [new TextRun({ text: node.type === "bulletList" ? "- " : `${index + 1}. ` }), ...richRuns(child)],
          spacing: { after: 100 },
        })),
      );
    }
    if (node.type === "heading") {
      const heading = node.attrs?.level === 1 ? HeadingLevel.TITLE : node.attrs?.level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_2;
      return [new Paragraph({ heading, children: richRuns(node), spacing: { before: 180, after: 90 } })];
    }
    if (node.type === "blockquote") return docxParagraphs(node.content ?? []);
    if (node.type === "paragraph") return [new Paragraph({ children: richRuns(node), spacing: { after: 120 } })];
    return [];
  });
}

function findDiagnostics(text: string): Diagnostic[] {
  const normalized = text.toLocaleLowerCase("fr");
  const findings: Diagnostic[] = [];
  if (!/\b\d+\s?(%|\+|ans?|personnes|clients|projets|fcfa|mois)\b/i.test(text)) {
    findings.push({ label: "Rendez vos résultats mesurables", detail: "Aucun chiffre de résultat n'apparaît. Ajoutez uniquement des indicateurs vérifiables issus de votre expérience." });
  }
  const vague = VAGUE_WORDS.find((word) => normalized.includes(word));
  if (vague) findings.push({ label: "Précisez une formulation", detail: `La formulation « ${vague} » gagnerait à décrire une action et son résultat concret.` });
  const missing = SECTION_NAMES.filter((section) => !normalized.includes(section.toLocaleLowerCase("fr")));
  if (missing.length) findings.push({ label: "Vérifiez les rubriques", detail: `Rubrique(s) non repérée(s) : ${missing.join(", ")}.` });
  if (!findings.length) findings.push({ label: "Structure bien repérée", detail: "Les rubriques principales sont présentes. Relisez les dates, les coordonnées et les résultats avant export." });
  return findings;
}

function extractKeywords(value: string): string[] {
  const stopWords = new Set(["avec", "dans", "pour", "vous", "votre", "nous", "vous", "poste", "être", "avoir", "plus", "ainsi", "entre", "leur", "elle", "mais", "dont", "sous", "tous", "toute", "comme", "auprès", "niveau", "minimum"]);
  return [...new Set(value.toLocaleLowerCase("fr").match(/[a-zà-ÿ][a-zà-ÿ0-9+#.-]{3,}/g) ?? [])]
    .filter((word) => !stopWords.has(word))
    .slice(0, 80);
}

export function CvEditor({ initialContent, candidateName, candidateId }: { initialContent: string; candidateName: string; candidateId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const storageKey = `${STORAGE_KEY}.${candidateId}`;
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [fileError, setFileError] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageAlt, setImageAlt] = useState("Photo de profil");
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [offerText, setOfferText] = useState("");
  const [template, setTemplate] = useState<"classic" | "modern" | "compact">("classic");
  const [aiMode, setAiMode] = useState<"improve" | "adapt">("improve");
  const [aiConsent, setAiConsent] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiProposal, setAiProposal] = useState<AiProposal | null>(null);
  const [title, setTitle] = useState(`${candidateName} - CV`);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: true,
        resize: { enabled: true, minWidth: 70, minHeight: 40, alwaysPreserveAspectRatio: true },
        HTMLAttributes: { class: "cv-inline-image" },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "cv-prose min-h-[980px] outline-none",
        "aria-label": "Contenu modifiable du CV",
      },
    },
    onUpdate: ({ editor: current }) => {
      const value = JSON.stringify({ content: current.getHTML(), title, template });
      window.localStorage.setItem(storageKey, value);
      setSavedAt(new Date());
    },
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && editor) {
      try {
        const parsed = JSON.parse(stored) as { content?: string; title?: string; template?: "classic" | "modern" | "compact" };
        if (parsed.content) editor.commands.setContent(parsed.content);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.template) setTemplate(parsed.template);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setReady(true);
  }, [editor, storageKey]);

  useEffect(() => {
    if (!editor || !ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ content: editor.getHTML(), title, template }));
    setSavedAt(new Date());
  }, [editor, ready, title, template, storageKey]);

  const text = editor?.getText() ?? "";
  const diagnostics = useMemo(() => findDiagnostics(text), [text]);
  const keywords = useMemo(() => extractKeywords(offerText), [offerText]);
  const matchedKeywords = keywords.filter((word) => text.toLocaleLowerCase("fr").includes(word));
  const missingKeywords = keywords.filter((word) => !text.toLocaleLowerCase("fr").includes(word)).slice(0, 12);

  async function requestAiProposal() {
    if (!editor || !aiConsent) return;
    setAiError("");
    setAiProposal(null);
    setAiLoading(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/ai/cv-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: aiMode,
          cvText: editor.getText(),
          ...(aiMode === "adapt" && { jobDescription: offerText }),
        }),
      });
      const result = await response.json() as {
        source?: string;
        proposal?: AiProposal | null;
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(result.error?.message ?? "La demande IA n'a pas abouti.");
      if (result.source !== "ia" || !result.proposal) {
        throw new Error("Le service IA n'est pas configuré. Configurez un fournisseur IA sur l'API puis réessayez.");
      }
      setAiProposal(result.proposal);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Impossible de joindre le service IA.");
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiProposal() {
    if (!aiProposal) return;
    const images = (editor?.getJSON().content ?? [])
      .filter((node) => node.type === "image")
      .map((node) => {
        const attrs = node.attrs as { src?: string; alt?: string; width?: number; height?: number };
        if (!attrs.src?.startsWith("data:image/")) return "";
        return `<p><img src="${attrs.src}" alt="${escapeHtml(attrs.alt ?? "Image du CV")}" width="${attrs.width ?? 220}" height="${attrs.height ?? 120}"></p>`;
      })
      .join("");
    editor?.commands.setContent(`${proposalHtml(aiProposal.rewrittenText)}${images}`);
    setAiProposal(null);
  }

  async function importFile(file: File) {
    setFileError("");
    try {
      let imported = "";
      if (file.type === "application/pdf" || file.name.toLocaleLowerCase().endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
        }
        imported = pages.join("\n\n");
      } else if (/\.docx$/i.test(file.name)) {
        const { unzipSync } = await import("fflate");
        const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
        const documentXml = files["word/document.xml"];
        if (!documentXml) throw new Error("Ce fichier DOCX ne contient pas de document Word lisible.");
        const xml = new DOMParser().parseFromString(new TextDecoder().decode(documentXml), "application/xml");
        if (xml.querySelector("parsererror")) throw new Error("Le contenu Word est illisible.");
        imported = Array.from(xml.getElementsByTagNameNS("*", "p"))
          .map((paragraph) => Array.from(paragraph.getElementsByTagNameNS("*", "t")).map((run) => run.textContent ?? "").join(""))
          .filter((paragraph) => paragraph.trim().length > 0)
          .join("\n\n");
      } else if (/\.(txt|md)$/i.test(file.name) || file.type.startsWith("text/")) {
        imported = await file.text();
      } else {
        throw new Error("Format non pris en charge. Importez un PDF, un DOCX, un TXT ou un fichier Markdown.");
      }
      if (!imported.trim()) throw new Error("Aucun texte n'a pu être extrait. Le PDF est peut-être une image numérisée.");
      editor?.commands.setContent(plainTextHtml(imported));
      setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Impossible de lire ce fichier.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function insertImage(file: File) {
    setImageError("");
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choisissez un fichier image JPEG, PNG ou WebP.");
      if (file.size > 12 * 1024 * 1024) throw new Error("L’image dépasse 12 Mo. Choisissez un fichier plus léger.");
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Le navigateur ne peut pas traiter cette image.");
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const src = canvas.toDataURL("image/jpeg", 0.78);
      const displayScale = Math.min(1, 220 / width, 180 / height);
      editor?.chain().focus().setImage({
        src,
        alt: imageAlt.trim() || "Image du CV",
        width: Math.round(width * displayScale),
        height: Math.round(height * displayScale),
      }).run();
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Impossible d’ajouter cette image.");
    } finally {
      if (imageInput.current) imageInput.current.value = "";
    }
  }

  function insertSignature(dataUrl: string) {
    editor?.chain().focus().setImage({ src: dataUrl, alt: "Signature manuscrite", width: 300, height: 88 }).run();
    setSignatureOpen(false);
  }

  async function exportDocx() {
    if (!editor) return;
    const children = docxParagraphs((editor.getJSON().content ?? []) as CvNode[]);
    const document = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(document);
    downloadBlob(blob, `${safeFilename(title)}.docx`);
  }

  function printPdf() {
    document.body.classList.add("cv-print-mode");
    const cleanup = () => document.body.classList.remove("cv-print-mode");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 2000);
  }

  function addSection(heading: string) {
    editor?.chain().focus().insertContent(`<h2>${escapeHtml(heading)}</h2><p></p>`).run();
  }

  return (
    <div className="cv-editor-root -mx-4 -mt-6 min-h-[calc(100vh-5rem)] bg-[var(--color-surface-2)] sm:-mx-6 lg:-mx-8">
      <div className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)] print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/mon-espace/documents" className="text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Documents</Link>
            <span className="hidden h-5 border-l border-[var(--color-border)] sm:block" />
            <label className="min-w-0">
              <span className="sr-only">Nom du document</span>
              <input className="w-full max-w-[270px] truncate border-0 bg-transparent text-[14px] font-semibold text-[var(--color-text)] outline-none focus:ring-0" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <span className="hidden text-[11px] text-[var(--color-text-subtle)] md:inline">{savedAt ? `Enregistré à ${savedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ready ? "Sauvegarde locale activée" : "Chargement…"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>Importer</Button>
            <Button variant="outline" size="sm" onClick={() => void exportDocx()} disabled={!editor}>Exporter DOCX</Button>
            <Button size="sm" onClick={printPdf} disabled={!editor}>Exporter PDF</Button>
            <input ref={fileInput} className="hidden" type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); }} />
            <input ref={imageInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void insertImage(file); }} />
          </div>
        </div>
        {fileError ? <p className="px-4 pb-2 text-[12px] text-[var(--color-danger)] sm:px-6" role="alert">{fileError}</p> : null}
        <div className="flex flex-wrap items-center gap-1 border-t border-[var(--color-border)] px-4 py-2 sm:px-6">
          <ToolbarButton label="Gras" active={editor?.isActive("bold") ?? false} onClick={() => editor?.chain().focus().toggleBold().run()}><strong>B</strong></ToolbarButton>
          <ToolbarButton label="Italique" active={editor?.isActive("italic") ?? false} onClick={() => editor?.chain().focus().toggleItalic().run()}><em>I</em></ToolbarButton>
          <ToolbarButton label="Barré" active={editor?.isActive("strike") ?? false} onClick={() => editor?.chain().focus().toggleStrike().run()}><s>S</s></ToolbarButton>
          <span className="mx-1 h-5 border-l border-[var(--color-border)]" />
          <ToolbarButton label="Titre principal" active={editor?.isActive("heading", { level: 1 }) ?? false} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>Titre</ToolbarButton>
          <ToolbarButton label="Sous-titre" active={editor?.isActive("heading", { level: 2 }) ?? false} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
          <ToolbarButton label="Liste à puces" active={editor?.isActive("bulletList") ?? false} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• Liste</ToolbarButton>
          <ToolbarButton label="Liste numérotée" active={editor?.isActive("orderedList") ?? false} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. Liste</ToolbarButton>
          <span className="mx-1 h-5 border-l border-[var(--color-border)]" />
          <ToolbarButton label="Annuler" onClick={() => editor?.chain().focus().undo().run()}>Annuler</ToolbarButton>
          <ToolbarButton label="Rétablir" onClick={() => editor?.chain().focus().redo().run()}>Rétablir</ToolbarButton>
          <span className="mx-1 h-5 border-l border-[var(--color-border)]" />
          <ToolbarButton label="Insérer une image" onClick={() => imageInput.current?.click()}>Image</ToolbarButton>
          <div className="ml-auto flex items-center gap-1">
            <label htmlFor="cv-template" className="sr-only">Modèle de mise en page</label>
            <select id="cv-template" className="h-8 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-[12px] text-[var(--color-text)]" value={template} onChange={(event) => setTemplate(event.target.value as typeof template)}>
              <option value="classic">Classique</option><option value="modern">Moderne</option><option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:px-8">
        <main className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[var(--color-text-muted)]">
            <span>Feuille A4 · cliquez dans le document pour modifier</span>
            <span>{text.trim() ? text.trim().split(/\s+/).length : 0} mots</span>
          </div>
          <section className={`cv-print-page cv-paper cv-template-${template} mx-auto min-h-[1123px] w-full max-w-[794px] border border-[var(--color-border)] bg-white px-8 py-10 shadow-sm sm:px-14 sm:py-14`} aria-label="Page CV">
            <EditorContent editor={editor} />
          </section>
          <p className="mx-auto mt-3 max-w-[794px] text-[11px] leading-relaxed text-[var(--color-text-subtle)] print:hidden">Les changements sont sauvegardés dans ce navigateur. L’import extrait le texte des PDF/DOCX ; la mise en page importée n’est pas conservée.</p>
        </main>

        <aside className="space-y-5 xl:sticky xl:top-36 print:hidden">
          <section className="border-t border-[var(--color-border)] pt-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Images et signature</h2>
            <label htmlFor="cv-image-alt" className="mt-2 block text-[12px] text-[var(--color-text-muted)]">Description de l’image</label>
            <input id="cv-image-alt" value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-2 text-[12px] text-[var(--color-text)]" />
            <Button className="mt-2 w-full" variant="outline" size="sm" onClick={() => imageInput.current?.click()}>Insérer une image</Button>
            {imageError ? <p className="mt-2 text-[11px] text-[var(--color-danger)]" role="alert">{imageError}</p> : null}
            <Button className="mt-2 w-full" variant="outline" size="sm" onClick={() => setSignatureOpen(true)}>Signer au trackpad ou à la souris</Button>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">La signature est insérée comme image dans le CV. Ce n’est pas une signature électronique certifiée.</p>
          </section>

          <section className="border-t-2 border-[var(--color-accent)] pt-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Aide à la rédaction IA</h2>
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-md bg-[var(--color-surface-3)] p-1" role="group" aria-label="Type d'aide IA">
              <button type="button" aria-pressed={aiMode === "improve"} onClick={() => setAiMode("improve")} className={`rounded px-2 py-1.5 text-[11.5px] font-medium ${aiMode === "improve" ? "bg-white text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-muted)]"}`}>Améliorer</button>
              <button type="button" aria-pressed={aiMode === "adapt"} onClick={() => setAiMode("adapt")} className={`rounded px-2 py-1.5 text-[11.5px] font-medium ${aiMode === "adapt" ? "bg-white text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-muted)]"}`}>Adapter à l’offre</button>
            </div>
            {aiMode === "adapt" ? <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-text-muted)]">Collez la description dans « Comparer à une offre » ci-dessous. L’IA ne peut pas ajouter une compétence absente de votre parcours.</p> : <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-text-muted)]">Propose une réécriture plus claire à partir des faits déjà présents dans le CV.</p>}
            <label className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              <input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} className="mt-0.5 accent-[var(--color-primary)]" />
              <span>J’accepte l’envoi du texte de mon CV{aiMode === "adapt" ? " et de l’offre" : ""} au fournisseur IA configuré. Le texte n’est pas conservé par Syvaa.</span>
            </label>
            <Button className="mt-3 w-full" size="sm" disabled={!aiConsent || aiLoading || !editor || text.trim().length < 100 || (aiMode === "adapt" && offerText.trim().length < 50)} onClick={() => void requestAiProposal()}>
              {aiLoading ? "Analyse en cours…" : aiMode === "adapt" ? "Proposer une adaptation" : "Proposer des améliorations"}
            </Button>
            {aiMode === "adapt" && offerText.trim().length > 0 && offerText.trim().length < 50 ? <p className="mt-2 text-[11px] text-[var(--color-warning)]">Ajoutez au moins 50 caractères de description de l’offre.</p> : null}
            {aiError ? <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-danger)]" role="alert">{aiError}</p> : null}
            {aiProposal ? <div className="mt-4 border-t border-[var(--color-border)] pt-3">
              <h3 className="text-[12px] font-semibold text-[var(--color-text)]">Proposition à relire</h3>
              <ul className="mt-2 space-y-2">{aiProposal.changes.map((change) => <li key={`${change.title}-${change.explanation}`}><p className="text-[11.5px] font-medium text-[var(--color-text)]">{change.title}</p><p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">{change.explanation}</p></li>)}</ul>
              {aiProposal.warnings.map((warning) => <p key={warning} className="mt-2 text-[11px] leading-relaxed text-[var(--color-warning)]">À vérifier : {warning}</p>)}
              <details className="mt-3"><summary className="cursor-pointer text-[11.5px] font-medium text-[var(--color-primary)]">Voir le texte proposé</summary><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[10.5px] leading-relaxed text-[var(--color-text-muted)]">{aiProposal.rewrittenText}</pre></details>
              <div className="mt-3 flex gap-2"><Button size="sm" onClick={applyAiProposal}>Appliquer au CV</Button><Button variant="outline" size="sm" onClick={() => setAiProposal(null)}>Ignorer</Button></div>
            </div> : null}
          </section>

          <section className="border-t-2 border-[var(--color-primary)] pt-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Qualité du CV</h2>
              <Button variant="ghost" size="sm" onClick={() => setDiagnosticOpen((open) => !open)}>{diagnosticOpen ? "Masquer" : "Analyser"}</Button>
            </div>
            {diagnosticOpen ? <ul className="mt-3 space-y-3" aria-live="polite">{diagnostics.map((item) => <li key={item.label} className="border-b border-[var(--color-border)] pb-3"><p className="text-[12.5px] font-medium text-[var(--color-text)]">{item.label}</p><p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-muted)]">{item.detail}</p></li>)}</ul> : <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">Conseils automatiques sur la structure et les formulations. Ils ne remplacent pas une relecture.</p>}
            <Badge className="mt-3" tone="neutral">Analyse locale, sans envoi du CV</Badge>
          </section>

          <section className="border-t border-[var(--color-border)] pt-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Comparer à une offre</h2>
            <label htmlFor="offer-text" className="mt-2 block text-[12px] text-[var(--color-text-muted)]">Collez la description du poste</label>
            <textarea id="offer-text" value={offerText} onChange={(event) => setOfferText(event.target.value)} rows={6} className="mt-1.5 w-full resize-y rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2.5 text-[12px] leading-relaxed text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" placeholder="Missions, compétences et expérience recherchées…" />
            {offerText.trim() ? <div className="mt-3 space-y-3" aria-live="polite"><p className="text-[12px] font-medium text-[var(--color-text)]">Termes repérés dans votre CV : {matchedKeywords.length}</p><p className="text-[11.5px] leading-relaxed text-[var(--color-text-muted)]">{matchedKeywords.slice(0, 8).join(" · ") || "Aucun terme exact détecté."}</p>{missingKeywords.length ? <><p className="text-[12px] font-medium text-[var(--color-text)]">À vérifier dans l’offre</p><p className="text-[11.5px] leading-relaxed text-[var(--color-text-muted)]">{missingKeywords.join(" · ")}</p><Alert tone="info">N’ajoutez ces compétences que si elles correspondent réellement à votre expérience.</Alert></> : null}</div> : <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-text-muted)]">Le texte reste dans votre navigateur. Les correspondances sont lexicales, pas une évaluation IA.</p>}
          </section>

          <section className="border-t border-[var(--color-border)] pt-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Ajouter une rubrique</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">{["Projets", "Certifications", "Bénévolat", "Centres d’intérêt"].map((section) => <Button key={section} variant="outline" size="sm" onClick={() => addSection(section)}>+ {section}</Button>)}</div>
          </section>
        </aside>
      </div>
      {signatureOpen ? <SignatureDialog onCancel={() => setSignatureOpen(false)} onInsert={insertSignature} /> : null}
      <style jsx global>{`
        .cv-prose { color: #202027; font-family: Georgia, "Times New Roman", serif; font-size: 15px; line-height: 1.65; }
        .cv-prose h1 { margin: 0 0 8px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 30px; font-weight: 700; line-height: 1.15; }
        .cv-prose h2 { margin: 24px 0 8px; border-bottom: 1px solid #d9d9de; padding-bottom: 5px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 14px; font-weight: 700; text-transform: uppercase; }
        .cv-prose h3 { margin: 16px 0 5px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; font-weight: 700; }
        .cv-prose p { margin: 5px 0; }
        .cv-prose ul, .cv-prose ol { margin: 8px 0; padding-left: 24px; }
        .cv-prose li { padding-left: 3px; }
        .cv-prose blockquote { margin: 12px 0; border-left: 3px solid #c6a11d; padding-left: 12px; color: #62626c; }
        .cv-prose a { color: #19196f; text-decoration: underline; }
        .cv-prose img { display: inline-block; max-width: 100%; height: auto; vertical-align: middle; }
        .cv-prose img.cv-inline-image { border-radius: 2px; }
        .cv-prose > *:first-child { margin-top: 0; }
        .cv-template-modern .cv-prose h2 { border-bottom: 2px solid #157f4f; color: #125f3d; }
        .cv-template-compact .cv-prose { font-size: 13px; line-height: 1.45; }
        .cv-template-compact .cv-prose h2 { margin-top: 15px; }
        @media print {
          @page { size: A4; margin: 14mm; }
          body.cv-print-mode * { visibility: hidden !important; }
          body.cv-print-mode .cv-print-page, body.cv-print-mode .cv-print-page * { visibility: visible !important; }
          body.cv-print-mode .cv-print-page { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; min-height: 0 !important; max-width: none !important; border: 0 !important; padding: 0 !important; box-shadow: none !important; }
          body.cv-print-mode .cv-prose { font-size: 11pt; }
          body.cv-print-mode .cv-prose h1 { font-size: 24pt; }
          body.cv-print-mode .cv-prose h2 { break-after: avoid; }
          body.cv-print-mode .cv-prose li, body.cv-print-mode .cv-prose p { orphans: 2; widows: 2; }
        }
      `}</style>
    </div>
  );
}

function SignatureDialog({ onCancel, onInsert }: { onCancel: () => void; onInsert: (signature: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#19196f";
    context.lineWidth = 4;
    isDrawing.current = true;
    setHasSignature(true);
  }

  function continueDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    event.preventDefault();
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function stopDrawing() {
    isDrawing.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) onInsert(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 print:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="signature-title" className="w-full max-w-[620px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6">
        <h2 id="signature-title" className="text-[17px] font-semibold text-[var(--color-text)]">Signer dans le document</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">Tracez votre signature avec la souris ou le trackpad. Elle sera ajoutée à la position du curseur.</p>
        <div className="mt-4 overflow-hidden border border-[var(--color-border-strong)] bg-white">
          <canvas
            ref={canvasRef}
            width={960}
            height={280}
            aria-label="Zone de dessin de la signature"
            className="block h-[140px] w-full touch-none cursor-crosshair"
            onPointerDown={startDrawing}
            onPointerMove={continueDrawing}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onLostPointerCapture={stopDrawing}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={clearSignature}>Effacer et recommencer</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
            <Button size="sm" disabled={!hasSignature} onClick={saveSignature}>Insérer dans le CV</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolbarButton({ label, active = false, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} onClick={onClick} className={`inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-[12px] text-[var(--color-text)] hover:bg-[var(--color-surface-3)] ${active ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : ""}`}>{children}</button>;
}

function safeFilename(value: string): string {
  return value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 100) || "CV";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
