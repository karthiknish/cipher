import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin, requireIdentity } from "./lib/auth";

type Ctx = QueryCtx | MutationCtx;

function eventPublicId(doc: { _id: Id<"events">; legacyId?: string }) {
  return doc.legacyId ?? doc._id;
}

function storePublicId(doc: { _id: Id<"stores">; legacyId?: string }) {
  return doc.legacyId ?? doc._id;
}

function docToEvent(doc: {
  _id: Id<"events">;
  legacyId?: string;
  title: string;
  description: string;
  type: string;
  imageUrl: string;
  location: unknown;
  startDate: number;
  endDate: number;
  timezone: string;
  capacity: number;
  rsvpCount: number;
  waitlistEnabled: boolean;
  isExclusive: boolean;
  requiredTier?: string;
  exclusiveProductIds: string[];
  featuredProductIds: string[];
  status: string;
  featured: boolean;
  createdBy: string;
  createdAt: number;
}) {
  return {
    id: eventPublicId(doc),
    title: doc.title,
    description: doc.description,
    type: doc.type,
    imageUrl: doc.imageUrl,
    location: doc.location,
    startDate: doc.startDate,
    endDate: doc.endDate,
    timezone: doc.timezone,
    capacity: doc.capacity,
    rsvpCount: doc.rsvpCount,
    waitlistEnabled: doc.waitlistEnabled,
    isExclusive: doc.isExclusive,
    requiredTier: doc.requiredTier,
    exclusiveProductIds: doc.exclusiveProductIds,
    featuredProductIds: doc.featuredProductIds,
    status: doc.status,
    featured: doc.featured,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
  };
}

function docToStore(doc: {
  _id: Id<"stores">;
  legacyId?: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  coordinates: unknown;
  hours: unknown;
  hasPickup: boolean;
  exclusiveProductIds: string[];
  phone: string;
  email: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: number;
}) {
  return {
    id: storePublicId(doc),
    name: doc.name,
    type: doc.type,
    address: doc.address,
    city: doc.city,
    state: doc.state,
    zip: doc.zip,
    country: doc.country,
    coordinates: doc.coordinates,
    hours: doc.hours,
    hasPickup: doc.hasPickup,
    exclusiveProductIds: doc.exclusiveProductIds,
    phone: doc.phone,
    email: doc.email,
    isActive: doc.isActive,
    imageUrl: doc.imageUrl,
    createdAt: doc.createdAt,
  };
}

async function findEvent(ctx: Ctx, id: string) {
  const byLegacy = await ctx.db
    .query("events")
    .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
    .first();
  if (byLegacy) return byLegacy;
  try {
    return (await ctx.db.get(id as Id<"events">)) ?? null;
  } catch {
    return null;
  }
}

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("events")
      .withIndex("by_start_date")
      .order("asc")
      .collect();
    return docs.map(docToEvent);
  },
});

export const listStores = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("stores").collect();
    return docs.map(docToStore);
  },
});

export const listUserRsvps = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const docs = await ctx.db
      .query("eventRsvps")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return docs.map((d) => ({
      id: d.legacyId ?? d._id,
      eventId: d.eventId,
      userId: d.userId,
      userEmail: d.userEmail,
      userName: d.userName,
      status: d.status,
      createdAt: d.createdAt,
      checkedInAt: d.checkedInAt,
    }));
  },
});

export const listEventRsvps = query({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const email = identity.email?.toLowerCase();
    const ADMIN_EMAILS = new Set(["karthik.nishanth06@gmail.com"]);
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", identity.subject))
      .first();
    if (!(email && ADMIN_EMAILS.has(email)) && user?.role !== "admin") return [];
    const docs = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    return docs.map((d) => ({
      id: d.legacyId ?? d._id,
      eventId: d.eventId,
      userId: d.userId,
      userEmail: d.userEmail,
      userName: d.userName,
      status: d.status,
      createdAt: d.createdAt,
      checkedInAt: d.checkedInAt,
    }));
  },
});

