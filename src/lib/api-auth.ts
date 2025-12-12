/**
 * API Authentication & Authorization Utilities
 * 
 * Provides middleware-like functions to protect API routes.
 * Uses Firebase Admin SDK for secure server-side token verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, isAdmin as checkIsAdmin, isFirebaseAdminConfigured } from "@/lib/firebase-admin";

/**
 * API response for unauthorized requests
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * API response for forbidden requests
 */
export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

/**
 * API response for rate limited requests
 */
export function rateLimitedResponse(
  retryAfterSec: number,
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(
    { 
      success: false, 
      error: `Too many requests. Please try again in ${retryAfterSec} seconds.` 
    },
    { 
      status: 429,
      headers: {
        ...headers,
        "Retry-After": retryAfterSec.toString(),
      },
    }
  );
}

/**
 * API response for bad requests
 */
export function badRequestResponse(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 400 }
  );
}

/**
 * API response for internal server errors
 * Avoid leaking details to clients in production.
 */
export function internalServerErrorResponse(
  message = "Internal server error"
): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}

/**
 * Create a safe, client-facing error message.
 * In production we return a generic message; in development we return the error message.
 */
export function publicErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (process.env.NODE_ENV === "production") {
    return fallbackMessage;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallbackMessage;
}

/**
 * Safely parse JSON body. Returns a NextResponse on failure.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: NextRequest
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, response: badRequestResponse("Invalid JSON") };
  }
}

/**
 * Very small email validation helper for API payloads.
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  // Simple, pragmatic email regex.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  
  if (!token || token.length < 20) {
    return null;
  }

  return token;
}

/**
 * Verify Firebase ID token from Authorization header
 * 
 * Uses Firebase Admin SDK for proper server-side verification:
 * - Validates token signature using Google's public keys
 * - Checks token expiration
 * - Verifies token issuer and audience
 * 
 * Falls back to client-side decoding if Admin SDK is not configured
 * (for development without service account)
 */
export async function verifyAuthToken(
  request: NextRequest
): Promise<{ valid: boolean; userId?: string; email?: string; admin?: boolean }> {
  const token = extractBearerToken(request);
  
  if (!token) {
    return { valid: false };
  }

  // Try server-side verification with Firebase Admin
  if (isFirebaseAdminConfigured()) {
    const result = await verifyIdToken(token);
    
    if (result.valid) {
      return {
        valid: true,
        userId: result.decodedToken.uid,
        email: result.decodedToken.email,
        admin: result.decodedToken.admin === true || result.decodedToken.role === "admin",
      };
    }
    
    // Token verification failed
    return { valid: false };
  }

  // Fallback: Client-side decoding (development mode only)
  // WARNING: This is insecure and should not be used in production
  console.warn("[API Auth] Firebase Admin not configured - using insecure client-side token decoding");
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false };
    }
    
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false };
    }
    
    return {
      valid: true,
      userId: payload.user_id || payload.sub,
      email: payload.email,
      admin: payload.admin === true || payload.role === "admin",
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Check if user has admin role using server-side verification
 */
export async function isAdminUser(
  request: NextRequest
): Promise<boolean> {
  const token = extractBearerToken(request);
  
  if (!token) {
    return false;
  }

  // Use Firebase Admin for secure verification
  if (isFirebaseAdminConfigured()) {
    return await checkIsAdmin(token);
  }

  // Fallback: Client-side decoding (development only)
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }
    
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    
    return payload.admin === true || payload.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Verify API secret for server-to-server calls
 * Use this for internal APIs or webhooks
 */
export function verifyApiSecret(request: NextRequest): boolean {
  const apiSecret = process.env.API_SECRET_KEY;
  
  // If no secret configured, deny access
  if (!apiSecret) {
    console.warn("API_SECRET_KEY not configured - server-to-server calls will fail");
    return false;
  }
  
  const providedSecret = request.headers.get("X-API-Secret");
  return providedSecret === apiSecret;
}

/**
 * Validate request body size
 * Returns null if valid, error message if invalid
 */
export async function validateRequestSize(
  request: NextRequest,
  maxSizeBytes: number
): Promise<string | null> {
  const contentLength = request.headers.get("content-length");
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      return `Request body too large. Maximum size is ${Math.round(maxSizeBytes / 1024)}KB`;
    }
  }
  
  return null;
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): string | null {
  const missingFields = requiredFields.filter(
    field => body[field] === undefined || body[field] === null || body[field] === ""
  );
  
  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }
  
  return null;
}

/**
 * Sanitize string input to prevent injection
 */
export function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== "string") {
    return "";
  }
  
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // Remove potential HTML/script tags
    .trim();
}

/**
 * Combined auth check that works for both user auth and API secret
 * Returns user info if authenticated, null otherwise
 */
export async function requireAuth(
  request: NextRequest,
  options: { allowApiSecret?: boolean; requireAdmin?: boolean } = {}
): Promise<{ userId?: string; email?: string; isApiSecret?: boolean } | null> {
  const { allowApiSecret = false, requireAdmin = false } = options;
  
  // Check API secret first (for server-to-server)
  if (allowApiSecret && verifyApiSecret(request)) {
    return { isApiSecret: true };
  }
  
  // Check user auth
  const authResult = await verifyAuthToken(request);
  
  if (!authResult.valid) {
    return null;
  }
  
  // Check admin requirement
  if (requireAdmin) {
    const isAdmin = await isAdminUser(request);
    if (!isAdmin) {
      return null;
    }
  }
  
  return {
    userId: authResult.userId,
    email: authResult.email,
  };
}
