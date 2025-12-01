import { NextRequest, NextResponse } from "next/server";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image: string;
}

interface ReminderRequest {
  cartId: string;
  email: string;
  items: CartItem[];
  total: number;
  reminderNumber: number;
}

// Email templates based on reminder number
const getEmailSubject = (reminderNumber: number): string => {
  switch (reminderNumber) {
    case 1:
      return "You left something behind! 🛒";
    case 2:
      return "Your items are waiting for you";
    case 3:
      return "Last chance: Complete your CIPHER order";
    default:
      return "Complete your CIPHER order";
  }
};

const getEmailMessage = (reminderNumber: number): string => {
  switch (reminderNumber) {
    case 1:
      return "We noticed you left some amazing items in your cart. Come back and complete your purchase!";
    case 2:
      return "Your carefully selected items are still waiting for you. Don't miss out on these styles!";
    case 3:
      return "This is your final reminder. Your cart items might sell out soon. Complete your order now!";
    default:
      return "Complete your purchase at CIPHER.";
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: ReminderRequest = await request.json();
    const { cartId, email, items, total, reminderNumber } = body;

    // Validate required fields
    if (!cartId || !email || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // In production, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    // - Postmark
    
    // For now, we'll simulate the email sending
    // In production, replace this with actual email sending logic
    
    const emailSubject = getEmailSubject(reminderNumber);
    const emailMessage = getEmailMessage(reminderNumber);
    
    // Generate cart recovery URL with token
    const recoveryToken = Buffer.from(`${cartId}:${Date.now()}`).toString("base64");
    const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cart?recover=${recoveryToken}`;
    
    // Build email content
    const emailContent = {
      to: email,
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSubject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e0e0e0;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #000000; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 4px; font-weight: 500;">CIPHER</h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 500; color: #000000;">${emailSubject}</h2>
                      <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666666;">${emailMessage}</p>
                      
                      <!-- Cart Items -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                        ${items.map(item => `
                          <tr>
                            <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td width="80" style="vertical-align: top;">
                                    <img src="${item.image}" alt="${item.name}" width="70" height="85" style="object-fit: cover; background-color: #f5f5f5;">
                                  </td>
                                  <td style="vertical-align: top; padding-left: 15px;">
                                    <p style="margin: 0 0 5px; font-size: 14px; font-weight: 500; color: #000000;">${item.name}</p>
                                    <p style="margin: 0; font-size: 12px; color: #666666;">Size: ${item.size} ${item.color ? `• Color: ${item.color}` : ""}</p>
                                    <p style="margin: 5px 0 0; font-size: 12px; color: #666666;">Qty: ${item.quantity} × $${item.price.toFixed(2)}</p>
                                  </td>
                                  <td width="80" style="vertical-align: top; text-align: right;">
                                    <p style="margin: 0; font-size: 14px; font-weight: 500; color: #000000;">$${(item.price * item.quantity).toFixed(2)}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        `).join("")}
                      </table>
                      
                      <!-- Total -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 15px 0; border-top: 2px solid #000000;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size: 14px; font-weight: 500; color: #000000;">Subtotal</td>
                                <td style="text-align: right; font-size: 16px; font-weight: 600; color: #000000;">$${total.toFixed(2)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${recoveryUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 40px; font-size: 13px; letter-spacing: 2px; font-weight: 500;">COMPLETE YOUR ORDER</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">Need help? Contact us at support@cipher.com</p>
                      <p style="margin: 0; font-size: 11px; color: #cccccc;">© ${new Date().getFullYear()} CIPHER. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
${emailSubject}

${emailMessage}

Your Cart:
${items.map(item => `• ${item.name} (Size: ${item.size}) - $${(item.price * item.quantity).toFixed(2)}`).join("\n")}

Subtotal: $${total.toFixed(2)}

Complete your order: ${recoveryUrl}

Need help? Contact us at support@cipher.com

© ${new Date().getFullYear()} CIPHER. All rights reserved.
      `
    };

    // Log the email for development (remove in production)
    console.log("📧 Cart reminder email would be sent:", {
      to: email,
      subject: emailSubject,
      reminderNumber,
      itemCount: items.length,
      total,
      recoveryUrl
    });

    // TODO: Implement actual email sending
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'CIPHER <noreply@cipher.com>',
    //   to: email,
    //   subject: emailContent.subject,
    //   html: emailContent.html,
    // });

    // Simulate success for now
    return NextResponse.json({
      success: true,
      message: `Reminder #${reminderNumber} sent to ${email}`,
      recoveryUrl,
    });

  } catch (error) {
    console.error("Failed to send cart reminder:", error);
    return NextResponse.json(
      { error: "Failed to send reminder email" },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Cart reminder API is operational",
    note: "Configure RESEND_API_KEY or similar email service for production use"
  });
}
