import { useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_STYLE, LOGO_URL } from "../data/templates";
import { useAuth } from "../state/AuthProvider";
import { useStudio } from "../state/StudioProvider";
import type { FrameFinish, PanelSpacing } from "../types";
import { imageFileError } from "../utils/files";
import { InstallAppButton } from "./InstallAppButton";
import { ProfileMenu } from "./ProfileMenu";
import { StyleLibraryModal } from "./StyleLibraryModal";
import { WebcamModal } from "./WebcamModal";

const FINISHES: { id: FrameFinish; title: string; className: string; mark: "check" | "empty" | "frameless" }[] = [
  { id: "matte-black", title: "Matte Obsidian", className: "bg-black", mark: "check" },
  { id: "natural-oak", title: "Natural Oak", className: "bg-[#C19A6B]", mark: "empty" },
  { id: "gallery-white", title: "Gallery White", className: "bg-surface-container-lowest shadow", mark: "empty" },
  { id: "frameless", title: "Frameless Glass", className: "bg-surface-variant", mark: "frameless" },
];

function frameShell(finish: FrameFinish, hero: boolean) {
  const pad = finish === "frameless" ? "p-0" : "p-3 sm:p-4";
  const background =
    finish === "matte-black" ? "bg-[#18181B]" : finish === "natural-oak" ? "bg-[#C19A6B]" : finish === "frameless" ? "bg-transparent" : "bg-surface-container-lowest";
  const shadow =
    finish === "frameless"
      ? "shadow-none"
      : hero
        ? "shadow-[0_16px_36px_-6px_rgba(43,89,195,0.22),0_6px_16px_-4px_rgba(0,0,0,0.1)] ring-1 ring-primary/10"
        : "shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12),0_4px_10px_-2px_rgba(0,0,0,0.06)]";
  return `w-full aspect-[3/4] ${background} rounded ${shadow} ${pad} flex flex-col relative group transition-transform duration-300 hover:scale-[1.01]`;
}

function spacingClass(spacing: PanelSpacing) {
  if (spacing === "tight") return "gap-2";
  if (spacing === "wide") return "gap-8";
  return "gap-4";
}

