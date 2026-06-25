import { authClient } from "@/lib/auth-client";

/** Convex JWT for Bearer auth on Next.js API routes. */
export async function getSessionBearerToken(): Promise<string | null> {
  const { data } = await authClient.convex.token({
    fetchOptions: { throw: false },
  });
  return data?.token ?? null;
}
