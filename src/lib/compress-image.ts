const DEFAULT_MAX_DIMENSION = 1536;
const DEFAULT_MAX_BYTES = 1.8 * 1024 * 1024; // Stay under API 2MB limit after base64 overhead
const DEFAULT_QUALITY = 0.85;

/**
 * Resize and compress a data-URL image for virtual try-on uploads.
 * Keeps aspect ratio and targets JPEG output under the API size limit.
 */
export async function compressImageForTryOn(
  dataUrl: string,
  maxDimension = DEFAULT_MAX_DIMENSION,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<string> {
  const img = await loadImage(dataUrl);
  const { width, height } = fitWithinBox(img.width, img.height, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image for upload");

  ctx.drawImage(img, 0, 0, width, height);

  let quality = DEFAULT_QUALITY;
  let result = canvas.toDataURL("image/jpeg", quality);

  while (estimateBase64Bytes(result) > maxBytes && quality > 0.5) {
    quality -= 0.1;
    result = canvas.toDataURL("image/jpeg", quality);
  }

  if (estimateBase64Bytes(result) > maxBytes) {
    throw new Error("Image is too large. Please use a smaller photo (under 2MB).");
  }

  return result;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

function fitWithinBox(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function estimateBase64Bytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return (base64.length * 3) / 4;
}
