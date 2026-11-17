import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/templates";
import { useStudio } from "../state/StudioProvider";
import type { StyleTemplate } from "../types";
import { formatGenerations, imageFileError, readImageFile } from "../utils/files";
import { InstallAppButton } from "./InstallAppButton";
import { ProfileMenu } from "./ProfileMenu";

const PAGE_SIZE = 6;
const STARTER_PROMPT =
  "Render subject through segmented multifaceted planar planes, ochre clay undertones, indigo pigment contrasts, raw linen canvas tooth exposure, high relief gouache accents.";

interface Draft {
  title: string;
  category: string;
  promptInstruction: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_DRAFT: Draft = {
  title: "Geometric African Cubism",
  category: "cubism",
  promptInstruction: STARTER_PROMPT,
  imageUrl: "",
  isActive: true,
};

export function AdminScreen() {
  const studio = useStudio();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const activeCount = studio.templates.filter((template) => template.isActive).length;

  const filtered = studio.templates.filter((template) => {
    const haystack = `${template.title} ${template.categoryLabel} ${template.promptInstruction}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesCategory = category === "all" || template.category === category;
    return matchesQuery && matchesCategory;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const editing = studio.templates.find((template) => template.id === editingId);

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    const message = imageFileError(file);
    if (message) {
      setFormError(message);
      return;
    }
    try {
      const imageUrl = await readImageFile(file);
      setDraft((current) => ({ ...current, imageUrl }));
      setFormError(null);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Could not read that image.");
    }
  };

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setFormError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void submitTemplate();
  };

  const submitTemplate = async () => {
    if (!draft.title.trim()) {
      setFormError("Add a template title.");
      return;
    }
    if (!draft.promptInstruction.trim()) {
      setFormError("Add a GPT Astra style instruction.");
      return;
    }
    if (!draft.imageUrl) {
      setFormError("Add a reference image before publishing.");
      return;
    }
    try {
      await studio.saveTemplate(draft, editingId);
      resetDraft();
      setPage(1);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "The registry refused that template.");
    }
  };

  const edit = (template: StyleTemplate) => {
    setEditingId(template.id);
    setDraft({
      title: template.title,
      category: template.category,
      promptInstruction: template.promptInstruction,
      imageUrl: template.imageUrl,
      isActive: template.isActive,
    });
    setFormError(null);
    document.getElementById("style-template-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggle = (template: StyleTemplate) => {
    const isActive = !template.isActive;
    const generationLabel = isActive
      ? template.generations === null
        ? "Ready"
        : formatGenerations(template.generations)
      : "Archived";
    void studio.updateTemplate(template.id, { isActive, generationLabel });
  };

  return (
    <div className="bg-surface-container-low font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 w-full px-margin-mobile md:px-margin-tablet xl:px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center gap-0.5 p-1">
                <span className="w-1 h-4 bg-primary rounded-[1px]" />
                <span className="w-1.5 h-5 bg-primary rounded-[1px]" />
                <span className="w-1 h-4 bg-primary rounded-[1px]" />
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">QuadreStudio</span>
              <span className="inline-flex items-center px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm uppercase tracking-wider">ADMIN</span>
            </div>
            <nav className="hidden xl:flex items-center gap-space-xs p-1 rounded-full bg-surface-container-low">
              <span aria-current="page" className="px-space-md py-1.5 transition-colors bg-surface-container-high text-on-surface font-semibold rounded-full">Templates</span>
              <span className="px-space-md py-1.5 rounded-full font-body-sm text-body-sm text-on-surface-variant">Curated Styles</span>
              <span className="px-space-md py-1.5 rounded-full font-body-sm text-body-sm text-on-surface-variant">Exhibitions</span>
              <span className="px-space-md py-1.5 rounded-full font-body-sm text-body-sm text-on-surface-variant">Access Keys</span>
              <span className="px-space-md py-1.5 rounded-full font-body-sm text-body-sm text-on-surface-variant">Settings</span>
            </nav>
          </div>
          <div className="flex items-center gap-space-md">
            <InstallAppButton />
            <Link className="hidden sm:inline-flex items-center gap-space-xs px-space-md py-2 rounded-full border border-outline-variant text-on-surface font-body-sm text-body-sm hover:bg-surface-container-high hover:text-on-surface transition-colors" to="/">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Studio</span>
            </Link>
            <div className="hidden md:inline-flex items-center px-space-md py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-2" />
              <span>{activeCount} Active Templates</span>
            </div>
            <button
              className="inline-flex items-center gap-space-xs px-space-lg py-2 rounded-full bg-primary text-on-primary font-body-sm text-body-sm hover:bg-primary-container transition-all shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
              type="button"
              onClick={() => {
                resetDraft();
                document.getElementById("style-template-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Upload New Template</span>
            </button>
            <ProfileMenu />
          </div>
        </div>
      </header>
      <main className="w-full pt-16 bg-surface-container-low min-h-screen">
        <div className="flex flex-col w-full">
          <section className="w-full px-margin-mobile md:px-margin-tablet xl:px-margin py-space-lg">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
              <div>
                <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-secondary" />
                  <span>Accession Master • Registry Dept. 04</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Curatorial Style Templates</h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
                  Architectural registry of algorithmic style matrices, prompt weights, and physical texture guidelines for public generation nodes.
                </p>
                {studio.registryError ? <p className="font-body-sm text-body-sm text-error mt-2">{studio.registryError}</p> : null}
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-lowest p-1.5 rounded-full shadow-sm">
                <div className="px-space-md py-1 rounded-full bg-surface-container-low flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Index</span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">{studio.templates.length} / 64 Max</span>
                </div>
                <div className="px-space-md py-1 rounded-full bg-surface-container-low flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Node Load</span>
                  <span className="font-label-md text-label-md font-semibold text-secondary">99.8% Calibrated</span>
                </div>
              </div>
            </div>
          </section>
          <div className="w-full px-margin-mobile md:px-margin-tablet xl:px-margin pb-space-xl">
            <div className="flex flex-col lg:flex-row gap-space-lg items-start">
              <aside className="w-full lg:w-[36%] shrink-0">
                <div className="sticky top-20 bg-surface-container-lowest rounded-lg p-space-lg shadow-sm">
                  <div className="flex items-start justify-between gap-space-sm pb-space-md mb-space-md">
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[20px]">palette</span>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">Add Curated Art Style</h2>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Configure prompt parameters and reference aesthetics.</p>
                    </div>
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                      {editing ? editing.ref : "NEW REF"}
                    </span>
                  </div>
                  <form className="space-y-space-md" id="style-template-form" onSubmit={submit}>
                    <div className="space-y-1">
                      <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant font-medium">Reference Visual Matrix</label>
                      <div
                        className={`group relative flex flex-col items-center justify-center p-space-lg rounded-DEFAULT transition-all cursor-pointer text-center ${dragOver ? "bg-surface-container-high" : "bg-surface-container-low hover:bg-surface-container"}`}
                        id="dropzone"
                        onDragEnter={(event) => {
                          event.preventDefault();
                          setDragOver(true);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragOver(false);
                          void onImage(event.dataTransfer.files?.[0]);
                        }}
                      >
                        {draft.imageUrl ? (
                          <img alt="" className="w-full aspect-square object-cover rounded-DEFAULT mb-space-sm" src={draft.imageUrl} />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface group-hover:scale-105 transition-transform shadow-sm mb-space-sm">
                            <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
                          </div>
                        )}
                        <p className="font-headline-sm text-headline-sm text-on-surface font-medium text-sm">Drop reference artwork here or browse</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">JPG, PNG, WEBP up to 25MB • 1:1 Recommended</p>
                        <input
                          accept="image/jpeg,image/png,image/webp"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          type="file"
                          onChange={(event) => {
                            void onImage(event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant font-medium" htmlFor="template-title">Template Title</label>
                      <input
                        className="w-full px-space-md py-2.5 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1c1b1b] transition-all"
                        id="template-title"
                        placeholder="e.g., Geometric African Cubism"
                        type="text"
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant font-medium" htmlFor="art-category">Art Category</label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none px-space-md py-2.5 pr-10 rounded-DEFAULT bg-surface-container-low text-on-surface text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1c1b1b] transition-all cursor-pointer"
                          id="art-category"
                          value={draft.category}
                          onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                        >
                          {CATEGORIES.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">unfold_more</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant font-medium" htmlFor="style-instruction">GPT Astra Style Instruction</label>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">System Weight: 1.35</span>
                      </div>
                      <textarea
                        className="w-full px-space-md py-2.5 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1c1b1b] transition-all resize-none"
                        id="style-instruction"
                        placeholder="Describe geometric shapes, brush texture, and color palette rules..."
                        rows={3}
                        value={draft.promptInstruction}
                        onChange={(event) => setDraft((current) => ({ ...current, promptInstruction: event.target.value }))}
                      />
                    </div>
                    <div className="p-space-sm rounded-DEFAULT bg-surface-container-low/70 flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Latent Seed Anchor</span>
                      <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">lock</span>
                        <span>FIXED #89410</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-space-sm">
                      <div className="flex flex-col">
                        <span className="font-body-sm text-body-sm font-medium text-on-surface">Publish immediately to user gallery</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Instantly visible to atelier patrons</span>
                      </div>
                      <button
                        aria-checked={draft.isActive}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${draft.isActive ? "bg-primary" : "bg-surface-container-highest"}`}
                        role="switch"
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, isActive: !current.isActive }))}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${draft.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    {formError ? <p className="font-label-sm text-label-sm text-error">{formError}</p> : null}
                    <button className="w-full mt-space-md py-3 px-space-lg rounded-DEFAULT bg-primary text-on-primary font-body-sm text-body-sm font-medium hover:bg-primary-container transition-all flex items-center justify-center gap-space-xs shadow-md active:scale-[0.99]" type="submit">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Save & Publish Template</span>
                    </button>
                  </form>
                  <div className="mt-space-md pt-space-sm flex items-center gap-space-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span className="font-label-sm text-label-sm">Changes broadcast live across all client generation docks.</span>
                  </div>
                </div>
              </aside>
              <div className="w-full lg:w-[64%] flex flex-col gap-space-lg">
                <section className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Published Style Templates</h2>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm font-semibold text-on-surface">{filtered.length}</span>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                      <input
                        className="w-full pl-9 pr-space-md py-1.5 rounded-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#1c1b1b] transition-all"
                        placeholder="Search styles by name or keyword..."
                        type="search"
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none">
                    <FilterPill active={category === "all"} label={`All Archetypes (${studio.templates.length})`} onClick={() => { setCategory("all"); setPage(1); }} />
                    {CATEGORIES.map((item) => (
                      <FilterPill
                        key={item.id}
                        active={category === item.id}
                        label={item.label}
                        onClick={() => { setCategory(item.id); setPage(1); }}
                      />
                    ))}
                  </div>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {visible.map((template) => (
                    <TemplateCard key={template.id} template={template} onDelete={() => studio.deleteTemplate(template.id)} onEdit={() => edit(template)} onToggle={() => toggle(template)} />
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm mt-space-sm">
                  <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
                    <span>Showing {visible.length} of {filtered.length} cataloged templates</span>
                    <span>•</span>
                    <span className="text-on-surface font-medium">Page {currentPage} of {pageCount}</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      className={`px-space-md py-1.5 rounded-full font-label-sm text-label-sm ${currentPage === 1 ? "bg-surface-container-low text-outline cursor-not-allowed" : "bg-surface-container text-on-surface hover:bg-surface-container-high"}`}
                      disabled={currentPage === 1}
                      type="button"
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Previous
                    </button>
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                      <button
                        key={number}
                        className={`w-8 h-8 rounded-full font-label-sm text-label-sm flex items-center justify-center ${number === currentPage ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"}`}
                        type="button"
                        onClick={() => setPage(number)}
                      >
                        {number}
                      </button>
                    ))}
                    <button
                      className={`px-space-md py-1.5 rounded-full font-label-sm text-label-sm ${currentPage === pageCount ? "bg-surface-container-low text-outline cursor-not-allowed" : "bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"}`}
                      disabled={currentPage === pageCount}
                      type="button"
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/40 py-space-lg">
        <div className="w-full px-margin-mobile md:px-margin-tablet xl:px-margin flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-on-surface font-medium">QuadreStudio</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">— Archival Admin Console</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">© 2025 QuadreStudio. Museum-grade generative atelier.</p>
        </div>
      </footer>
    </div>
  );
}

function FilterPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`px-space-md py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors ${active ? "bg-primary text-on-primary font-medium shadow-sm" : "bg-surface-container text-on-surface-variant hover:text-on-surface"}`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function TemplateCard({
  template,
  onToggle,
  onEdit,
  onDelete,
}: {
  template: StyleTemplate;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className={`group bg-surface-container-lowest rounded-DEFAULT p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${template.isActive ? "" : "opacity-85 hover:opacity-100"}`}>
      <div>
        <div className="relative aspect-square w-full rounded-DEFAULT overflow-hidden bg-surface-container mb-3 shadow-inner">
          <img
            alt=""
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${template.isActive ? "" : "grayscale-[30%] group-hover:grayscale-0"}`}
            src={template.imageUrl}
          />
          <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm ${template.isActive ? "bg-surface-container-lowest/90" : "bg-surface-container-high/90"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${template.isActive ? "bg-secondary" : "bg-outline"}`} />
            <span className={`font-label-sm text-label-sm font-medium uppercase tracking-wider ${template.isActive ? "text-on-surface" : "text-on-surface-variant"}`}>
              {template.isActive ? "Active" : "Hidden"}
            </span>
          </div>
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-md text-on-primary font-label-sm text-label-sm">{template.cfgLabel}</div>
        </div>
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">{template.title}</h3>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{template.ref}</span>
        </div>
        <div className="flex items-center gap-space-xs text-on-surface-variant">
          <span className="px-2 py-0.5 rounded-full bg-surface-container-low font-label-sm text-label-sm">{template.categoryLabel}</span>
          <span className="font-label-sm text-label-sm">• {template.generationLabel}</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 mt-3 bg-surface-container-low/50 -mx-3.5 -mb-3.5 p-3.5 rounded-b-DEFAULT">
        <button
          aria-checked={template.isActive}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${template.isActive ? "bg-primary" : "bg-surface-container-highest"}`}
          role="switch"
          title="Toggle Active Status"
          type="button"
          onClick={onToggle}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${template.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
        <div className="flex items-center gap-space-xs">
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors" title="Edit Template" type="button" onClick={onEdit}>
            <span className="material-symbols-outlined text-[17px]">edit</span>
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-error-container text-error transition-colors" title="Delete Template" type="button" onClick={onDelete}>
            <span className="material-symbols-outlined text-[17px]">delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
