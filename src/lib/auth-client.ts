import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

const siteUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: siteUrl,
  plugins: [convexClient()],
});
