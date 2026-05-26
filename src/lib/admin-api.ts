"use client";

import { getSessionBearerToken } from "@/lib/session-token";

/**
 * Build headers with Better Auth / Convex JWT for admin-protected API routes.
 */
export async function getAdminAuthHeaders(
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  const token = await getSessionBearerToken();
  if (!token) {
    throw new Error("You must be signed in as an admin");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

/**
 * Authenticated fetch for admin API routes.
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAdminAuthHeaders();
  const mergedHeaders = {
    ...authHeaders,
    ...(options.headers as Record<string, string> | undefined),
  };
  return fetch(url, { ...options, headers: mergedHeaders });
}
