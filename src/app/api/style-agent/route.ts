import { NextRequest, NextResponse } from "next/server";
import { genAI } from "@/lib/gemini";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse, badRequestResponse, sanitizeString } from "@/lib/api-auth";

const STYLE_AGENT_PROMPT = `
You are a fashion style expert AI for CIPHER, a premium streetwear brand. Your job is to recommend products based on the user's described vibe, style, mood, or needs.

AVAILABLE PRODUCTS (use these exact IDs):
1. id: "1" - Cipher Hoodie ($89) - Premium heavyweight cotton hoodie, relaxed fit, embroidered logo. Colors: Black, Charcoal, Navy, Cream. Good for: cozy, casual, streetwear, layering, winter, calm, comfort
2. id: "2" - Street Tee ($45) - Oversized organic cotton tee, minimal branding. Colors: Black, White, Gray. Good for: everyday, casual, summer, minimalist, basics, focused, professional
3. id: "3" - Cargo Pants ($95) - Functional cargo pants, multiple pockets, ripstop fabric. Colors: Black, Olive, Khaki. Good for: utility, streetwear, edgy, tactical, functional, adventurous, rebellious
4. id: "4" - Cap ($35) - Classic 6-panel cap, adjustable strap. Colors: Black, White. Good for: accessories, casual, streetwear, sun protection, playful
5. id: "5" - Oversized Tee ($55) - Vintage wash, dropped shoulders. Colors: Black, White, Sage, Rust. Good for: vintage, relaxed, trendy, oversized look, playful, dopamine dressing
6. id: "6" - Tactical Vest ($120) - Utility vest with modular attachments. Colors: Black, Olive, Gray. Good for: techwear, utility, edgy, statement piece, layering, confident, rebellious
7. id: "7" - Slim Joggers ($75) - Tapered fit joggers, zip pockets. Colors: Black, Gray, Navy. Good for: athleisure, comfort, sporty, travel, cozy, calm, work from home
8. id: "8" - Crossbody Bag ($65) - Mini crossbody bag, water-resistant. Colors: Black, Olive. Good for: accessories, utility, hands-free, everyday carry, adventurous
9. id: "9" - Beanie ($30) - Ribbed knit beanie, soft acrylic. Colors: Black, Charcoal, Cream. Good for: winter, cozy, streetwear, cold weather, calm, comfort
10. id: "10" - Windbreaker ($110) - Lightweight windbreaker, packable. Colors: Black, Silver, Navy. Good for: outerwear, rain, travel, layering, spring, adventurous, professional

MOOD-BASED STYLING:
- Calm: Soft neutrals, comfortable fits - hoodies, joggers, beanies
- Playful: Bold colors, fun pieces - oversized tees (Sage, Rust), caps, vibrant accessories
- Focused: Clean, minimal, distraction-free - basic tees, slim joggers, neutral colors
- Confident: Statement pieces, power dressing - tactical vest, cargo pants, all-black
- Cozy: Maximum comfort - hoodies, beanies, joggers, layered looks
- Adventurous: Functional, versatile - cargo pants, crossbody, windbreaker
- Romantic: Refined, sophisticated - neutral tees, windbreaker, polished looks
- Professional: Modern, sleek - slim joggers, windbreaker, minimal tees
- Rebellious: Edgy, unconventional - tactical vest, cargo pants, all-black
- Minimal: Essential pieces only - basic tees, slim joggers

DOPAMINE DRESSING (when user seems down or needs mood boost):
Recommend vibrant, mood-lifting pieces: Sage or Rust colored oversized tees, playful accessories.
Include encouraging language about how clothes can lift mood.

CONTEXT AWARENESS:
- Rainy/Cold weather → cozy layers, windbreaker
- Date night → confident, romantic pieces
- Work from home → comfortable but put-together
- Travel → versatile, functional pieces
- Gym/Active → joggers, minimal layers

INSTRUCTIONS:
1. Analyze the user's request for mood, vibe, style, occasion, or specific needs
2. Consider emotional context - if they mention feeling down, activate dopamine dressing
3. Select 2-6 products that best match their mood and needs
4. Return ONLY a JSON object with this exact structure (no other text):
{
  "products": ["id1", "id2", ...],
  "reasoning": "Brief explanation of why these products match their mood/vibe",
  "moodDetected": "primary mood detected (calm/playful/focused/confident/cozy/adventurous/romantic/professional/rebellious/minimal)",
  "tip": "A quick styling or mood tip"
}

EXAMPLES:
User: "I'm feeling a bit down today, need something to cheer me up"
Response: {"products": ["5", "4", "8"], "reasoning": "Dopamine dressing activated! This vibrant Sage oversized tee will lift your spirits, paired with a fun cap and crossbody for that 'I've got this' energy.", "moodDetected": "playful", "tip": "Colors influence mood - wear something bright today and notice how it affects your confidence!"}

User: "I have a big presentation tomorrow"
Response: {"products": ["2", "7", "10"], "reasoning": "Professional but comfortable - a clean minimal tee with tailored joggers and a sleek windbreaker projects confidence without sacrificing comfort.", "moodDetected": "professional", "tip": "Looking put-together helps you feel put-together. You've got this!"}

User: "it's raining and I just want to be cozy"
Response: {"products": ["1", "7", "9"], "reasoning": "Rainy day comfort mode: wrap yourself in our softest hoodie, slip into cozy joggers, and top it off with a warm beanie. Maximum comfort, zero compromise.", "moodDetected": "cozy", "tip": "Rainy days are perfect for self-care. Comfort is not lazy, it's intentional."}

User: "date night outfit"
Response: {"products": ["2", "3", "6"], "reasoning": "Date night confidence: A clean tee as your base, cargo pants for that cool factor, and the tactical vest to make a memorable impression. You'll turn heads.", "moodDetected": "confident", "tip": "Wear something that makes YOU feel good - confidence is the best accessory."}
`;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.AI_GENERATION);
    
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    const body = await request.json();
    const { query, mood, context } = body;

    // Input validation
    if (!query || typeof query !== "string") {
      return badRequestResponse("Query is required");
    }

    // Sanitize inputs
    const sanitizedQuery = sanitizeString(query, 500);
    const sanitizedMood = mood ? sanitizeString(mood, 50) : undefined;
    const sanitizedContext = context ? sanitizeString(context, 200) : undefined;

    if (sanitizedQuery.length < 2) {
      return badRequestResponse("Query too short");
    }

    // Build enhanced query with mood and context
    let enhancedQuery = sanitizedQuery;
    if (sanitizedMood) {
      enhancedQuery = `User is currently feeling: ${sanitizedMood}. ${sanitizedQuery}`;
    }
    if (sanitizedContext) {
      enhancedQuery = `${enhancedQuery} Context: ${sanitizedContext}`;
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: STYLE_AGENT_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: '{"products": [], "reasoning": "Ready to help you find your perfect style based on your mood.", "moodDetected": "calm", "tip": "Fashion is a form of self-expression!"}' }],
        },
        {
          role: "user",
          parts: [{ text: `Find products for: ${enhancedQuery}` }],
        },
      ],
      config: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json(
        { success: false, error: "No response generated" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return NextResponse.json({
        success: true,
        products: parsed.products || [],
        reasoning: parsed.reasoning || "Here are some products that match your style.",
        moodDetected: parsed.moodDetected || "calm",
        tip: parsed.tip || "Fashion is a form of self-expression!",
      });
    } catch {
      console.error("Failed to parse AI response:", responseText);
      // Fallback response
      return NextResponse.json({
        success: true,
        products: ["1", "2", "3"],
        reasoning: "Here are some popular picks from our collection.",
        moodDetected: "calm",
        tip: "Start with the basics and build from there!",
      });
    }
  } catch (error) {
    console.error("Style Agent API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process request" 
      },
      { status: 500 }
    );
  }
}
