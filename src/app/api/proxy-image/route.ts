import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    // Validate the URL
    const parsedUrl = new URL(url);
    
    // Only allow certain domains for security
    const allowedDomains = [
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
      "lh3.googleusercontent.com",
      "images.unsplash.com",
      "via.placeholder.com",
      "placehold.co",
      "picsum.photos",
      "res.cloudinary.com",
    ];
    
    const isAllowed = allowedDomains.some(domain => parsedUrl.hostname.includes(domain));
    
    // Also allow relative URLs from the same origin
    if (!isAllowed && !url.startsWith("/")) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    // Check if it's actually an image
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "URL does not point to an image" }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
