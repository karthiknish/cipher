import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import {
  rateLimitedResponse,
  badRequestResponse,
  requireAuth,
  unauthorizedResponse,
  validateRequiredFields,
  validateRequestSize,
  parseJsonBody,
  internalServerErrorResponse,
  publicErrorMessage,
} from "@/lib/api-auth";
import { generateTryOnPrompt, detectGarmentType, detectGender, Gender } from "@/lib/tryon-prompts/index";
import { generateTryOnImage, TRY_ON_MODEL } from "@/lib/gemini";

// https://ai.google.dev/gemini-api/docs/image-generation
const MODEL = TRY_ON_MODEL;

// Maximum decoded image size (2MB)
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function isValidImageFormat(dataUrl: string): boolean {
  if (!dataUrl.startsWith("data:image/")) return false;
  if (dataUrl.startsWith("data:image/svg")) return false;
  const supportedFormats = ["data:image/jpeg", "data:image/png", "data:image/webp", "data:image/gif"];
  return supportedFormats.some((format) => dataUrl.startsWith(format));
}

function isPlaceholderImage(dataUrl: string): boolean {
  if (dataUrl.includes("placehold")) return true;
  if (dataUrl.startsWith("data:image/svg")) return true;
  if (dataUrl.includes("placeholder")) return true;
  return false;
}

function estimateDecodedBytes(base64DataUrl: string): number {
  return (base64DataUrl.length * 3) / 4;
}

function mapGeminiError(errorMessage: string): Response | null {
  if (errorMessage.includes("SAFETY") || errorMessage.includes("safety")) {
    return Response.json(
      {
        success: false,
        error:
          "The image could not be generated due to content guidelines. Please try a different photo with appropriate attire.",
      },
      { status: 400 }
    );
  }

  if (errorMessage.includes("RATE_LIMIT") || errorMessage.includes("429")) {
    return Response.json(
      { success: false, error: "Too many requests. Please wait 30 seconds and try again." },
      { status: 429 }
    );
  }

  if (errorMessage.includes("INVALID_ARGUMENT") || errorMessage.includes("400")) {
    return Response.json(
      { success: false, error: "Invalid image format. Please use a clear JPEG or PNG photo." },
      { status: 400 }
    );
  }

  if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403")) {
    return Response.json(
      { success: false, error: "API access denied. Please check your Gemini API key configuration." },
      { status: 403 }
    );
  }

  if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("404")) {
    return Response.json(
      { success: false, error: "Try-on is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  return null;
}

async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.TRY_ON);

    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    const authResult = await requireAuth(request);
    if (!authResult) {
      return unauthorizedResponse("Please sign in to use the virtual try-on feature");
    }

    const sizeError = await validateRequestSize(request, 8 * 1024 * 1024);
    if (sizeError) {
      return badRequestResponse(sizeError);
    }

    if (!process.env.GEMINI_API_KEY) {
      return internalServerErrorResponse("AI service not configured");
    }

    const parsed = await parseJsonBody<{
      userImage?: unknown;
      productImage?: unknown;
      productName?: unknown;
      productCategory?: unknown;
      colorVariant?: unknown;
      gender?: unknown;
      [key: string]: unknown;
    }>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const { userImage, productImage, productName, productCategory, colorVariant, gender } = body;

    const fieldError = validateRequiredFields(body, ["userImage", "productImage", "productName"]);
    if (fieldError) {
      return badRequestResponse(fieldError);
    }

    if (typeof userImage !== "string" || typeof productImage !== "string" || typeof productName !== "string") {
      return badRequestResponse("Invalid request payload");
    }

    const productCategoryStr = typeof productCategory === "string" ? productCategory : "";
    const colorVariantStr = typeof colorVariant === "string" ? colorVariant : undefined;
    const genderStr = typeof gender === "string" ? (gender as Gender) : undefined;

    if (estimateDecodedBytes(userImage) > MAX_IMAGE_SIZE) {
      return badRequestResponse("User image too large. Please use an image under 2MB.");
    }

    if (estimateDecodedBytes(productImage) > MAX_IMAGE_SIZE) {
      return badRequestResponse("Product image too large. Please use an image under 2MB.");
    }

    if (!isValidImageFormat(userImage)) {
      return Response.json(
        { success: false, error: "Invalid user photo format. Please upload a JPEG or PNG image." },
        { status: 400 }
      );
    }

    if (!isValidImageFormat(productImage) || isPlaceholderImage(productImage)) {
      return Response.json(
        {
          success: false,
          error:
            "This product doesn't have a valid image for virtual try-on. Please choose a product with a real photo (not a placeholder).",
        },
        { status: 400 }
      );
    }

    const detectedGender = genderStr || detectGender(productName, productCategoryStr);
    const prompt = generateTryOnPrompt(productName, productCategoryStr, colorVariantStr, detectedGender);
    const garmentType = detectGarmentType(productName, productCategoryStr);

    const result = await generateTryOnImage({
      prompt,
      userImageBase64: userImage,
      productImageBase64: productImage,
      model: MODEL,
      aspectRatio: "3:4",
      resolution: "1K",
    });

    if (!result.success || !result.imageBase64) {
      const mapped = result.error ? mapGeminiError(result.error) : null;
      if (mapped) return mapped;

      return Response.json(
        {
          success: false,
          error:
            result.error ??
            result.text ??
            "We couldn't create your look with this photo. Try a clearer full-body shot with good lighting.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      image: result.imageBase64,
      metadata: {
        productName,
        productCategory,
        colorVariant,
        garmentType,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Virtual Try-On API Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const mapped = mapGeminiError(errorMessage);
    if (mapped) return mapped;

    return Response.json(
      { success: false, error: publicErrorMessage(error, "Generation failed") },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute("/api/try-on")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
