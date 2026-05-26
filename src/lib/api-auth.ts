/**
 * API Authentication & Authorization Utilities
 *
 * Uses Better Auth session tokens verified via Convex.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

const ADMIN_EMAILS = new Set(["karthik.nishanth06@gmail.com"]);

export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

export function rateLimitedResponse(
  retryAfterSec: number,
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: `Too many requests. Please try again in ${retryAfterSec} seconds.`,
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

export function badRequestResponse(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 400 }
  );
}

export function internalServerErrorResponse(
  message = "Internal server error"
): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}

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

export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

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

async function verifyBetterAuthToken(
  token: string
): Promise<{ valid: boolean; userId?: string; email?: string; admin?: boolean }> {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return { valid: false };
  }

  try {
    const sessionUser = await fetchQuery(api.users.getSessionUser, {}, { token });
    if (!sessionUser) {
      return { valid: false };
    }
    return {
      valid: true,
      userId: sessionUser.userId,
      email: sessionUser.email,
      admin: sessionUser.admin,
    };
  } catch {
    return { valid: false };
  }
}

export async function verifyAuthToken(
  request: NextRequest
): Promise<{ valid: boolean; userId?: string; email?: string; admin?: boolean }> {
  const token = extractBearerToken(request);

  if (!token) {
    return { valid: false };
  }

  return verifyBetterAuthToken(token);
}

export async function isAdminUser(request: NextRequest): Promise<boolean> {
  const token = extractBearerToken(request);

  if (!token) {
    return false;
  }

  const result = await verifyBetterAuthToken(token);
  if (!result.valid) {
    return false;
  }

  if (result.admin) {
    return true;
  }

  const email = result.email?.toLowerCase();
  return Boolean(email && ADMIN_EMAILS.has(email));
}

export function verifyApiSecret(request: NextRequest): boolean {
  const apiSecret = process.env.API_SECRET_KEY;

  if (!apiSecret) {
    console.warn("API_SECRET_KEY not configured - server-to-server calls will fail");
    return false;
  }

  const providedSecret = request.headers.get("X-API-Secret");
  return providedSecret === apiSecret;
}

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

export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): string | null {
  const missingFields = requiredFields.filter(
    (field) =>
      body[field] === undefined || body[field] === null || body[field] === ""
  );

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  return null;
}

export function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, "")
    .trim();
}

export async function requireAuth(
  request: NextRequest,
  options: { allowApiSecret?: boolean; requireAdmin?: boolean } = {}
): Promise<{ userId?: string; email?: string; isApiSecret?: boolean } | null> {
  const { allowApiSecret = false, requireAdmin = false } = options;

  if (allowApiSecret && verifyApiSecret(request)) {
    return { isApiSecret: true };
  }

  const authResult = await verifyAuthToken(request);

  if (!authResult.valid) {
    return null;
  }

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
