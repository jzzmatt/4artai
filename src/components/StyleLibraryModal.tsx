import { useState } from "react";
import { useStudio } from "../state/StudioProvider";
import { imageFileError } from "../utils/files";

export function StyleLibraryModal() {
  const { styleLibraryOpen, setStyleLibraryOpen, activeTemplates, styleTemplate, setStyleTemplate, addCustomStyle, registryError } =
    useStudio();
  const [tab, setTab] = useState<"curated" | "upload">("curated");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!styleLibraryOpen) return null;

  const close = () => {
    setStyleLibraryOpen(false);
    setError(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const message = imageFileError(file);
    if (message) {
      setError(message);
      return;
    }
    try {
      await addCustomStyle(file);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not use that style image.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-primary/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-margin-mobile">
      <div
        className="w-full max-w-4xl max-h-[88vh] overflow-hidden bg-surface-container-lowest rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.16)] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-library-title"
      >
        <div className="flex items-start justify-between gap-space-sm p-space-lg pb-space-md">
          <div>
            <h2 id="style-library-title" className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Style Library
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Curated templates from the admin registry, or a custom reference.
            </p>
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface transition-colors"
            type="button"
            onClick={close}
            aria-label="Close style library"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="px-space-lg flex items-center gap-space-xs">
          <button
            className={`px-space-md py-1 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap shadow-sm ${tab === "curated" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
            type="button"
            onClick={() => setTab("curated")}
          >
            Curated Templates ({activeTemplates.length})
          </button>
          <button
            className={`px-space-md py-1 rounded-full font-label-sm text-label-sm whitespace-nowrap ${tab === "upload" ? "bg-primary text-on-primary shadow-sm font-medium" : "bg-surface-container text-on-surface-variant"}`}
            type="button"
            onClick={() => setTab("upload")}
          >
            Upload Custom Style
          </button>
        </div>
        <div className="overflow-y-auto p-space-lg">
          {tab === "curated" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeTemplates.map((template) => {
                const selected = template.id === styleTemplate.id;
                return (
                  <button
                    key={template.id}
                    className={`group text-left bg-surface-container-low rounded-DEFAULT p-3.5 shadow-sm hover:shadow-md transition-all ${selected ? "ring-2 ring-primary" : ""}`}
                    type="button"
                    onClick={() => {
                      setStyleTemplate(template);
                      close();
                    }}
                  >
                    <div className="relative aspect-square w-full rounded-DEFAULT overflow-hidden bg-surface-container mb-3 shadow-inner">
                      <img alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={template.imageUrl} />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">{template.title}</h3>
                    <span className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-on-surface-variant">
                      {template.categoryLabel}
                    </span>
                  </button>
                );
              })}
              {activeTemplates.length === 0 ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {registryError ?? "No active curated templates yet. Publish one from the admin registry."}
                </p>
              ) : null}
            </div>
          ) : (
            <div
              className={`group relative flex flex-col items-center justify-center p-space-lg rounded-DEFAULT text-center ${dragOver ? "bg-surface-container-high" : "bg-surface-container-low hover:bg-surface-container"} transition-all cursor-pointer`}
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
                void onFile(event.dataTransfer.files?.[0]);
              }}
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface group-hover:scale-105 transition-transform shadow-sm mb-space-sm">
                <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
              </div>
              <p className="font-headline-sm text-headline-sm text-on-surface font-medium text-sm">Drop reference artwork here or browse</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">JPG, PNG, WEBP up to 25MB • 1:1 Recommended</p>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="absolute inset-0 opacity-0 cursor-pointer"
                type="file"
                onChange={(event) => {
                  void onFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
          )}
          {error ? <p className="mt-space-sm font-label-sm text-label-sm text-error">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
