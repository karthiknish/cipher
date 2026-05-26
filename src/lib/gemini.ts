import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Model configurations — see https://ai.google.dev/gemini-api/docs/image-generation
export const MODELS = {
  /** Gemini 2.5 Flash Image — legacy fast tier */
  NANO_BANANA: "gemini-2.5-flash-image",
  /** Gemini 3.1 Flash Image Preview (Nano Banana 2) — default for try-on: fast + strong editing */
  NANO_BANANA_2: "gemini-3.1-flash-image-preview",
  /** Gemini 3 Pro Image Preview (Nano Banana Pro) — highest fidelity, slower */
  NANO_BANANA_PRO: "gemini-3-pro-image-preview",
} as const;

/** Default image model for virtual try-on (speed + quality balance) */
export const TRY_ON_MODEL = MODELS.NANO_BANANA_2;

export type GeminiModel = (typeof MODELS)[keyof typeof MODELS];

export type ImageAspectRatio =
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9";

export type ImageResolution = "1K" | "2K" | "4K";

export interface TryOnImageRequest {
  prompt: string;
  userImageBase64: string;
  productImageBase64: string;
  model?: GeminiModel;
  aspectRatio?: ImageAspectRatio;
  resolution?: ImageResolution;
}

export interface TryOnResponse {
  success: boolean;
  imageBase64?: string;
  error?: string;
  model?: string;
  text?: string;
}

function stripDataUrlPrefix(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}

function mimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/\w+);base64,/);
  return match?.[1] ?? "image/jpeg";
}

function extractGeneratedImage(
  parts: Array<{ text?: string; inlineData?: { data?: string; mimeType?: string } }> | undefined,
  model: string
): TryOnResponse {
  if (!parts?.length) {
    return { success: false, error: "No response generated from the model" };
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        success: true,
        imageBase64: `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`,
        model,
      };
    }
  }

  const text = parts.find((p) => p.text)?.text;
  return {
    success: false,
    error: text ?? "No image was generated in the response",
    text,
  };
}

/**
 * Generate a virtual try-on image from a user photo, product photo, and garment-specific prompt.
 */
export async function generateTryOnImage(request: TryOnImageRequest): Promise<TryOnResponse> {
  const {
    prompt,
    userImageBase64,
    productImageBase64,
    model = TRY_ON_MODEL,
    aspectRatio = "3:4",
    resolution = "1K",
  } = request;

  try {
    const userMimeType = mimeTypeFromDataUrl(userImageBase64);
    const productMimeType = mimeTypeFromDataUrl(productImageBase64);

    const response = await genAI.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: stripDataUrlPrefix(userImageBase64),
                mimeType: userMimeType,
              },
            },
            {
              inlineData: {
                data: stripDataUrlPrefix(productImageBase64),
                mimeType: productMimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio,
          imageSize: resolution,
        },
      },
    });

    return extractGeneratedImage(response.candidates?.[0]?.content?.parts, model);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate try-on image",
    };
  }
}

export interface LegacyTryOnRequest {
  userImageBase64: string;
  productImageBase64: string;
  productName: string;
  productCategory: string;
  aspectRatio?: ImageAspectRatio;
  resolution?: ImageResolution;
  model?: GeminiModel;
}

/**
 * @deprecated Prefer generateTryOnImage with prompts from @/lib/tryon-prompts
 */
export async function generateVirtualTryOn(request: LegacyTryOnRequest): Promise<TryOnResponse> {
  const { userImageBase64, productImageBase64, productName, productCategory, aspectRatio, resolution, model } =
    request;

  const prompt = `You are a professional fashion AI. Create a photorealistic virtual try-on image.

TASK: Place the clothing item (${productName}, category: ${productCategory}) onto the person in the reference photo.

REQUIREMENTS:
1. Preserve the person's exact face, body proportions, pose, and skin tone
2. The ${productName} should fit naturally on the person's body
3. Maintain consistent lighting between the person and clothing
4. The final image should look like a real photograph, not a composite
5. Keep the background similar to the original user photo
6. Ensure the clothing drapes and folds realistically based on the pose

OUTPUT: A single, high-quality photorealistic image of the person wearing the ${productName}.`;

  return generateTryOnImage({
    prompt,
    userImageBase64,
    productImageBase64,
    aspectRatio,
    resolution,
    model,
  });
}

/**
 * Generate an image from a text prompt.
 */
export async function generateImage(
  prompt: string,
  model: GeminiModel = TRY_ON_MODEL
): Promise<TryOnResponse> {
  try {
    const response = await genAI.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    return extractGeneratedImage(response.candidates?.[0]?.content?.parts, model);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Image generation failed",
    };
  }
}

export { genAI };
