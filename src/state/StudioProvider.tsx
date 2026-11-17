import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_STYLE, FUSION_PLACEHOLDER, categoryLabel } from "../data/templates";
import { saveFusionRecord } from "../lib/library";
import { supabase } from "../lib/supabase";
import { uploadPrivateBlob, uploadPrivateImage, uploadTemplateImage } from "../lib/storage";
import { useAuth } from "./AuthProvider";
import { mapStyleTemplate, type StyleTemplateRow } from "../lib/styleTemplates";
import type { FrameFinish, PanelSpacing, StyleTemplate } from "../types";
import { downloadBlob, renderQuadre } from "../utils/canvasCompositor";
import { nextTemplateRef, readImageFile } from "../utils/files";

interface DraftTemplate {
  title: string;
  category: string;
  promptInstruction: string;
  imageUrl: string;
  isActive: boolean;
}

interface StudioContextValue {
  originalUrl: string | null;
  originalName: string | null;
  fusionUrl: string;
  styleTemplate: StyleTemplate;
  frameFinish: FrameFinish;
  museumMat: boolean;
  spacing: PanelSpacing;
  wallPreview: boolean;
  templates: StyleTemplate[];
  activeTemplates: StyleTemplate[];
  registryError: string | null;
  styleLibraryOpen: boolean;
  webcamOpen: boolean;
  fusionNote: string | null;
  fusionState: "idle" | "working";
  fusionSaved: boolean;
  fusionTitle: string;
  exportState: "idle" | "working" | "done" | "error";
  exportError: string | null;
  setOriginalFile: (file: File) => Promise<void>;
  setOriginalUrl: (url: string, name?: string) => void;
  setStyleTemplate: (template: StyleTemplate) => void;
  setFrameFinish: (finish: FrameFinish) => void;
  setMuseumMat: (value: boolean) => void;
  setSpacing: (value: PanelSpacing) => void;
  setWallPreview: (value: boolean) => void;
  setStyleLibraryOpen: (value: boolean) => void;
  setWebcamOpen: (value: boolean) => void;
  addCustomStyle: (file: File) => Promise<void>;
  saveTemplate: (draft: DraftTemplate, editingId?: string | null) => Promise<StyleTemplate>;
  updateTemplate: (id: string, patch: Partial<StyleTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  requestFusion: () => Promise<void>;
  saveFusion: () => Promise<void>;
  exportQuadre: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

const TEMPLATE_COLUMNS = "id, title, category, image_url, prompt_instruction, is_active";

function replaceTemplate(templates: StyleTemplate[], next: StyleTemplate) {
  return templates.map((template) => (template.id === next.id ? next : template));
}

function studioStorageUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.hostname === "supabase-picasso.wems.ao" && url.pathname.startsWith("/storage/v1/")) {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

async function functionError(error: unknown) {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (context?.json) {
      try {
        const body = await context.json();
        if (typeof body.error === "string" && body.error) return body.error;
      } catch {
        return "The fusion could not be generated.";
      }
    }
  }
  return error instanceof Error ? error.message : "The fusion could not be generated.";
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const { setCredits } = useAuth();
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrlState] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState<string | null>(null);
  const [originalRemoteUrl, setOriginalRemoteUrl] = useState<string | null>(null);
  const [styleRemoteUrl, setStyleRemoteUrl] = useState<string | null>(null);
  const [fusionUrl, setFusionUrl] = useState(FUSION_PLACEHOLDER);
  const [fusionState, setFusionState] = useState<"idle" | "working">("idle");
  const [fusionRecordId, setFusionRecordId] = useState<string | null>(null);
  const [fusionSaved, setFusionSaved] = useState(false);
  const fusionLock = useRef(false);
  const [styleTemplate, setStyleTemplate] = useState<StyleTemplate>(DEFAULT_STYLE);
  const [frameFinish, setFrameFinish] = useState<FrameFinish>("gallery-white");
  const [museumMat, setMuseumMat] = useState(true);
  const [spacing, setSpacing] = useState<PanelSpacing>("gallery");
  const [wallPreview, setWallPreview] = useState(false);
  const [styleLibraryOpen, setStyleLibraryOpen] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [fusionNote, setFusionNote] = useState<string | null>(null);
  const [exportState, setExportState] = useState<StudioContextValue["exportState"]>("idle");
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTemplates = async () => {
      const { data, error } = await supabase
        .from("style_templates")
        .select(TEMPLATE_COLUMNS)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        setRegistryError(error.message);
        return;
      }
      const rows = ((data ?? []) as StyleTemplateRow[]).map(mapStyleTemplate);
      setTemplates(rows);
      setRegistryError(null);
      setStyleTemplate((current) => {
        const match = rows.find((template) => template.id === current.id);
        if (match) return match;
        return rows.find((template) => template.title === DEFAULT_STYLE.title) ?? rows.find((template) => template.isActive) ?? current;
      });
    };

    void loadTemplates();
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        if (active) void loadTemplates();
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const activeTemplates = useMemo(() => templates.filter((template) => template.isActive), [templates]);

  const setOriginalUrl = (url: string, name = "Captured portrait") => {
    setOriginalUrlState(url);
    setOriginalName(name);
    setOriginalRemoteUrl(null);
    setFusionNote(null);
    if (!url.startsWith("data:")) return;
    void fetch(url)
      .then((response) => response.blob())
      .then((blob) => uploadPrivateBlob("originals", blob, "portrait"))
      .then((remote) => setOriginalRemoteUrl(remote))
      .catch((error: unknown) => {
        setOriginalRemoteUrl(null);
        setFusionNote(error instanceof Error ? error.message : "The portrait could not be stored.");
      });
  };

  const setOriginalFile = async (file: File) => {
    const url = await readImageFile(file);
    setOriginalUrlState(url);
    setOriginalName(file.name);
    setFusionNote(null);
    try {
      setOriginalRemoteUrl(await uploadPrivateImage("originals", file));
    } catch (error) {
      setOriginalRemoteUrl(null);
      setFusionNote(error instanceof Error ? error.message : "The portrait could not be stored.");
    }
  };

  const addCustomStyle = async (file: File) => {
    const imageUrl = await readImageFile(file);
    const template: StyleTemplate = {
      id: crypto.randomUUID(),
      ref: nextTemplateRef(templates.map((item) => item.ref)),
      title: file.name.replace(/\.[^.]+$/, "") || "Custom Style",
      category: "abstract",
      categoryLabel: "Custom",
      imageUrl,
      promptInstruction: "Custom uploaded style reference.",
      isActive: true,
      generations: 0,
      generationLabel: "Custom upload",
      cfgLabel: "1:1 • Custom",
      source: "custom",
    };
    setStyleTemplate(template);
    setStyleLibraryOpen(false);
    try {
      setStyleRemoteUrl(await uploadPrivateImage("styles", file));
    } catch (error) {
      setStyleRemoteUrl(null);
      setFusionNote(error instanceof Error ? error.message : "The style image could not be stored.");
    }
  };

  const saveTemplate = async (draft: DraftTemplate, editingId?: string | null) => {
    const payload = {
      title: draft.title.trim(),
      category: draft.category,
      image_url: draft.imageUrl.startsWith("data:") ? await uploadTemplateImage(draft.imageUrl) : draft.imageUrl,
      prompt_instruction: draft.promptInstruction.trim(),
      is_active: draft.isActive,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("style_templates")
        .update(payload)
        .eq("id", editingId)
        .select(TEMPLATE_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      const template = mapStyleTemplate(data as StyleTemplateRow);
      setTemplates((current) => replaceTemplate(current, template));
      setStyleTemplate((current) => (current.id === template.id ? template : current));
      setRegistryError(null);
      return template;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from("style_templates")
      .insert({ ...payload, created_by: sessionData.session?.user.id ?? null })
      .select(TEMPLATE_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    const template = mapStyleTemplate(data as StyleTemplateRow);
    setTemplates((current) => [template, ...current]);
    setRegistryError(null);
    return template;
  };

  const updateTemplate = async (id: string, patch: Partial<StyleTemplate>) => {
    const payload: Record<string, string | boolean> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.category !== undefined) payload.category = patch.category;
    if (patch.imageUrl !== undefined) payload.image_url = patch.imageUrl;
    if (patch.promptInstruction !== undefined) payload.prompt_instruction = patch.promptInstruction;
    if (patch.isActive !== undefined) payload.is_active = patch.isActive;
    const { data, error } = await supabase.from("style_templates").update(payload).eq("id", id).select(TEMPLATE_COLUMNS).single();
    if (error) {
      setRegistryError(error.message);
      return;
    }
    const template = mapStyleTemplate(data as StyleTemplateRow);
    if (patch.category) template.categoryLabel = categoryLabel(patch.category);
    setTemplates((current) => replaceTemplate(current, template));
    setStyleTemplate((current) => (current.id === template.id ? template : current));
    setRegistryError(null);
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("style_templates").delete().eq("id", id);
    if (error) {
      setRegistryError(error.message);
      return;
    }
    setTemplates((current) => current.filter((template) => template.id !== id));
    setStyleTemplate((current) => (current.id === id ? DEFAULT_STYLE : current));
    setRegistryError(null);
  };

  const selectStyle = (template: StyleTemplate) => {
    setStyleTemplate(template);
    if (template.source === "custom") return;
    setStyleRemoteUrl(template.imageUrl.startsWith("http") ? template.imageUrl : null);
  };

  const requestFusion = async () => {
    if (fusionLock.current) return;
    if (!originalUrl) {
      setFusionNote("Upload a source portrait before generating a fusion.");
      return;
    }
    fusionLock.current = true;
    setFusionState("working");
    setFusionNote(null);
    try {
      let original = studioStorageUrl(originalRemoteUrl);
      if (!original && originalUrl.startsWith("data:")) {
        original = await uploadPrivateBlob("originals", await (await fetch(originalUrl)).blob(), "portrait");
        setOriginalRemoteUrl(original);
      }
      if (!original) {
        setFusionNote("Sign in so the portrait can be stored, then generate the fusion.");
        return;
      }

      let style = studioStorageUrl(styleRemoteUrl) ?? studioStorageUrl(styleTemplate.imageUrl);
      if (!style) {
        const response = await fetch(styleTemplate.imageUrl);
        if (!response.ok) throw new Error("The style image could not be loaded.");
        style = await uploadPrivateBlob("styles", await response.blob(), "style");
        setStyleRemoteUrl(style);
      }
      if (!style) {
        setFusionNote("Sign in so the style can be stored, then generate the fusion.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-fusion", {
        body: {
          originalImageUrl: original,
          styleImageUrl: style,
          promptInstruction: styleTemplate.promptInstruction,
          title: styleTemplate.title,
          frameConfig: { frameFinish, museumMat, spacing, wallPreview },
        },
      });
      if (error) throw new Error(await functionError(error));
      const payload = data as { fusionUrl?: string; quadreId?: string; creditsRemaining?: number; error?: string };
      if (!payload.fusionUrl) throw new Error(payload.error || "The fusion did not return an image.");
      setFusionUrl(payload.fusionUrl);
      setFusionRecordId(payload.quadreId ?? null);
      setFusionSaved(false);
      if (typeof payload.creditsRemaining === "number") setCredits(payload.creditsRemaining);
    } catch (error) {
      setFusionNote(error instanceof Error ? error.message : "The fusion could not be generated.");
    } finally {
      fusionLock.current = false;
      setFusionState("idle");
    }
  };

  const saveFusion = async () => {
    if (!fusionRecordId) {
      setFusionNote("Generate a fusion before saving it.");
      return;
    }
    try {
      await saveFusionRecord(fusionRecordId, styleTemplate.title || "Studio fusion");
      setFusionSaved(true);
      setFusionNote("Saved to your library.");
    } catch (error) {
      setFusionNote(error instanceof Error ? error.message : "The fusion could not be saved.");
    }
  };

  const exportQuadre = async () => {
    setExportState("working");
    setExportError(null);
    try {
      const blob = await renderQuadre({
        originalUrl,
        fusionUrl,
        styleUrl: styleTemplate.imageUrl,
        frameFinish,
        museumMat,
        spacing,
        wallPreview,
        captions: ["01. Original", "02. AI Fusion", "03. Style Reference"],
      });
      downloadBlob(blob, "quadrestudio-triptych.png");
      setExportState("done");
    } catch (error) {
      setExportState("error");
      setExportError(error instanceof Error ? error.message : "Export failed.");
    }
  };

  const value: StudioContextValue = {
    originalUrl,
    originalName,
    fusionUrl,
    styleTemplate,
    frameFinish,
    museumMat,
    spacing,
    wallPreview,
    templates,
    activeTemplates,
    registryError,
    styleLibraryOpen,
    webcamOpen,
    fusionNote,
    fusionState,
    fusionSaved,
    fusionTitle: styleTemplate.title,
    exportState,
    exportError,
    setOriginalFile,
    setOriginalUrl,
    setStyleTemplate: selectStyle,
    setFrameFinish,
    setMuseumMat,
    setSpacing,
    setWallPreview,
    setStyleLibraryOpen,
    setWebcamOpen,
    addCustomStyle,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    requestFusion,
    saveFusion,
    exportQuadre,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used within StudioProvider");
  return context;
}
