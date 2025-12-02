import { NextRequest, NextResponse } from "next/server";
import { genAI } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { name, category, existingDescription } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a professional fashion copywriter for a premium streetwear brand called "CIPHER". Generate compelling product details for the following item.

Product Name: ${name}
Category: ${category || "Apparel"}
${existingDescription ? `Existing Description (improve upon this): ${existingDescription}` : ""}

Generate the following in JSON format:
{
  "shortDescription": "A catchy one-line description (max 100 characters) that highlights the key selling point",
  "description": "A detailed 2-3 paragraph product description that covers: the design aesthetic, material quality, fit and comfort, versatility/styling suggestions. Use a confident, modern brand voice.",
  "material": "Specific material composition (e.g., '100% Premium Cotton', '80% Cotton, 20% Polyester')",
  "careInstructions": "Care instructions in a brief format (e.g., 'Machine wash cold. Tumble dry low. Do not bleach.')",
  "tags": ["array", "of", "5-7", "relevant", "tags", "for", "SEO"]
}

IMPORTANT: 
- Keep the tone premium but accessible
- Emphasize quality and craftsmanship
- Make it feel exclusive and desirable
- Return ONLY valid JSON, no markdown or extra text`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
    const productDetails = JSON.parse(cleanedText);

    return NextResponse.json(productDetails);
  } catch (error) {
    console.error("Error generating product details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate product details" },
      { status: 500 }
    );
  }
}
