import { NextRequest, NextResponse } from "next/server";
import { db, collection, addDoc, doc, setDoc, serverTimestamp } from "@/lib/firebase";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse, badRequestResponse, sanitizeString } from "@/lib/api-auth";

// Allowed event types to prevent arbitrary data injection
const ALLOWED_EVENT_TYPES = [
  "page_exit",
  "behavior_event", 
  "session_end",
  "product_view",
  "cart_action",
  "search",
];

// Maximum payload size (10KB)
const MAX_PAYLOAD_SIZE = 10 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for analytics
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.ANALYTICS);
    
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    // Check payload size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return badRequestResponse("Payload too large");
    }

    const body = await request.text();
    
    // Validate JSON parsing
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return badRequestResponse("Invalid JSON");
    }

    // Validate required type field
    if (!data.type || typeof data.type !== "string") {
      return badRequestResponse("Missing required type field");
    }

    // Validate event type is allowed
    const eventType = data.type.toLowerCase();
    if (!ALLOWED_EVENT_TYPES.includes(eventType) && eventType !== "beacon") {
      return badRequestResponse(`Invalid event type: ${data.type}`);
    }

    // Sanitize string fields to prevent injection
    const sanitizeData = (obj: Record<string, unknown>): Record<string, unknown> => {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          sanitized[key] = sanitizeString(value, 500);
        } else if (typeof value === "number" || typeof value === "boolean") {
          sanitized[key] = value;
        } else if (Array.isArray(value)) {
          sanitized[key] = value.slice(0, 50); // Limit array length
        } else if (value !== null && typeof value === "object") {
          sanitized[key] = sanitizeData(value as Record<string, unknown>);
        }
      }
      return sanitized;
    };

    const sanitizedData = sanitizeData(data);

    // Route to appropriate collection based on event type
    switch (eventType) {
      case "page_exit":
        // Log page exit with duration
        await addDoc(collection(db, "analytics", "events", "pageExits"), {
          path: sanitizedData.path,
          duration: typeof sanitizedData.duration === "number" ? sanitizedData.duration : 0,
          sessionId: sanitizedData.sessionId,
          timestamp: serverTimestamp(),
          userAgent: request.headers.get("user-agent")?.slice(0, 200),
        });
        break;

      case "behavior_event":
        // Log customer behavior events
        const behaviorEventType = typeof sanitizedData.eventType === "string" 
          ? sanitizedData.eventType.slice(0, 50) 
          : "events";
        await addDoc(collection(db, "customerBehavior", "analytics", behaviorEventType), {
          ...sanitizedData,
          timestamp: serverTimestamp(),
        });
        break;

      case "session_end":
        // Log session end
        if (sanitizedData.sessionId && typeof sanitizedData.sessionId === "string") {
          await setDoc(
            doc(db, "customerBehavior", "sessions", "completed", sanitizedData.sessionId.slice(0, 100)),
            {
              ...sanitizedData,
              endTime: serverTimestamp(),
            },
            { merge: true }
          );
        }
        break;

      case "product_view":
        await addDoc(collection(db, "customerBehavior", "analytics", "productViews"), {
          productId: sanitizedData.productId,
          productName: sanitizedData.productName,
          category: sanitizedData.category,
          sessionId: sanitizedData.sessionId,
          userId: sanitizedData.userId,
          timestamp: serverTimestamp(),
        });
        break;

      case "cart_action":
        await addDoc(collection(db, "customerBehavior", "analytics", "cartActions"), {
          action: sanitizedData.action,
          productId: sanitizedData.productId,
          productName: sanitizedData.productName,
          quantity: typeof sanitizedData.quantity === "number" ? sanitizedData.quantity : 1,
          sessionId: sanitizedData.sessionId,
          userId: sanitizedData.userId,
          timestamp: serverTimestamp(),
        });
        break;

      case "search":
        await addDoc(collection(db, "customerBehavior", "analytics", "searches"), {
          query: sanitizedData.query,
          resultsCount: typeof sanitizedData.resultsCount === "number" ? sanitizedData.resultsCount : 0,
          sessionId: sanitizedData.sessionId,
          userId: sanitizedData.userId,
          timestamp: serverTimestamp(),
        });
        break;

      default:
        // Default: log to beacons collection with sanitized data
        await addDoc(collection(db, "analytics", "events", "beacons"), {
          ...sanitizedData,
          serverTimestamp: serverTimestamp(),
          receivedAt: new Date().toISOString(),
          userAgent: request.headers.get("user-agent")?.slice(0, 200),
          ip: (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"))?.slice(0, 45),
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics beacon error:", error);
    return NextResponse.json(
      { error: "Failed to process analytics" },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
