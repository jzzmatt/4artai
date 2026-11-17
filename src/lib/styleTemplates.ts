import { categoryLabel } from "../data/templates";
import type { StyleTemplate } from "../types";

export interface StyleTemplateRow {
  id: string;
  title: string;
  category: string;
  image_url: string;
  prompt_instruction: string;
  is_active: boolean;
}

export function mapStyleTemplate(row: StyleTemplateRow): StyleTemplate {
  return {
    id: row.id,
    ref: `REF-${row.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    title: row.title,
    category: row.category,
    categoryLabel: categoryLabel(row.category),
    imageUrl: row.image_url,
    promptInstruction: row.prompt_instruction,
    isActive: row.is_active,
    generations: null,
    generationLabel: row.is_active ? "Live" : "Archived",
    cfgLabel: "1:1 • Registry",
    source: "registry",
  };
}
