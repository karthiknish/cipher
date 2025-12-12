import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from "@/lib/rate-limit";
import { rateLimitedResponse } from "@/lib/api-auth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 8000;

function isAllowedHostname(hostname: string, allowedDomains: string[]): boolean {
  const lower = hostname.toLowerCase();
  return allowedDomains.some((domain) => {
    const d = domain.toLowerCase();
    return lower === d || lower.endsWith(`.${d}`);
  });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    // Rate limit to prevent this being used as a scanner
    const clientId = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.API_GENERAL);
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.retryAfterSec!, rateLimitHeaders(rateLimit));
    }

    // Normalize URL: allow absolute http(s) or same-origin relative
    const fetchUrl = url.startsWith("/") ? new URL(url, request.nextUrl.origin).toString() : url;

    // Validate the URL
    const parsedUrl = new URL(fetchUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
    }
    
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
    
    const isAllowed = isAllowedHostname(parsedUrl.hostname, allowedDomains);

    // Only allow same-origin relative paths or allowlisted domains
    if (!isAllowed && !url.startsWith("/")) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

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

    const lengthHeader = response.headers.get("content-length");
    if (lengthHeader) {
      const length = parseInt(lengthHeader, 10);
      if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image too large" }, { status: 413 });
      }
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    const status = error instanceof Error && error.name === "AbortError" ? 504 : 500;
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status }
    );
  }
}
