import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Nano Banana Pro model for advanced image generation
const MODEL = "gemini-2.0-flash-exp-image-generation";

export async function POST(request: NextRequest) {
  try {
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
    if (!userImage || !productImage || !productName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userImage, productImage, productName" },
        { status: 400 }
      );
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

    // Construct an enhanced virtual try-on prompt
    const colorInfo = colorVariant ? ` in ${colorVariant} color` : "";
    
    const prompt = `You are a world-class fashion AI specializing in photorealistic virtual try-on technology. Your task is to create a stunning, professional-quality image.

TASK: Generate a photorealistic image showing the person from the first photo wearing the ${productName}${colorInfo} shown in the second photo.

CLOTHING DETAILS:
- Item: ${productName}
- Category: ${productCategory || "Apparel"}
${colorVariant ? `- Color: ${colorVariant}` : ""}

CRITICAL REQUIREMENTS FOR PHOTOREALISM:
1. PRESERVE IDENTITY: Keep the person's exact face, facial features, expression, skin tone, hair style, and hair color unchanged
2. MAINTAIN BODY: Preserve the person's exact body shape, proportions, and pose from the original photo
3. NATURAL FIT: Apply the clothing so it fits naturally on the person's body with realistic draping, folds, and wrinkles
4. LIGHTING MATCH: Ensure the lighting on the clothing matches the original photo's lighting conditions (direction, intensity, color temperature)
5. SHADOW INTEGRATION: Add appropriate shadows where the clothing meets the body
6. FABRIC PHYSICS: Simulate realistic fabric behavior based on the garment type and the person's pose
7. BACKGROUND: Keep the original background from the person's photo intact
8. SEAMLESS EDGES: Ensure no visible seams or artifacts where the clothing meets skin or other elements
9. COLOR ACCURACY: Maintain the exact color of the clothing item as shown in the product image
10. PROFESSIONAL QUALITY: The result should look like a professional fashion photograph, not a digital composite

OUTPUT: Generate a single, high-resolution photorealistic image of the person naturally wearing the ${productName}. The image should be indistinguishable from an actual photograph.`;

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