export function StudioScreen() {
  const studio = useStudio();
  const { session, credits } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const usingDefaultStyle = studio.styleTemplate.title === DEFAULT_STYLE.title;
  const creditLabel = session && credits !== null ? `${credits} Free Credits` : "5 Free Credits";

  const takeFile = async (file: File | undefined) => {
    if (!file) return;
    const message = imageFileError(file);
    if (message) {
      setUploadError(message);
      return;
    }
    try {
      await studio.setOriginalFile(file);
      setUploadError(null);
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : "Could not use that photo.");
    }
  };

  return (
    <div className="bg-surface-container-low text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-16 px-gutter-mobile flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            {logoFailed ? (
              <span className="flex items-center gap-0.5 p-1 shrink-0" aria-hidden="true">
                <span className="w-1 h-4 bg-primary rounded-[1px]" />
                <span className="w-1.5 h-5 bg-primary rounded-[1px]" />
                <span className="w-1 h-4 bg-primary rounded-[1px]" />
              </span>
            ) : (
              <img
                alt="QuadreStudio Logo"
                className="h-8 w-auto object-contain shrink-0"
                src={LOGO_URL}
                onError={() => setLogoFailed(true)}
              />
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface truncate">QuadreStudio</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest truncate">Canvas Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs shrink-0">
            <div className="hidden sm:flex items-center bg-surface-container px-space-sm py-1 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <span className="font-label-sm text-label-sm text-on-surface font-medium whitespace-nowrap">{creditLabel}</span>
            </div>
            <InstallAppButton />
            <button
              className="min-h-[44px] min-w-[44px] px-space-sm rounded-full bg-surface-container text-on-surface flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors"
              type="button"
              onClick={() => studio.setStyleLibraryOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">palette</span>
              <span className="hidden md:inline font-label-md text-label-md">Style Library</span>
            </button>
            <button
              className="min-h-[44px] min-w-[44px] px-space-md rounded-full bg-primary text-on-primary flex items-center justify-center gap-1 hover:bg-neutral-800 transition-colors shadow-sm"
              type="button"
              onClick={() => void studio.exportQuadre()}
              disabled={studio.exportState === "working"}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="hidden md:inline font-label-md text-label-md">
                {studio.exportState === "working" ? "Exporting…" : "Export Quadre"}
              </span>
            </button>
            <ProfileMenu />
          </div>
        </div>
      </header>
      <main className={`flex-1 flex flex-col relative w-full pt-16 pb-24 min-h-screen ${studio.wallPreview ? "living-room-wall" : "bg-surface-container-low"}`}>
        <div className="flex flex-col w-full relative select-none">
          <div className="w-full relative px-margin-mobile sm:px-gutter pt-2 pb-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-space-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">Triptych Atelier • No. 04</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container shadow-sm">
                <span className="material-symbols-outlined text-[15px] text-on-surface">filter_hdr</span>
                <span className="font-label-sm text-label-sm text-on-surface font-medium">
                  {usingDefaultStyle ? "Picasso × Gris" : studio.styleTemplate.title}
                </span>
              </div>
            </div>
            <div className={`w-full overflow-x-auto pb-4 pt-2 -mx-margin-mobile px-margin-mobile sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-3 snap-x snap-mandatory scroll-smooth items-stretch ${spacingClass(studio.spacing)}`}>
              <div className="shrink-0 w-[78vw] sm:w-auto snap-center flex flex-col items-center">
                <div
                  className={frameShell(studio.frameFinish, false)}
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
                    void takeFile(event.dataTransfer.files?.[0]);
                  }}
                >
                  <div className={`w-full h-full rounded-sm flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner ${dragOver ? "bg-surface-container-high" : studio.museumMat ? "bg-surface-container-low" : "bg-surface-container-lowest"} ${studio.museumMat ? "p-4 sm:p-5" : "p-0"}`}>
                    {studio.museumMat ? (
                      <>
                        <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-outline-variant/40" />
                        <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-outline-variant/40" />
                        <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-outline-variant/40" />
                        <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-outline-variant/40" />
                      </>
                    ) : null}
                    {studio.originalUrl ? (
                      <>
                        <img alt="Source portrait" className={`absolute w-full h-full object-cover rounded-sm ${studio.museumMat ? "inset-4 sm:inset-5" : "inset-0"}`} src={studio.originalUrl} />
                        <div className="absolute bottom-3 left-3 right-3 flex gap-2 z-10">
                          <label className="bg-surface/90 hover:bg-surface text-on-surface backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[15px]">file_upload</span>
                            <span className="font-label-sm text-label-sm font-semibold tracking-wider">Replace</span>
                            <input
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              type="file"
                              onChange={(event) => {
                                void takeFile(event.target.files?.[0]);
                                event.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-[28px] text-on-surface">add_photo_alternate</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Source Portrait</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[180px] mb-4">Upload a high-res portrait or sketch to infuse with cubist structure</p>
                        <div className="flex flex-col gap-2 w-full max-w-[170px]">
                          <label className="w-full h-10 px-3 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                            <span className="material-symbols-outlined text-[16px]">file_upload</span>
                            <span>Upload Photo</span>
                            <input
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              type="file"
                              onChange={(event) => {
                                void takeFile(event.target.files?.[0]);
                                event.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            className="w-full h-9 px-3 rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-container-high active:scale-95 transition-all"
                            type="button"
                            onClick={() => studio.setWebcamOpen(true)}
                          >
                            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                            <span>Use Webcam</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="font-label-sm text-label-sm tracking-widest text-on-surface font-medium uppercase">01. ORIGINAL</p>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{studio.originalUrl ? studio.originalName : "Awaiting Subject"}</span>
                </div>
              </div>
              <div className="shrink-0 w-[78vw] sm:w-auto snap-center flex flex-col items-center">
                <div className={frameShell(studio.frameFinish, true)}>
                  <div className="w-full h-full bg-surface-container-lowest rounded-sm overflow-hidden relative shadow-inner">
                    <img
                      alt="Synthesized Cubist Portrait Masterpiece"
                      className="w-full h-full object-cover rounded-sm filter brightness-[1.01] contrast-[1.03]"
                      src={studio.fusionUrl}
                    />
                    {studio.fusionState === "working" ? <div className="absolute inset-0 bg-surface-container/80 animate-pulse" /> : null}
                    <div className="absolute top-2.5 right-2.5 bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 text-on-surface">
                      <span className="material-symbols-outlined text-[13px] text-tertiary-container animate-spin" style={{ animationDuration: "6s" }}>auto_fix_high</span>
                      <span className="font-label-sm text-label-sm font-semibold tracking-wider">AI FUSION</span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 bg-surface/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-on-surface font-mono tracking-tighter opacity-80">
                      4096 × 5464 px • 300DPI
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="font-label-sm text-label-sm tracking-widest text-on-surface font-semibold uppercase flex items-center justify-center gap-1">
                    02. AI FUSION
                    <span className="material-symbols-outlined text-[14px] text-tertiary-container">verified</span>
                  </p>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Synthesized Cubist Visage</span>
                </div>
              </div>
              <div className="shrink-0 w-[78vw] sm:w-auto snap-center flex flex-col items-center">
                <div className={frameShell(studio.frameFinish, false)}>
                  <div className="w-full h-full bg-surface-container-lowest rounded-sm overflow-hidden relative shadow-inner">
                    <img
                      alt="Style reference"
                      className="w-full h-full object-cover rounded-sm filter brightness-[1.01]"
                      src={studio.styleTemplate.imageUrl}
                    />
                    <button
                      className="absolute bottom-3 right-3 bg-surface/90 hover:bg-surface text-on-surface backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                      type="button"
                      onClick={() => studio.setStyleLibraryOpen(true)}
                    >
                      <span className="material-symbols-outlined text-[15px]">style</span>
                      <span className="font-label-sm text-label-sm font-semibold tracking-wider">Change Style</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="font-label-sm text-label-sm tracking-widest text-on-surface font-medium uppercase">03. STYLE REFERENCE</p>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{studio.styleTemplate.title}</span>
                </div>
              </div>
            </div>
            <div className="flex sm:hidden items-center justify-center gap-1.5 mt-1 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40" />
              <div className="w-4 h-1.5 rounded-full bg-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40" />
            </div>
            <div className="w-full flex flex-col items-center mt-3 mb-6">
              <button
                className="group relative px-8 py-3.5 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center gap-2.5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_40px_-2px_rgba(43,89,195,0.4)] active:scale-95 transition-all"
                type="button"
                onClick={() => void studio.requestFusion()}
                disabled={studio.fusionState === "working"}
              >
                <span className="material-symbols-outlined text-[22px] text-tertiary-fixed animate-pulse">auto_awesome</span>
                <span>{studio.fusionState === "working" ? "Generating…" : "Generate Fusion"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-highest/20 font-label-sm text-surface">1 Token</span>
              </button>
              {studio.fusionNote ? <p className="mt-3 max-w-md text-center font-label-sm text-label-sm text-on-surface-variant">{studio.fusionNote}</p> : null}
              {uploadError ? <p className="mt-2 font-label-sm text-label-sm text-error">{uploadError}</p> : null}
              {studio.exportError ? <p className="mt-2 font-label-sm text-label-sm text-error">{studio.exportError}</p> : null}
            </div>
            <div className="w-full max-w-xl mx-auto rounded-3xl bg-surface/85 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-3 sm:p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">Exhibition Finish & Mat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chair</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Wall Preview</span>
                  <button
                    aria-pressed={studio.wallPreview}
                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer flex items-center px-0.5 ${studio.wallPreview ? "bg-primary" : "bg-surface-variant"}`}
                    type="button"
                    onClick={() => studio.setWallPreview(!studio.wallPreview)}
                  >
                    <span className={`w-4 h-4 rounded-full bg-on-primary shadow-sm transform transition-transform ${studio.wallPreview ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Frame Material</span>
                  <div className="flex items-center gap-2">
                    {FINISHES.map((finish) => {
                      const selected = studio.frameFinish === finish.id;
                      return (
                        <button
                          key={finish.id}
                          className={`w-6 h-6 rounded-full ${finish.className} shadow-inner transition-transform hover:scale-110 flex items-center justify-center ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
                          title={finish.title}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => studio.setFrameFinish(finish.id)}
                        >
                          {finish.mark === "frameless" ? <span className="text-[10px] font-mono text-on-surface-variant">Ø</span> : null}
                          {selected && finish.mark !== "frameless" ? (
                            <span className={`material-symbols-outlined text-[13px] ${finish.id === "gallery-white" || finish.id === "natural-oak" ? "text-primary" : "text-white"}`}>check</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Mat Board</span>
                  <div className="flex items-center justify-between bg-surface-container px-2.5 py-1 rounded-full">
                    <span className="font-label-sm text-label-sm text-on-surface font-medium">Museum Mat</span>
                    <button
                      aria-pressed={studio.museumMat}
                      className={`w-7 h-4 rounded-full relative transition-colors cursor-pointer flex items-center px-0.5 ${studio.museumMat ? "bg-primary" : "bg-surface-variant"}`}
                      type="button"
                      onClick={() => studio.setMuseumMat(!studio.museumMat)}
                    >
                      <span className={`w-3 h-3 rounded-full bg-on-primary shadow-sm transform transition-transform ${studio.museumMat ? "translate-x-3" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Gallery Spacing</span>
                  <div className="grid grid-cols-3 bg-surface-container p-0.5 rounded-full text-center">
                    {(["tight", "gallery", "wide"] as PanelSpacing[]).map((value) => {
                      const selected = studio.spacing === value;
                      const label = value === "tight" ? "Tight" : value === "gallery" ? "Gallery" : "Wide";
                      return (
                        <button
                          key={value}
                          className={`py-1 rounded-full font-label-sm text-label-sm ${selected ? "bg-surface-container-lowest shadow-sm text-on-surface font-semibold" : "text-on-surface-variant hover:text-on-surface"}`}
                          type="button"
                          onClick={() => studio.setSpacing(value)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-16 px-space-sm max-w-lg mx-auto">
          <Link aria-current="page" className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors text-primary font-medium" to="/">
            <span className="material-symbols-outlined text-[20px]">draw</span>
            <span className="font-label-sm text-label-sm">Canvas</span>
          </Link>
          <button
            className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
            type="button"
            onClick={() => studio.setStyleLibraryOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span className="font-label-sm text-label-sm">Styles</span>
          </button>
          <span className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">museum</span>
            <span className="font-label-sm text-label-sm">Gallery</span>
          </span>
          <span className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">folder_special</span>
            <span className="font-label-sm text-label-sm">Archive</span>
          </span>
        </div>
      </nav>
      <StyleLibraryModal />
      <WebcamModal />
    </div>
  );
}
