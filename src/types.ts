export type FrameFinish = "gallery-white" | "matte-black" | "natural-oak" | "frameless";

export type PanelSpacing = "tight" | "gallery" | "wide";

export interface StyleTemplate {
  id: string;
  ref: string;
  title: string;
  category: string;
  categoryLabel: string;
  imageUrl: string;
  promptInstruction: string;
  isActive: boolean;
  generations: number | null;
  generationLabel: string;
  cfgLabel: string;
  source: "preset" | "custom" | "registry";
}

export interface QuadreExportInput {
  originalUrl: string | null;
  fusionUrl: string | null;
  styleUrl: string | null;
  frameFinish: FrameFinish;
  museumMat: boolean;
  spacing: PanelSpacing;
  wallPreview: boolean;
  captions: [string, string, string];
}
