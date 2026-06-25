import { createFileRoute } from "@tanstack/react-router";
import { genAI } from "@/lib/gemini";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse, badRequestResponse, requireAuth, forbiddenResponse, sanitizeString, internalServerErrorResponse, parseJsonBody, publicErrorMessage } from "@/lib/api-auth";

async function POST(request: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.AI_GENERATION);
    
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    // Require admin authentication
    const authResult = await requireAuth(request, { requireAdmin: true });
    if (!authResult) {
      return forbiddenResponse("Admin access required to generate product details");
    }

    if (!process.env.GEMINI_API_KEY) {
      return internalServerErrorResponse("AI service not configured");
    }

    const parsed = await parseJsonBody<{ name?: unknown; category?: unknown; existingDescription?: unknown }>(request);
    if (!parsed.ok) return parsed.response;
    const { name, category, existingDescription } = parsed.data;

    if (!name || typeof name !== "string") {
      return badRequestResponse("Product name is required");
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedCategory = typeof category === "string" ? sanitizeString(category, 50) : "Apparel";
    const sanitizedDescription = typeof existingDescription === "string" ? sanitizeString(existingDescription, 1000) : "";

    const prompt = `You are a professional fashion copywriter for a premium streetwear brand called "CIPHER". Generate compelling product details for the following item.

Product Name: ${sanitizedName}
Category: ${sanitizedCategory}
${sanitizedDescription ? `Existing Description (improve upon this): ${sanitizedDescription}` : ""}

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
      return Response.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
    let productDetails: unknown;
    try {
      productDetails = JSON.parse(cleanedText);
    } catch {
      console.error("AI returned invalid JSON:", { cleanedText });
      return Response.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    return Response.json(productDetails);
  } catch (error) {
    console.error("Error generating product details:", error);
    return Response.json(
      { error: publicErrorMessage(error, "Failed to generate product details") },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute("/api/generate-product-details")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
