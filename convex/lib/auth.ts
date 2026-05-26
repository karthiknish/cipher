import { QueryCtx, MutationCtx } from "../_generated/server";

const ADMIN_EMAILS = new Set(["karthik.nishanth06@gmail.com"]);

export type AuthCtx = QueryCtx | MutationCtx;

export async function getIdentity(ctx: AuthCtx) {
  return await ctx.auth.getUserIdentity();
}

export async function requireIdentity(ctx: AuthCtx) {
  const identity = await getIdentity(ctx);
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export async function isAdmin(ctx: AuthCtx): Promise<boolean> {
  const identity = await getIdentity(ctx);
  if (!identity) return false;

  const email = identity.email?.toLowerCase();
  if (email && ADMIN_EMAILS.has(email)) return true;

  const role =
    (identity as { role?: string }).role ??
    (identity.tokenIdentifier as string | undefined);
  if (role === "admin") return true;

  const userId = identity.subject;
  const user = await ctx.db
    .query("users")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", userId))
    .first();
  return user?.role === "admin";
}

export async function requireAdmin(ctx: AuthCtx) {
  const identity = await requireIdentity(ctx);

  const email = identity.email?.toLowerCase();
  if (email && ADMIN_EMAILS.has(email)) return identity;

  const role =
    (identity as { role?: string }).role ??
    (identity.tokenIdentifier as string | undefined);
  if (role === "admin") return identity;

  const user = await ctx.db
    .query("users")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", identity.subject))
    .first();
  if (user?.role !== "admin") {
    throw new Error("Admin access required");
  }
  return identity;
}
