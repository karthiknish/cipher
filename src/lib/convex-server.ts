import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

let client: ConvexHttpClient | null = null;

export function getConvexServerClient() {
  const url = import.meta.env.VITE_CONVEX_URL;
  if (!url) throw new Error("VITE_CONVEX_URL is not set");
  if (!client) client = new ConvexHttpClient(url);
  return client;
}

export { api };
