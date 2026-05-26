import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { authClient } from "./auth-client";

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

async function withAuth(client: ConvexHttpClient): Promise<void> {
  const session = await authClient.getSession();
  const token = session.data?.session?.token;
  if (!token) {
    throw new Error("Please sign in to upload files.");
  }
  client.setAuth(token);
}

/** Upload any file to Convex storage. */
export async function uploadFile(file: File, path: string): Promise<string> {
  return uploadImage(file, path);
}

/**
 * Upload an image to Convex storage.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  void path;
  const client = getConvexClient();
  await withAuth(client);

  const uploadUrl = await client.mutation(api.files.generateUploadUrl, {});
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!result.ok) {
    throw new Error(`Upload failed (${result.status})`);
  }

  const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
  const url = await client.mutation(api.files.getUrlFromStorage, { storageId });
  if (!url) {
    throw new Error("Upload succeeded but URL was not available yet. Try again.");
  }
  return url;
}

/**
 * Upload a base64 image to Convex storage.
 */
export async function uploadBase64Image(
  base64Data: string,
  path: string
): Promise<string> {
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image data");
  }

  const contentType = matches[1];
  const base64 = matches[2];
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: contentType });
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const file = new File([blob], `upload.${ext}`, { type: contentType });

  return uploadImage(file, path);
}

function parseStorageIdFromUrl(url: string): Id<"_storage"> | null {
  const match = url.match(/\/api\/storage\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) {
    return match[1] as Id<"_storage">;
  }
  return null;
}

/**
 * Delete a file from Convex storage when possible.
 */
export async function deleteImage(url: string): Promise<void> {
  const storageId = parseStorageIdFromUrl(url);
  if (!storageId) {
    return;
  }

  try {
    const client = getConvexClient();
    await withAuth(client);
    await client.mutation(api.files.deleteByStorageId, { storageId });
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}

export function isBase64Image(str: string): boolean {
  return str?.startsWith("data:image");
}

export function generateImagePath(folder: string, originalName?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName?.split(".").pop() || "jpg";
  return `${folder}/${timestamp}-${random}.${extension}`;
}
