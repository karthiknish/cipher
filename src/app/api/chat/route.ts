import { NextRequest, NextResponse } from "next/server";
import { genAI } from "@/lib/gemini";

// Website context for the chatbot
const WEBSITE_CONTEXT = `
You are a helpful customer service assistant for CIPHER, a premium streetwear fashion brand. 
You should answer questions about the website, products, orders, and policies.

ABOUT CIPHER:
- Premium streetwear brand focused on urban fashion
- Products include: Hoodies, Tees, Pants, Outerwear, and Accessories
- Price range: $35 - $120
- All products feature high-quality materials and minimal branding
- Target audience: Fashion-forward individuals who appreciate quality streetwear

PRODUCTS WE OFFER:
- Cipher Hoodie ($89) - Premium heavyweight cotton hoodie with embroidered logo
- Street Tee ($45) - Oversized fit tee made from organic cotton
- Cargo Pants ($95) - Functional cargo pants with multiple pockets
- Cap ($35) - Classic 6-panel cap with adjustable strap
- Oversized Tee ($55) - Vintage wash oversized tee with dropped shoulders
- Tactical Vest ($120) - Utility vest with modular attachments

WEBSITE FEATURES:
- Shop: Browse all products by category
- Virtual Try-On: AI-powered feature to see how clothes look on you
- Size Guide: Detailed measurements for all products
- AI Size Recommendation: Get personalized size suggestions based on your measurements
- Wishlist: Save products for later
- Product Comparison: Compare up to 3 products side by side
- Recently Viewed: Track products you've looked at
- Back in Stock Notifications: Get notified when out-of-stock items return

PAGES:
- Home (/) - Landing page with featured products
- Shop (/shop) - Browse all products
- Product Detail (/shop/[id]) - Individual product pages
- Cart (/cart) - Shopping cart
- Checkout (/checkout) - Complete your purchase
- Orders (/orders) - View order history (requires login)
- Wishlist (/wishlist) - Saved items
- Size Guide (/size-guide) - Measurement guide
- FAQs (/faqs) - Frequently asked questions
- Contact (/contact) - Get in touch
- Login (/login) - Sign in or create account
- Privacy Policy (/privacy) - Privacy information
- Terms & Conditions (/terms) - Terms of service

SHIPPING & RETURNS:
- Free shipping on orders over $100
- Standard shipping: 5-7 business days
- Express shipping available
- 30-day return policy for unworn items with tags
- Easy returns process through the Orders page

CUSTOMER SERVICE:
- Email: support@cipher.com (placeholder)
- Response time: Within 24 hours
- Business hours: Monday-Friday, 9am-6pm EST

GUIDELINES FOR RESPONSES:
1. Be friendly, helpful, and professional
2. Keep responses SHORT and conversational (2-4 sentences max for simple questions)
3. Use plain text only - NO markdown formatting, NO asterisks, NO bullet points with symbols
4. If listing items, use simple line breaks or commas
5. Don't use ** for bold or * for bullets
6. If you don't know something specific, suggest contacting customer support
7. Recommend relevant products when appropriate
8. Guide users to the right pages for their needs
9. Don't make up information about specific order statuses or account details
10. For account-specific questions, direct users to log in or contact support
11. Use emojis sparingly to keep things friendly
12. Never start responses with "Here" or repeat the question back
`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Build conversation history for context
    const conversationHistory = history?.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })) || [];

    // Create the chat with system context
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: WEBSITE_CONTEXT }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm the CIPHER customer service assistant. I'll help customers with questions about our streetwear products, website features, orders, and policies. How can I help you today?" }],
        },
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
      config: {
        maxOutputTokens: 500,
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

    return NextResponse.json({
      success: true,
      message: responseText,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process message" 
      },
      { status: 500 }
    );
  }
}
