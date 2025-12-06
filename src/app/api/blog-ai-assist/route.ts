import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse, badRequestResponse, requireAuth, forbiddenResponse, sanitizeString } from "@/lib/api-auth";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.AI_GENERATION);
    
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    // Require admin authentication for blog AI assist
    const authResult = await requireAuth(request, { requireAdmin: true });
    if (!authResult) {
      return forbiddenResponse("Admin access required for blog AI assist");
    }

    const body = await request.json();
    const { type, selectedText, fullContent } = body;

    // Validate type
    const validTypes = ["continue", "improve", "shorten", "expand", "tone"];
    if (!type || !validTypes.includes(type)) {
      return badRequestResponse(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
    }

    // Sanitize inputs
    const sanitizedSelectedText = selectedText ? sanitizeString(selectedText, 5000) : "";
    const sanitizedFullContent = fullContent ? sanitizeString(fullContent, 10000) : "";

    if (!sanitizedSelectedText && !sanitizedFullContent) {
      return badRequestResponse("Either selectedText or fullContent is required");
    }

    let prompt = "";
    const context = `You are a writing assistant for a streetwear fashion brand called CIPHER. The brand has a modern, urban, and minimalist aesthetic. Write in a professional yet approachable tone.`;

    switch (type) {
      case "continue":
        prompt = `${context}

The following is content from a blog post. Continue writing naturally from where it left off. Write 2-3 paragraphs that maintain the same tone and style.

Content so far:
${sanitizedFullContent || sanitizedSelectedText}

Continue writing:`;
        break;

      case "improve":
        prompt = `${context}

Improve the following text to make it more engaging, clear, and professional while maintaining its original meaning. Keep the same approximate length.

Text to improve:
${sanitizedSelectedText || sanitizedFullContent}

Improved version:`;
        break;

      case "shorten":
        prompt = `${context}

Condense the following text to be more concise while keeping the key information and maintaining the tone. Reduce the length by about 30-50%.

Text to shorten:
${sanitizedSelectedText || sanitizedFullContent}

Shortened version:`;
        break;

      case "expand":
        prompt = `${context}

Expand on the following text with more details, examples, or explanations. Add 2-3 more sentences or a paragraph that enriches the content.

Text to expand:
${sanitizedSelectedText || sanitizedFullContent}

Expanded version:`;
        break;

      case "tone":
        prompt = `${context}

Rewrite the following text to be more engaging and captivating for a fashion-forward audience. Add energy and personality while keeping it professional.

Text to enhance:
${sanitizedSelectedText || sanitizedFullContent}

More engaging version:`;
        break;

      default:
        prompt = `${context}

Help improve or continue the following blog content:
${sanitizedSelectedText || sanitizedFullContent}`;
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const suggestion = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return NextResponse.json({ 
      success: true, 
      suggestion 
    });
  } catch (error) {
    console.error("Blog AI assist error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate AI suggestion" },
      { status: 500 }
    );
  }
}
