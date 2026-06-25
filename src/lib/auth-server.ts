import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

type AuthInstance = ReturnType<typeof convexBetterAuthReactStart>;

let _instance: AuthInstance | null = null;

function getInstance(): AuthInstance {
  if (_instance) return _instance;
  const convexUrl = process.env.VITE_CONVEX_URL;
  const convexSiteUrl = process.env.VITE_CONVEX_SITE_URL;
  if (!convexUrl || !convexSiteUrl) {
    throw new Error(
      "VITE_CONVEX_URL and VITE_CONVEX_SITE_URL must be set in the environment"
    );
  }
  _instance = convexBetterAuthReactStart({ convexUrl, convexSiteUrl });
  return _instance;
}

/** Lazily-initialized auth handler for TanStack Start server routes. */
export const handler: AuthInstance["handler"] = (request) =>
  getInstance().handler(request);
