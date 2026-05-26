import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

const ADMIN_EMAILS = new Set(["karthik.nishanth06@gmail.com"]);

/** Upsert app role row when a user signs in. */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;
    const email = identity.email?.toLowerCase();

    let existing = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", userId))
      .first();

    const now = Date.now();

    if (!existing && email) {
      const pending = await ctx.db
        .query("users")
        .withIndex("by_legacy_id", (q) =>
          q.eq("legacyId", `pending_${email}`)
        )
        .first();
      if (pending) {
        await ctx.db.patch(pending._id, {
          legacyId: userId,
          email: identity.email ?? pending.email,
          displayName: identity.name ?? pending.displayName,
          updatedAt: now,
        });
        existing = { ...pending, legacyId: userId };
      }
    }

    const role =
      email && ADMIN_EMAILS.has(email)
        ? ("admin" as const)
        : existing?.role ?? ("user" as const);

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: identity.email ?? existing.email,
        role,
        displayName: identity.name ?? existing.displayName,
        updatedAt: now,
      });
      return { role, isAdmin: role === "admin" };
    }

    await ctx.db.insert("users", {
      legacyId: userId,
      email: identity.email,
      role,
      displayName: identity.name,
      createdAt: now,
      updatedAt: now,
    });

    return { role, isAdmin: role === "admin" };
  },
});

/** Resolve session + admin role for Next.js API routes (Bearer Convex JWT). */
export const getSessionUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const email = identity.email?.toLowerCase();
    if (email && ADMIN_EMAILS.has(email)) {
      return {
        userId: identity.subject,
        email: identity.email,
        admin: true,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", identity.subject))
      .first();

    return {
      userId: identity.subject,
      email: identity.email,
      admin: user?.role === "admin",
    };
  },
});
