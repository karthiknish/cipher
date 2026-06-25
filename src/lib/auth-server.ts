import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

const convexUrl = process.env.VITE_CONVEX_URL!;
const convexSiteUrl = process.env.VITE_CONVEX_SITE_URL!;

if (!convexUrl || !convexSiteUrl) {
  throw new Error(
    "VITE_CONVEX_URL and VITE_CONVEX_SITE_URL must be set in .env.local"
  );
}

export const { handler } = convexBetterAuthReactStart({
  convexUrl,
  convexSiteUrl,
});
