const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 25 * 1024 * 1024;

export function imageFileError(file: File) {
  if (!ACCEPTED.has(file.type)) return "Use a JPG, PNG, or WEBP image.";
  if (file.size > MAX_BYTES) return "Image must be 25MB or smaller.";
  return null;
}

export function readImageFile(file: File) {
  const error = imageFileError(file);
  if (error) return Promise.reject(new Error(error));
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

export function nextTemplateRef(existing: string[]) {
  const numbers = existing
    .map((ref) => Number(ref.replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value));
  const next = Math.max(100, ...numbers) + 1;
  return `REF-${String(next).padStart(3, "0")}`;
}

export function formatGenerations(count: number) {
  if (count >= 1000) {
    const value = count / 1000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}k gens`;
  }
  return `${count} gens`;
}
