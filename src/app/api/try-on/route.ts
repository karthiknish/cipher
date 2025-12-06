import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse, badRequestResponse, requireAuth, unauthorizedResponse, validateRequiredFields } from "@/lib/api-auth";
import { generateTryOnPrompt, detectGarmentType, detectGender, Gender } from "@/lib/tryon-prompts/index";

// Initialize the Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Nano Banana Pro model for advanced image generation
const MODEL = "gemini-2.0-flash-exp-image-generation";

// Maximum image size (2MB)
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - try-on is expensive, so stricter limits
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.TRY_ON);
    
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    // Require authentication for try-on (costs money)
    const authResult = await requireAuth(request);
    if (!authResult) {
      return unauthorizedResponse("Please sign in to use the virtual try-on feature");
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userImage, productImage, productName, productCategory, colorVariant, gender } = body;

    // Validate required fields
    const fieldError = validateRequiredFields(body, ["userImage", "productImage", "productName"]);
    if (fieldError) {
      return badRequestResponse(fieldError);
    }

    // Validate image size (base64 encoded images are ~1.37x larger)
    const userImageSize = (userImage.length * 3) / 4;
    const productImageSize = (productImage.length * 3) / 4;
    
    if (userImageSize > MAX_IMAGE_SIZE) {
      return badRequestResponse("User image too large. Please use an image under 2MB.");
    }
    
    if (productImageSize > MAX_IMAGE_SIZE) {
      return badRequestResponse("Product image too large. Please use an image under 2MB.");
    }

    // Validate image formats - Gemini only supports JPEG, PNG, WebP, GIF (not SVG)
    const isValidImageFormat = (dataUrl: string): boolean => {
      if (!dataUrl.startsWith("data:image/")) return false;
      // SVG images are not supported by Gemini
      if (dataUrl.startsWith("data:image/svg")) return false;
      // Check for supported formats
      const supportedFormats = ["data:image/jpeg", "data:image/png", "data:image/webp", "data:image/gif"];
      return supportedFormats.some(format => dataUrl.startsWith(format));
    };

    const isPlaceholderImage = (dataUrl: string): boolean => {
      // Check for common placeholder patterns
      if (dataUrl.includes("placehold")) return true;
      if (dataUrl.startsWith("data:image/svg")) return true;
      if (dataUrl.includes("placeholder")) return true;
      return false;
    };

    if (!isValidImageFormat(userImage)) {
      return NextResponse.json(
        { success: false, error: "Invalid user photo format. Please upload a JPEG or PNG image." },
        { status: 400 }
      );
    }

    if (!isValidImageFormat(productImage) || isPlaceholderImage(productImage)) {
      return NextResponse.json(
        { success: false, error: "This product doesn't have a valid image for virtual try-on. Please choose a product with a real photo (not a placeholder)." },
        { status: 400 }
      );
    }

    // Generate the appropriate prompt based on garment type and gender
    const detectedGender = (gender as Gender) || detectGender(productName, productCategory || "");
    const prompt = generateTryOnPrompt(productName, productCategory || "", colorVariant, detectedGender);
    const garmentType = detectGarmentType(productName, productCategory || "");

    // Extract base64 data from data URLs
    const userImageData = userImage.replace(/^data:image\/\w+;base64,/, "");
    const productImageData = productImage.replace(/^data:image\/\w+;base64,/, "");

    // Determine image MIME type
    const getUserMimeType = (dataUrl: string): string => {
      const match = dataUrl.match(/^data:(image\/\w+);base64,/);
      return match ? match[1] : "image/jpeg";
    };

    const userMimeType = getUserMimeType(userImage);
    const productMimeType = getUserMimeType(productImage);

    // Call Gemini API with both images
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: userImageData,
                mimeType: userMimeType,
              },
            },
            {
              inlineData: {
                data: productImageData,
                mimeType: productMimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract the generated image from response
    const result = response.candidates?.[0]?.content;
    
    if (!result?.parts) {
      return NextResponse.json(
        { success: false, error: "No response from AI model. Please try again." },
        { status: 500 }
      );
    }

    // Find the image in the response parts
    for (const part of result.parts) {
      if (part.inlineData?.data) {
        const generatedImage = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        
        return NextResponse.json({
          success: true,
          image: generatedImage,
          model: MODEL,
          metadata: {
            productName,
            productCategory,
            colorVariant,
            garmentType,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // If no image found, return text response if available
    const textResponse = result.parts.find(p => p.text)?.text;
    
    return NextResponse.json(
      { 
        success: false, 
        error: textResponse || "No image was generated. The AI model may have declined the request. Please try with a different photo.",
      },
      { status: 500 }
    );

  } catch (error) {
    console.error("Virtual Try-On API Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    // Check for specific API errors and provide user-friendly messages
    if (errorMessage.includes("SAFETY") || errorMessage.includes("safety")) {
      return NextResponse.json(
        { success: false, error: "The image could not be generated due to content guidelines. Please try a different photo with appropriate attire." },
        { status: 400 }
      );
    }
    
    if (errorMessage.includes("RATE_LIMIT") || errorMessage.includes("429")) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait 30 seconds and try again." },
        { status: 429 }
      );
    }

    if (errorMessage.includes("INVALID_ARGUMENT") || errorMessage.includes("400")) {
      return NextResponse.json(
        { success: false, error: "Invalid image format. Please use a clear JPEG or PNG photo." },
        { status: 400 }
      );
    }

    if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403")) {
      return NextResponse.json(
        { success: false, error: "API access denied. Please check your Gemini API key configuration." },
        { status: 403 }
      );
    }

    if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("404")) {
      return NextResponse.json(
        { success: false, error: "AI model not available. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
