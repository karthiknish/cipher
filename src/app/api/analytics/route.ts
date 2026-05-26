import { NextRequest, NextResponse } from "next/server";
import { getConvexServerClient, api } from "@/lib/convex-server";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse, badRequestResponse, sanitizeString } from "@/lib/api-auth";

const ALLOWED_EVENT_TYPES = [
  "page_exit",
  "behavior_event",
  "session_end",
  "product_view",
  "cart_action",
  "search",
];

const MAX_PAYLOAD_SIZE = 10 * 1024;

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.ANALYTICS);

    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return badRequestResponse("Payload too large");
    }

    const body = await request.text();

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(body);
    } catch {
      return badRequestResponse("Invalid JSON");
    }

    if (!data.type || typeof data.type !== "string") {
      return badRequestResponse("Missing required type field");
    }

    const eventType = data.type.toLowerCase();
    if (!ALLOWED_EVENT_TYPES.includes(eventType) && eventType !== "beacon") {
      return badRequestResponse(`Invalid event type: ${data.type}`);
    }

    const sanitizeData = (obj: Record<string, unknown>): Record<string, unknown> => {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          sanitized[key] = sanitizeString(value, 500);
        } else if (typeof value === "number" || typeof value === "boolean") {
          sanitized[key] = value;
        } else if (Array.isArray(value)) {
          sanitized[key] = value.slice(0, 50);
        } else if (value !== null && typeof value === "object") {
          sanitized[key] = sanitizeData(value as Record<string, unknown>);
        }
      }
      return sanitized;
    };

    const sanitizedData = sanitizeData(data);
    const convex = getConvexServerClient();

    switch (eventType) {
      case "page_exit":
        await convex.mutation(api.analytics.logEvent, {
          category: "pageExits",
          payload: {
            path: sanitizedData.path,
            duration: typeof sanitizedData.duration === "number" ? sanitizedData.duration : 0,
            sessionId: sanitizedData.sessionId,
            userAgent: request.headers.get("user-agent")?.slice(0, 200),
          },
        });
        break;

      case "behavior_event":
        await convex.mutation(api.customerBehavior.logBehaviorEvent, {
          category:
            typeof sanitizedData.eventType === "string"
              ? sanitizedData.eventType.slice(0, 50)
              : "events",
          payload: sanitizedData,
        });
        break;

      case "session_end":
        if (sanitizedData.sessionId && typeof sanitizedData.sessionId === "string") {
          await convex.mutation(api.customerBehavior.upsertSession, {
            sessionId: sanitizedData.sessionId.slice(0, 100),
            userId:
              typeof sanitizedData.userId === "string" ? sanitizedData.userId : undefined,
            status: "completed",
            data: sanitizedData,
          });
        }
        break;

      case "product_view":
        await convex.mutation(api.customerBehavior.logBehaviorEvent, {
          category: "productViews",
          payload: sanitizedData,
        });
        break;

      case "cart_action":
        await convex.mutation(api.customerBehavior.logBehaviorEvent, {
          category: "cartActions",
          payload: sanitizedData,
        });
        break;

      case "search":
        await convex.mutation(api.customerBehavior.logBehaviorEvent, {
          category: "searches",
          payload: sanitizedData,
        });
        break;

      default:
        await convex.mutation(api.analytics.logEvent, {
          category: "beacons",
          payload: {
            ...sanitizedData,
            receivedAt: new Date().toISOString(),
            userAgent: request.headers.get("user-agent")?.slice(0, 200),
          },
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics beacon error:", error);
    return NextResponse.json({ error: "Failed to process analytics" }, { status: 500 });
  }
}

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
