import { NextRequest, NextResponse } from "next/server";
import { db, collection, addDoc, doc, setDoc, serverTimestamp } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    // Validate required fields
    if (!data.type) {
      return NextResponse.json(
        { error: "Missing required type field" },
        { status: 400 }
      );
    }

    // Route to appropriate collection based on event type
    switch (data.type) {
      case "page_exit":
        // Log page exit with duration
        await addDoc(collection(db, "analytics", "events", "pageExits"), {
          path: data.path,
          duration: data.duration,
          sessionId: data.sessionId,
          timestamp: serverTimestamp(),
          userAgent: request.headers.get("user-agent"),
        });
        break;

      case "behavior_event":
        // Log customer behavior events
        await addDoc(collection(db, "customerBehavior", "analytics", data.eventType || "events"), {
          ...data,
          timestamp: serverTimestamp(),
        });
        break;

      case "session_end":
        // Log session end
        if (data.sessionId) {
          await setDoc(
            doc(db, "customerBehavior", "sessions", "completed", data.sessionId),
            {
              ...data,
              endTime: serverTimestamp(),
            },
            { merge: true }
          );
        }
        break;

      case "product_view":
        await addDoc(collection(db, "customerBehavior", "analytics", "productViews"), {
          productId: data.productId,
          productName: data.productName,
          category: data.category,
          sessionId: data.sessionId,
          userId: data.userId,
          timestamp: serverTimestamp(),
        });
        break;

      case "cart_action":
        await addDoc(collection(db, "customerBehavior", "analytics", "cartActions"), {
          action: data.action,
          productId: data.productId,
          productName: data.productName,
          quantity: data.quantity,
          sessionId: data.sessionId,
          userId: data.userId,
          timestamp: serverTimestamp(),
        });
        break;

      case "search":
        await addDoc(collection(db, "customerBehavior", "analytics", "searches"), {
          query: data.query,
          resultsCount: data.resultsCount || 0,
          sessionId: data.sessionId,
          userId: data.userId,
          timestamp: serverTimestamp(),
        });
        break;

      default:
        // Default: log to beacons collection
        await addDoc(collection(db, "analytics", "events", "beacons"), {
          ...data,
          serverTimestamp: serverTimestamp(),
          receivedAt: new Date().toISOString(),
          userAgent: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
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
