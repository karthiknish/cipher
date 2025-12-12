import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse, badRequestResponse, requireAuth, forbiddenResponse, parseJsonBody, sanitizeString, isValidEmail, publicErrorMessage } from "@/lib/api-auth";

// Email campaign types
type CampaignType = 
  | "win-back" 
  | "vip-exclusive" 
  | "cart-abandonment" 
  | "re-engagement"
  | "custom";

interface EmailCampaignRequest {
  type: CampaignType;
  recipients: Array<{
    email: string;
    name?: string;
    customData?: Record<string, unknown>;
  }>;
  subject?: string;
  content?: string;
  scheduledAt?: string;
}

// Email templates
const EMAIL_TEMPLATES: Record<CampaignType, { subject: string; getContent: (data: Record<string, unknown>) => string }> = {
  "win-back": {
    subject: "We miss you! Here's 20% off your next order",
    getContent: (data) => `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 30px;">CIPHER</h1>
        <h2 style="font-size: 24px; font-weight: 300; margin-bottom: 20px;">We've missed you, ${data.name || 'there'}!</h2>
        <p style="color: #666; line-height: 1.8; margin-bottom: 30px;">
          It's been a while since your last visit. We've been busy adding new styles we think you'll love.
          As a thank you for being part of our community, here's an exclusive offer just for you.
        </p>
        <div style="background: #f8f8f8; padding: 30px; text-align: center; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #888; margin-bottom: 10px;">YOUR EXCLUSIVE CODE</p>
          <p style="font-size: 32px; font-weight: 600; letter-spacing: 4px; margin-bottom: 10px;">COMEBACK20</p>
          <p style="color: #666;">20% off your entire order</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://cipher.store'}/shop" 
           style="display: inline-block; background: #000; color: #fff; padding: 16px 40px; text-decoration: none; font-size: 12px; letter-spacing: 2px;">
          SHOP NOW
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          This offer expires in 7 days. Cannot be combined with other offers.
        </p>
      </div>
    `,
  },
  "vip-exclusive": {
    subject: "VIP Early Access: New Collection Drops Tomorrow",
    getContent: (data) => `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: #fff; padding: 40px; margin-bottom: 30px;">
          <p style="font-size: 12px; letter-spacing: 3px; color: #d4af37; margin-bottom: 10px;">★ VIP EXCLUSIVE ★</p>
          <h1 style="font-size: 32px; font-weight: 300; letter-spacing: 2px; margin: 0;">CIPHER</h1>
        </div>
        <h2 style="font-size: 24px; font-weight: 300; margin-bottom: 20px;">
          ${data.name ? `${data.name}, you're` : "You're"} getting first access.
        </h2>
        <p style="color: #666; line-height: 1.8; margin-bottom: 30px;">
          As one of our most valued customers, you get exclusive early access to our newest collection 
          before anyone else. The public launch is in 24 hours - shop now to get the best selection.
        </p>
        <div style="border: 2px solid #d4af37; padding: 20px; text-align: center; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #d4af37; margin: 0;">VIP EARLY ACCESS CODE</p>
          <p style="font-size: 24px; font-weight: 600; letter-spacing: 4px; margin: 10px 0;">VIPFIRST</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://cipher.store'}/shop?collection=new" 
           style="display: inline-block; background: #d4af37; color: #000; padding: 16px 40px; text-decoration: none; font-size: 12px; letter-spacing: 2px; font-weight: 600;">
          SHOP EARLY ACCESS
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          Thank you for being a valued VIP member with $${data.totalSpent || '500'}+ in purchases.
        </p>
      </div>
    `,
  },
  "cart-abandonment": {
    subject: "Did you forget something? Your cart is waiting",
    getContent: (data) => `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 30px;">CIPHER</h1>
        <h2 style="font-size: 24px; font-weight: 300; margin-bottom: 20px;">Your cart misses you</h2>
        <p style="color: #666; line-height: 1.8; margin-bottom: 30px;">
          You left some items in your cart. They're still waiting for you, but they're selling fast!
        </p>
        ${data.cartItems ? `
          <div style="border: 1px solid #eee; margin-bottom: 30px;">
            ${(data.cartItems as Array<{name: string; price: number; image: string}>).map(item => `
              <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 75px; object-fit: cover; margin-right: 15px;" />
                <div>
                  <p style="margin: 0; font-weight: 500;">${item.name}</p>
                  <p style="margin: 5px 0 0; color: #666;">$${item.price}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div style="background: #f8f8f8; padding: 20px; text-align: center; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #888; margin-bottom: 10px;">Complete your order and get</p>
          <p style="font-size: 24px; font-weight: 600; margin: 0;">FREE SHIPPING</p>
          <p style="color: #666; margin-top: 5px;">Use code: FREESHIP</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://cipher.store'}/cart" 
           style="display: inline-block; background: #000; color: #fff; padding: 16px 40px; text-decoration: none; font-size: 12px; letter-spacing: 2px;">
          COMPLETE PURCHASE
        </a>
      </div>
    `,
  },
  "re-engagement": {
    subject: "A lot has changed since you've been away",
    getContent: (data) => `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 30px;">CIPHER</h1>
        <h2 style="font-size: 24px; font-weight: 300; margin-bottom: 20px;">It's been ${data.daysSinceLastOrder || '90'}+ days</h2>
        <p style="color: #666; line-height: 1.8; margin-bottom: 30px;">
          We've added tons of new styles since you last visited. From fresh drops to restocked favorites,
          there's something waiting for you.
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
          <div style="background: #f8f8f8; padding: 20px; text-align: center;">
            <p style="font-size: 24px; font-weight: 600; margin: 0;">50+</p>
            <p style="color: #666; font-size: 12px; margin: 5px 0 0;">New Arrivals</p>
          </div>
          <div style="background: #f8f8f8; padding: 20px; text-align: center;">
            <p style="font-size: 24px; font-weight: 600; margin: 0;">25%</p>
            <p style="color: #666; font-size: 12px; margin: 5px 0 0;">Off Welcome Back</p>
          </div>
        </div>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://cipher.store'}/shop" 
           style="display: inline-block; background: #000; color: #fff; padding: 16px 40px; text-decoration: none; font-size: 12px; letter-spacing: 2px;">
          SEE WHAT'S NEW
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          Use code WELCOMEBACK25 for 25% off. Expires in 14 days.
        </p>
      </div>
    `,
  },
  "custom": {
    subject: "A message from Cipher",
    getContent: () => "",
  },
};

// Simulate sending email (in production, integrate with SendGrid, Mailchimp, etc.)
async function sendEmail(
  to: string, 
  subject: string, 
  _htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  void _htmlContent;
  // In production, replace with actual email service integration:
  // - SendGrid: @sendgrid/mail
  // - Mailchimp Transactional: @mailchimp/mailchimp_transactional
  // - AWS SES: @aws-sdk/client-ses
  // - Resend: resend
  
  console.log(`[Email Campaign] Sending to: ${to}`);
  console.log(`[Email Campaign] Subject: ${subject}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate 95% success rate
  if (Math.random() > 0.05) {
    return { 
      success: true, 
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
  }
  
  return { success: false, error: "Simulated delivery failure" };
}

// Log campaign to Firestore for tracking
async function logCampaign(
  type: CampaignType,
  recipients: string[],
  results: Array<{ email: string; success: boolean; messageId?: string }>
) {
  // In production, save to Firestore
  console.log(`[Email Campaign] Logged campaign:`, {
    type,
    recipientCount: recipients.length,
    successCount: results.filter(r => r.success).length,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for email sending
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.EMAIL);
    
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    // Require admin authentication for email campaigns
    const authResult = await requireAuth(request, { requireAdmin: true, allowApiSecret: true });
    if (!authResult) {
      return forbiddenResponse("Admin access required to send email campaigns");
    }

    const parsed = await parseJsonBody<EmailCampaignRequest>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const { type, recipients, subject: customSubject, content: customContent } = body;

    if (!type || !recipients || recipients.length === 0) {
      return badRequestResponse("Missing required fields: type, recipients");
    }

    // Limit recipients per request to prevent abuse
    const MAX_RECIPIENTS = 100;
    if (recipients.length > MAX_RECIPIENTS) {
      return badRequestResponse(`Too many recipients. Maximum ${MAX_RECIPIENTS} per request.`);
    }

    const template = EMAIL_TEMPLATES[type];
    if (!template && type !== "custom") {
      return badRequestResponse(`Unknown campaign type: ${type}`);
    }

    if (type === "custom") {
      const subjectOk = typeof customSubject === "string" && customSubject.trim().length > 0;
      const contentOk = typeof customContent === "string" && customContent.trim().length > 0;
      if (!subjectOk || !contentOk) {
        return badRequestResponse("Custom campaigns require subject and content");
      }
    }

    const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];

    for (const recipient of recipients) {
      if (!recipient?.email || !isValidEmail(recipient.email)) {
        results.push({ email: String(recipient?.email || ""), success: false, error: "Invalid recipient email" });
        continue;
      }

      const safeSubject = typeof (customSubject || template.subject) === "string"
        ? sanitizeString(String(customSubject || template.subject), 200)
        : "Cipher";

      const content = type === "custom" 
        ? customContent || "" 
        : template.getContent(recipient.customData || {});

      // Basic guardrail against huge payloads
      const safeContent = typeof content === "string" ? content.slice(0, 200_000) : "";

      const result = await sendEmail(recipient.email, safeSubject, safeContent);
      results.push({ email: recipient.email, ...result });
    }

    // Log the campaign
    await logCampaign(type, recipients.map(r => r.email), results);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: recipients.length,
        sent: successCount,
        failed: failureCount,
        campaignType: type,
      },
      results,
    });
  } catch (error) {
    console.error("[Email Campaign Error]", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "Failed to send campaign") },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve campaign templates and stats
export async function GET(request: NextRequest) {
  // Rate limit to avoid probing
  const clientId = getClientIdentifier(request);
  const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.API_GENERAL);
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
  }

  const authResult = await requireAuth(request, { requireAdmin: true, allowApiSecret: true });
  if (!authResult) {
    return forbiddenResponse("Admin access required");
  }

  return NextResponse.json({
    templates: Object.keys(EMAIL_TEMPLATES).map(key => ({
      type: key,
      subject: EMAIL_TEMPLATES[key as CampaignType].subject,
    })),
    stats: {
      // In production, fetch from Firestore
      totalSent: 0,
      lastCampaign: null,
    },
  });
}
