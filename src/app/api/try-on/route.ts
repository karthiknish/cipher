import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse, badRequestResponse, requireAuth, unauthorizedResponse, validateRequiredFields } from "@/lib/api-auth";

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
    const { userImage, productImage, productName, productCategory, colorVariant } = body;

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

    // Determine garment type for more specific prompting
    const category = (productCategory || "").toLowerCase();
    const name = (productName || "").toLowerCase();
    
    const isBottomWear = 
      category.includes("pants") || category.includes("bottom") || category.includes("trouser") ||
      category.includes("jeans") || category.includes("shorts") || category.includes("skirt") ||
      name.includes("pants") || name.includes("cargo") || name.includes("jeans") ||
      name.includes("trouser") || name.includes("shorts") || name.includes("skirt");
    
    const isFullBody = 
      category.includes("dress") || category.includes("jumpsuit") || category.includes("romper") ||
      name.includes("dress") || name.includes("jumpsuit") || name.includes("romper");

    // Construct an enhanced virtual try-on prompt
    const colorInfo = colorVariant ? ` in ${colorVariant} color` : "";
    
    // Build garment-specific instructions
    let garmentInstructions = "";
    if (isBottomWear) {
      garmentInstructions = `
GARMENT TYPE: BOTTOM WEAR (Pants/Shorts/Skirt)
- Replace ONLY the person's lower body clothing (from waist down)
- Keep the person's upper body and any top/shirt they are wearing COMPLETELY UNCHANGED
- The pants/bottoms should start at the natural waistline
- Preserve the person's legs, feet, and shoes if visible
- Make sure the bottom garment flows naturally with the person's leg position and stance`;
    } else if (isFullBody) {
      garmentInstructions = `
GARMENT TYPE: FULL BODY (Dress/Jumpsuit)
- Replace the person's entire outfit with this garment
- The garment should cover from shoulders/neckline down to the appropriate length
- Preserve the person's body shape and pose underneath`;
    } else {
      garmentInstructions = `
GARMENT TYPE: TOP WEAR (Shirt/Jacket/Sweater)
- Replace ONLY the person's upper body clothing (torso area)
- Keep the person's lower body and any pants/bottoms they are wearing COMPLETELY UNCHANGED
- The top should fit naturally on shoulders, chest, and arms
- Preserve sleeves and collar as shown in the product image`;
    }

    const prompt = `You are a world-class fashion AI specializing in photorealistic virtual try-on technology.

CRITICAL TASK: Take the PERSON from IMAGE 1 (their full body, face, pose, background) and dress them in the CLOTHING ITEM from IMAGE 2.

IMAGE 1: A photo of a person - YOU MUST USE THIS PERSON in the output
IMAGE 2: A product photo of ${productName}${colorInfo} - extract this clothing item

${garmentInstructions}

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW MEANS FAILURE:
1. THE OUTPUT MUST SHOW THE EXACT SAME PERSON FROM IMAGE 1 - same face, same body, same pose, same background
2. Only the specified clothing area should change - everything else stays IDENTICAL to Image 1
3. The person's face, hair, skin tone, body proportions must be EXACTLY preserved
4. The background from Image 1 must be kept EXACTLY as is
5. The lighting on the new clothing must match Image 1's lighting
6. The clothing must fit naturally on the person's body with realistic draping

DO NOT:
- Generate a new person or model
- Show just the clothing item alone
- Change the person's face, body, or pose
- Change or remove the background
- Add or remove any other elements

OUTPUT: A photorealistic image of THE SAME PERSON from Image 1, now wearing the ${productName} from Image 2, with everything else unchanged. This should look like a real photograph, not a composite.`;

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
