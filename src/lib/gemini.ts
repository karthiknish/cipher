import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Model configurations
export const MODELS = {
  // Nano Banana - Fast, efficient for high-volume tasks
  NANO_BANANA: "gemini-2.5-flash-image",
  // Nano Banana Pro - Advanced reasoning, up to 4K, professional asset production
  NANO_BANANA_PRO: "gemini-3-pro-image-preview",
} as const;

export type GeminiModel = (typeof MODELS)[keyof typeof MODELS];

export interface TryOnRequest {
  userImageBase64: string;
  productImageBase64: string;
  productName: string;
  productCategory: string;
  aspectRatio?: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9";
  resolution?: "1K" | "2K" | "4K";
}

export interface TryOnResponse {
  success: boolean;
  imageBase64?: string;
  error?: string;
  model?: string;
}

/**
 * Generate a virtual try-on image using Gemini 3 Pro (Nano Banana Pro)
 * Uses advanced composition capabilities to place clothing on user photos
 */
export async function generateVirtualTryOn(request: TryOnRequest): Promise<TryOnResponse> {
  const {
    userImageBase64,
    productImageBase64,
    productName,
    productCategory,
    aspectRatio = "3:4",
    resolution = "2K",
  } = request;

  try {
    // Construct the prompt for virtual try-on
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

    // Convert base64 to proper format for Gemini
    const userImagePart = {
      inlineData: {
        data: userImageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg",
      },
    };

    const productImagePart = {
      inlineData: {
        data: productImageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg",
      },
    };

    const response = await genAI.models.generateContent({
      model: MODELS.NANO_BANANA_PRO,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            userImagePart,
            productImagePart,
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution,
        },
      },
    });

    // Extract the generated image from the response
    const result = response.candidates?.[0]?.content;
    if (!result?.parts) {
      return {
        success: false,
        error: "No response generated from the model",
      };
    }

    // Find the image part in the response
    for (const part of result.parts) {
      if (part.inlineData?.data) {
        return {
          success: true,
          imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          model: MODELS.NANO_BANANA_PRO,
        };
      }
    }

    return {
      success: false,
      error: "No image was generated in the response",
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate try-on image",
    };
  }
}

/**
 * Generate a simple image from text prompt using Nano Banana (faster)
 */
export async function generateImage(prompt: string): Promise<TryOnResponse> {
  try {
    const response = await genAI.models.generateContent({
      model: MODELS.NANO_BANANA,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    const result = response.candidates?.[0]?.content;
    if (!result?.parts) {
      return { success: false, error: "No response generated" };
    }

    for (const part of result.parts) {
      if (part.inlineData?.data) {
        return {
          success: true,
          imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          model: MODELS.NANO_BANANA,
        };
      }
    }

    return { success: false, error: "No image in response" };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Image generation failed",
    };
  }
}

export { genAI };
