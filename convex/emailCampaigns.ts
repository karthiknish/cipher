import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const logCampaign = mutation({
  args: {
    type: v.string(),
    recipientCount: v.number(),
    subject: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailCampaignLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    await requireAdmin(ctx);
    const docs = await ctx.db
      .query("emailCampaignLogs")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
    return docs;
  },
});
