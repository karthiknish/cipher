import { NextRequest, NextResponse } from "next/server";
import { genAI } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { hasDesignA, hasDesignB, existingTitle } = await request.json();

    const prompt = `You are a creative director for a premium streetwear brand called "CIPHER". Generate compelling details for a design voting contest where customers vote between two design options.

${existingTitle ? `Existing Contest Title (can improve upon this): ${existingTitle}` : ""}
Number of designs in this contest: ${hasDesignA && hasDesignB ? "2 (A and B)" : hasDesignA ? "1 (A only)" : "1 (B only)"}

Generate the following in JSON format:
{
  "contestTitle": "A catchy, engaging title for the design voting contest (e.g., 'Summer Drop: Pick Your Favorite', 'The Next Icon: Your Vote Decides')",
  "contestDescription": "A brief 1-2 sentence description encouraging customers to vote and explaining what they're deciding (e.g., 'Help us choose the next design for our limited edition collection. Your vote shapes our next drop.')",
  ${hasDesignA ? `"designATitle": "A creative name for Design A (e.g., 'Midnight Cipher', 'Urban Edge', 'Classic Redux')",
  "designADescription": "A brief compelling description of Design A's aesthetic/vibe (1-2 sentences)",` : ""}
  ${hasDesignB ? `"designBTitle": "A creative name for Design B that contrasts with A (e.g., 'Dawn Protocol', 'Street Core', 'Modern Remix')",
  "designBDescription": "A brief compelling description of Design B's aesthetic/vibe (1-2 sentences)"` : ""}
}

IMPORTANT:
- Make names creative, memorable, and on-brand for streetwear
- Keep descriptions concise but evocative
- Create contrast between Design A and B names/vibes if both exist
- Use a confident, modern brand voice
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
    const designDetails = JSON.parse(cleanedText);

    return NextResponse.json(designDetails);
  } catch (error) {
    console.error("Error generating design details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate design details" },
      { status: 500 }
    );
  }
}
