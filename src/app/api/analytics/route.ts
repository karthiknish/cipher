import { NextRequest, NextResponse } from "next/server";
import { db, collection, addDoc, serverTimestamp } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    // Validate required fields
    if (!data.type || !data.sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log to Firestore
    await addDoc(collection(db, "analytics", "events", "beacons"), {
      ...data,
      serverTimestamp: serverTimestamp(),
      receivedAt: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    });

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
