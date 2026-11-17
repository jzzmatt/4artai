import { supabase } from "./supabase";

export interface SavedFusion {
  id: string;
  title: string;
  createdAt: string;
  imageUrl: string;
}

interface QuadreRow {
  id: string;
  title: string | null;
  fusion_url: string | null;
  created_at: string;
}

function outputPath(value: string) {
  if (!value.startsWith("http")) return value.replace(/^outputs\//, "");
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/outputs\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function openOutput(value: string) {
  const path = outputPath(value);
  if (!path) return value;
  const { data, error } = await supabase.storage.from("outputs").createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return value.startsWith("http") ? value : "";
  return data.signedUrl;
}

export async function listSavedFusions() {
  const { data, error } = await supabase
    .from("quadres")
    .select("id, title, fusion_url, created_at")
    .eq("is_saved", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as QuadreRow[];
  const items = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      title: row.title?.trim() || "Saved fusion",
      createdAt: row.created_at,
      imageUrl: row.fusion_url ? await openOutput(row.fusion_url) : "",
    })),
  );
  return items.filter((item) => item.imageUrl);
}

export async function saveFusionRecord(id: string, title: string) {
  const { error } = await supabase.from("quadres").update({ is_saved: true, title }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function hideFusionRecord(id: string) {
  const { error } = await supabase.from("quadres").update({ is_saved: false }).eq("id", id);
  if (error) throw new Error(error.message);
}
