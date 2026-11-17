import { supabase } from "./supabase";

export type PrivateBucket = "originals" | "styles" | "outputs";

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadPrivateImage(bucket: PrivateBucket, file: File) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;
  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data, error: signError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signError || !data?.signedUrl) throw new Error(signError?.message ?? "Could not open the uploaded image.");
  return data.signedUrl;
}

export async function uploadTemplateImage(dataUrl: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const path = `registry/${crypto.randomUUID()}.${extensionFor(blob.type)}`;
  const { error } = await supabase.storage.from("templates").upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("templates").getPublicUrl(path);
  return data.publicUrl;
}
