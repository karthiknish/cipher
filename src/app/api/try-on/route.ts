import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Nano Banana Pro model for advanced image generation
const MODEL = "gemini-3-pro-image-preview";

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userImage, productImage, productName, productCategory } = body;

    // Validate required fields
    if (!userImage || !productImage || !productName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userImage, productImage, productName" },
        { status: 400 }
      );
    }

    // Construct the virtual try-on prompt
    const prompt = `You are a professional fashion AI specializing in virtual try-on. Your task is to create a photorealistic image.

TASK: Digitally dress the person in the first image with the clothing item shown in the second image.

CLOTHING ITEM: ${productName} (Category: ${productCategory || "Apparel"})

STRICT REQUIREMENTS:
1. PRESERVE the person's exact face, body shape, skin tone, hair, and pose from the first image
2. APPLY the ${productName} onto the person naturally, as if they are actually wearing it
3. MATCH the lighting conditions between the person and clothing for realism
4. ENSURE the clothing fits the person's body proportions realistically
5. MAINTAIN natural fabric draping and folds based on the pose
6. KEEP the original background from the person's photo
7. The final result must look like a real photograph, not a digital composite

OUTPUT: A single, high-quality photorealistic image of the person wearing the ${productName}.`;

    // Extract base64 data from data URLs
    const userImageData = userImage.replace(/^data:image\/\w+;base64,/, "");
    const productImageData = productImage.replace(/^data:image\/\w+;base64,/, "");

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
                mimeType: "image/jpeg",
              },
            },
            {
              inlineData: {
                data: productImageData,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "2K",
        },
      },
    });

    // Extract the generated image from response
    const result = response.candidates?.[0]?.content;
    
    if (!result?.parts) {
      return NextResponse.json(
        { success: false, error: "No response from AI model" },
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
        });
      }
    }

    // If no image found, return text response if available
    const textResponse = result.parts.find(p => p.text)?.text;
    
    return NextResponse.json(
      { 
        success: false, 
        error: textResponse || "No image generated. The model may have declined the request.",
      },
      { status: 500 }
    );

  } catch (error) {
    console.error("Virtual Try-On API Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    // Check for specific API errors
    if (errorMessage.includes("SAFETY")) {
      return NextResponse.json(
        { success: false, error: "The image could not be generated due to safety guidelines. Please try a different photo." },
        { status: 400 }
      );
    }
    
    if (errorMessage.includes("RATE_LIMIT")) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
