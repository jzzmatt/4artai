import type { StyleTemplate } from "../types";

export const CATEGORIES = [
  { id: "cubism", label: "Cubism" },
  { id: "afrofuturism", label: "Afrofuturism" },
  { id: "bauhaus", label: "Bauhaus" },
  { id: "impasto", label: "Impasto" },
  { id: "neo-expressionism", label: "Neo-Expressionism" },
  { id: "abstract", label: "Abstract" },
] as const;

export const DEFAULT_STYLE: StyleTemplate = {
  id: "synthetic-cubism-12",
  ref: "REF-012",
  title: "Synthetic Cubism No. 12",
  category: "cubism",
  categoryLabel: "Cubism",
  imageUrl: "/stitch/style-cubism.jpg",
  promptInstruction:
    "Cubist guitar and still-life archetype. Fracture the subject into overlapping transparent planes, charcoal contour, and muted ochre, slate, and cream.",
  isActive: true,
  generations: null,
  generationLabel: "Studio default",
  cfgLabel: "1:1 • CFG 8.0",
  source: "preset",
};

export const PRESET_TEMPLATES: StyleTemplate[] = [
  {
    id: "african-cubism",
    ref: "REF-091",
    title: "African Cubism",
    category: "cubism",
    categoryLabel: "Cubism",
    imageUrl: "/stitch/african-cubism.jpg",
    promptInstruction:
      "Editorial museum lighting cubist geometric portrait composed of segmented terracotta, deep cerulean blue, and polished bronze facets. Sharp architectural angular edges with raw textured oil paint impasto on linen ground.",
    isActive: true,
    generations: 4800,
    generationLabel: "4.8k gens",
    cfgLabel: "1:1 • CFG 8.2",
    source: "preset",
  },
  {
    id: "bauhaus-portrait",
    ref: "REF-042",
    title: "Bauhaus Portrait",
    category: "bauhaus",
    categoryLabel: "Bauhaus",
    imageUrl: "/stitch/bauhaus-portrait.jpg",
    promptInstruction:
      "High modernist Bauhaus portrait composed of pure geometric primaries: cadmium red circle, ultramarine square, and chrome yellow diagonal beam intersecting a sculpted off-white profile. Clean lithograph texture on archival newsprint.",
    isActive: true,
    generations: 3200,
    generationLabel: "3.2k gens",
    cfgLabel: "1:1 • CFG 7.5",
    source: "preset",
  },
  {
    id: "golden-impasto",
    ref: "REF-078",
    title: "Golden Impasto",
    category: "impasto",
    categoryLabel: "Impasto",
    imageUrl: "/stitch/golden-impasto.jpg",
    promptInstruction:
      "Extreme close-up macro portrait in heavy golden impasto oil paint. Luscious sculptural palette knife strokes with raw burnt umber shadows, metallic leaf flecks, and deep varnished specular reflections.",
    isActive: true,
    generations: 6100,
    generationLabel: "6.1k gens",
    cfgLabel: "1:1 • CFG 9.0",
    source: "preset",
  },
  {
    id: "neo-expressionism",
    ref: "REF-015",
    title: "Neo-Expressionism",
    category: "neo-expressionism",
    categoryLabel: "Expressionism",
    imageUrl: "/stitch/neo-expressionism.jpg",
    promptInstruction:
      "Raw Neo-Expressionist portrait painting with feverish charcoal contours, bold crimson slashes, primitive mask motifs, and spontaneous chalk scribbles across a distressed concrete background.",
    isActive: true,
    generations: 1900,
    generationLabel: "1.9k gens",
    cfgLabel: "1:1 • CFG 8.8",
    source: "preset",
  },
  {
    id: "stained-glass",
    ref: "REF-063",
    title: "Stained Glass",
    category: "abstract",
    categoryLabel: "Abstract",
    imageUrl: "/stitch/stained-glass.jpg",
    promptInstruction:
      "Luminescent cathedral stained glass abstract figure with thick dark leaded cames enclosing jewel-tone emerald, cobalt, and amber glass segments. Soft diffused god-rays scattering spectral refractions.",
    isActive: false,
    generations: null,
    generationLabel: "Archived",
    cfgLabel: "1:1 • CFG 7.0",
    source: "preset",
  },
  {
    id: "afro-pop",
    ref: "REF-087",
    title: "Afro-Pop Geometry",
    category: "afrofuturism",
    categoryLabel: "Afrofuturism",
    imageUrl: "/stitch/afro-pop.jpg",
    promptInstruction:
      "Afrofuturistic portrait radiating high-contrast geometric neon patterns, Ankara textile vector details, polished obsidian skin highlights, and floating gold holographic rings against deep space black.",
    isActive: true,
    generations: 5400,
    generationLabel: "5.4k gens",
    cfgLabel: "1:1 • CFG 8.4",
    source: "preset",
  },
];

export const FUSION_PLACEHOLDER = "/stitch/fusion.jpg";

export const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/ALJJyrAAnd1oPm35wP0y0JdirhSah0A0oQUNLcGrYl_mX_SGlCtMG4G1piTS1fuRNAU5OD87XBuT0x5NRXAjUFXquhleW8lSMETxXwYT_XdWzYL_xGGtsUUA5qGIhrGifVsaW29tQ6BD4_4ALUxXW6wSGxzj4-cfb2g0JrkYZyGXyR2xDfRWZwp7NqieOnI11x9mqtUfgjnQSXgLLNjWBpcM0E72QhfdHQGnZkQ10L2I8QL-";

export function categoryLabel(id: string) {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
