import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin, requireIdentity } from "./lib/auth";

type Ctx = QueryCtx | MutationCtx;

async function findContest(ctx: Ctx, id: string) {
  const byLegacy = await ctx.db
    .query("designContests")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"designContests">)) ?? null;
  } catch {
    return null;
  }
}

function docToContest(doc: {
  _id: Id<"designContests">;
  legacyId?: string;
  title: string;
  description: string;
  designA: unknown;
  designB: unknown;
  status: string;
  startDate: number;
  endDate: number;
  createdAt: number;
  createdBy: string;
  totalVotes: number;
  winner?: string;
}) {
  return {
    id: doc.legacyId ?? doc._id,
    title: doc.title,
    description: doc.description,
    designA: doc.designA,
    designB: doc.designB,
    status: doc.status,
    startDate: doc.startDate,
    endDate: doc.endDate,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
    totalVotes: doc.totalVotes,
    winner: doc.winner,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("designContests").collect();
    return docs
      .map(docToContest)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    designA: v.any(),
    designB: v.any(),
    status: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const _id = await ctx.db.insert("designContests", {
      ...args,
      totalVotes: 0,
      createdAt: Date.now(),
    });
    return _id;
  },
});

export const update = mutation({
  args: { id: v.string(), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc = await findContest(ctx, id);
    if (!doc) throw new Error("Contest not found");
    await ctx.db.patch(doc._id, patch);
    return true;
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findContest(ctx, id);
    if (!doc) throw new Error("Contest not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});

export const vote = mutation({
  args: { contestId: v.string(), choice: v.union(v.literal("A"), v.literal("B")) },
  handler: async (ctx, { contestId, choice }) => {
    const [identity, doc] = await Promise.all([
      requireIdentity(ctx),
      findContest(ctx, contestId),
    ]);
    if (!doc || doc.status !== "active") return false;
    const userId = identity.subject;
    const designA = doc.designA as { voters?: string[]; votes?: number };
    const designB = doc.designB as { voters?: string[]; votes?: number };
    const aVoters = [...(designA.voters ?? [])].filter((v) => v !== userId);
    const bVoters = [...(designB.voters ?? [])].filter((v) => v !== userId);
    let aVotes = designA.votes ?? 0;
    let bVotes = designB.votes ?? 0;
    if ((designA.voters ?? []).includes(userId)) aVotes--;
    if ((designB.voters ?? []).includes(userId)) bVotes--;
    if (choice === "A") {
      aVoters.push(userId);
      aVotes++;
    } else {
      bVoters.push(userId);
      bVotes++;
    }
    await ctx.db.patch(doc._id, {
      designA: { ...designA, voters: aVoters, votes: aVotes },
      designB: { ...designB, voters: bVoters, votes: bVotes },
      totalVotes: aVotes + bVotes,
    });
    return true;
  },
});

export const close = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findContest(ctx, id);
    if (!doc) throw new Error("Contest not found");
    const a = (doc.designA as { votes?: number }).votes ?? 0;
    const b = (doc.designB as { votes?: number }).votes ?? 0;
    const winner = a > b ? "A" : b > a ? "B" : "tie";
    await ctx.db.patch(doc._id, { status: "closed", winner });
    return true;
  },
});
