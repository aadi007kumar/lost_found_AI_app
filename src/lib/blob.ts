import "server-only";
import { put } from "@vercel/blob";

const MAX_BYTES = 3.5 * 1024 * 1024;

/** Uploads one photo to Vercel Blob and returns its public URL. */
export async function uploadPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please upload an image file.");
  if (file.size > MAX_BYTES) throw new Error("Photo is too large (max 3.5 MB).");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`items/photo.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}