const eventInput = {
  title: v.string(),
  description: v.string(),
  type: v.string(),
  imageUrl: v.string(),
  location: v.any(),
  startDate: v.number(),
  endDate: v.number(),
  timezone: v.string(),
  capacity: v.number(),
  waitlistEnabled: v.boolean(),
  isExclusive: v.boolean(),
  requiredTier: v.optional(v.string()),
  exclusiveProductIds: v.array(v.string()),
  featuredProductIds: v.array(v.string()),
  status: v.string(),
  featured: v.boolean(),
  createdBy: v.string(),
};

export const createEvent = mutation({
  args: eventInput,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const _id = await ctx.db.insert("events", {
      ...args,
      rsvpCount: 0,
      createdAt: now,
    });
    await ctx.db.patch(_id, { legacyId: _id });
    return eventPublicId({ _id, legacyId: _id });
  },
});

export const updateEvent = mutation({
  args: { id: v.string(), patch: v.object(eventInput) },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const doc = await findEvent(ctx, id);
    if (!doc) throw new Error("Event not found");
    await ctx.db.patch(doc._id, patch);
    return true;
  },
});

export const removeEvent = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await findEvent(ctx, id);
    if (!doc) throw new Error("Event not found");
    await ctx.db.delete(doc._id);
    return true;
  },
});

const storeInput = {
  name: v.string(),
  type: v.string(),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  zip: v.string(),
  country: v.string(),
  coordinates: v.any(),
  hours: v.any(),
  hasPickup: v.boolean(),
  exclusiveProductIds: v.array(v.string()),
  phone: v.string(),
  email: v.string(),
  isActive: v.boolean(),
  imageUrl: v.optional(v.string()),
};

export const createStore = mutation({
  args: storeInput,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const _id = await ctx.db.insert("stores", {
      ...args,
      createdAt: Date.now(),
    });
    return storePublicId({ _id });
  },
});

export const updateStore = mutation({
  args: { id: v.string(), patch: v.object(storeInput) },
  handler: async (ctx, { id, patch }) => {
    await requireAdmin(ctx);
    const byLegacy = await ctx.db
      .query("stores")
      .withIndex("by_legacy_id", (q) => q.eq("legacyId", id))
      .first();
    const doc = byLegacy ?? (await ctx.db.get(id as Id<"stores">));
    if (!doc) throw new Error("Store not found");
    await ctx.db.patch(doc._id, patch);
    return true;
  },
});

export const rsvp = mutation({
  args: {
    eventId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, { eventId, userEmail, userName }) => {
    const [identity, event] = await Promise.all([
      requireIdentity(ctx),
      findEvent(ctx, eventId),
    ]);
    if (!event) throw new Error("Event not found");

    const existing = await ctx.db
      .query("eventRsvps")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    if (existing.some((r) => r.eventId === eventId && r.status !== "cancelled")) {
      return { ok: false, reason: "Already RSVPd" };
    }

    const _id = await ctx.db.insert("eventRsvps", {
      eventId,
      userId: identity.subject,
      userEmail,
      userName,
      status: "confirmed",
      createdAt: Date.now(),
      legacyId: undefined,
    });
    await Promise.all([
      ctx.db.patch(_id, { legacyId: _id }),
      ctx.db.patch(event._id, { rsvpCount: event.rsvpCount + 1 }),
    ]);
    return { ok: true, id: _id };
  },
});

export const cancelRsvp = mutation({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const identity = await requireIdentity(ctx);
    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    const rsvpDoc = rsvps.find((r) => r.eventId === eventId && r.status !== "cancelled");
    if (!rsvpDoc) return false;
    await ctx.db.patch(rsvpDoc._id, { status: "cancelled" });
    const event = await findEvent(ctx, eventId);
    if (event) {
      await ctx.db.patch(event._id, {
        rsvpCount: Math.max(0, event.rsvpCount - 1),
      });
    }
    return true;
  },
});

export const checkIn = mutation({
  args: { eventId: v.string(), userId: v.string() },
  handler: async (ctx, { eventId, userId }) => {
    await requireAdmin(ctx);
    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const rsvpDoc = rsvps.find((r) => r.userId === userId);
    if (!rsvpDoc) return false;
    await ctx.db.patch(rsvpDoc._id, {
      status: "checked-in",
      checkedInAt: Date.now(),
    });
    return true;
  },
});
