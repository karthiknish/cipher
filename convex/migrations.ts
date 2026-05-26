import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

async function runParallel<T>(items: T[], fn: (item: T) => Promise<void>): Promise<number> {
  await Promise.all(items.map(fn));
  return items.length;
}

const colorVariant = v.object({
  name: v.string(),
  hex: v.string(),
  image: v.string(),
  inStock: v.boolean(),
});

const sizeStock = v.object({
  size: v.string(),
  stock: v.number(),
});

const productImport = v.object({
  legacyId: v.string(),
  name: v.string(),
  price: v.number(),
  comparePrice: v.optional(v.number()),
  category: v.string(),
  description: v.string(),
  shortDescription: v.optional(v.string()),
  image: v.string(),
  images: v.optional(v.array(v.string())),
  sizes: v.optional(v.array(v.string())),
  sizeStock: v.optional(v.array(sizeStock)),
  colors: v.optional(v.array(colorVariant)),
  inStock: v.optional(v.boolean()),
  sku: v.optional(v.string()),
  weight: v.optional(v.number()),
  material: v.optional(v.string()),
  careInstructions: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  featured: v.optional(v.boolean()),
  isNew: v.optional(v.boolean()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});

/** CLI-only Firestore import (no user JWT). Run: npx convex run migrations:importProducts */
export const importProducts = internalMutation({
  args: { products: v.array(productImport) },
  handler: async (ctx, { products }) => {
    const imported = await runParallel(products, async (p) => {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", p.legacyId))
        .first();
      const now = Date.now();
      const data = {
        legacyId: p.legacyId,
        name: p.name,
        price: p.price,
        comparePrice: p.comparePrice,
        category: p.category,
        description: p.description,
        shortDescription: p.shortDescription,
        image: p.image,
        images: p.images,
        sizes: p.sizes,
        sizeStock: p.sizeStock,
        colors: p.colors,
        inStock: p.inStock,
        sku: p.sku,
        weight: p.weight,
        material: p.material,
        careInstructions: p.careInstructions,
        tags: p.tags,
        featured: p.featured,
        isNew: p.isNew,
        createdAt: p.createdAt ?? now,
        updatedAt: p.updatedAt ?? now,
      };
      if (existing) {
        await ctx.db.patch(existing._id, data);
      } else {
        await ctx.db.insert("products", data);
      }
    });
    return { imported };
  },
});

export const importOrders = internalMutation({
  args: {
    orders: v.array(
      v.object({
        legacyId: v.string(),
        userId: v.string(),
        userEmail: v.optional(v.string()),
        items: v.array(v.any()),
        subtotal: v.number(),
        shipping: v.number(),
        tax: v.number(),
        total: v.number(),
        status: v.string(),
        shippingAddress: v.any(),
        paymentMethod: v.string(),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { orders }) => {
    const imported = await runParallel(orders, async (o) => {
      const existing = await ctx.db
        .query("orders")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", o.legacyId))
        .first();
      const now = Date.now();
      const data = {
        legacyId: o.legacyId,
        userId: o.userId,
        userEmail: o.userEmail,
        items: o.items,
        subtotal: o.subtotal,
        shipping: o.shipping,
        tax: o.tax,
        total: o.total,
        status: o.status,
        shippingAddress: o.shippingAddress,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt ?? now,
        updatedAt: o.updatedAt ?? now,
      };
      if (existing) {
        await ctx.db.patch(existing._id, data);
      } else {
        await ctx.db.insert("orders", data);
      }
    });
    return { imported };
  },
});

export const importBlogs = internalMutation({
  args: {
    blogs: v.array(
      v.object({
        legacyId: v.string(),
        title: v.string(),
        slug: v.string(),
        excerpt: v.string(),
        content: v.string(),
        coverImage: v.string(),
        category: v.string(),
        tags: v.array(v.string()),
        author: v.object({ name: v.string(), avatar: v.string() }),
        status: v.union(
          v.literal("draft"),
          v.literal("published"),
          v.literal("scheduled")
        ),
        published: v.boolean(),
        publishedAt: v.optional(v.number()),
        scheduledFor: v.optional(v.number()),
        readTime: v.number(),
        views: v.number(),
        likes: v.number(),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { blogs }) => {
    const imported = await runParallel(blogs, async (b) => {
      const now = Date.now();
      const existing = await ctx.db
        .query("blogs")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", b.legacyId))
        .first();
      const data = { ...b, createdAt: b.createdAt ?? now, updatedAt: b.updatedAt ?? now };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("blogs", data);
    });
    return { imported };
  },
});

export const importPromoCodes = internalMutation({
  args: {
    promoCodes: v.array(
      v.object({
        legacyId: v.string(),
        code: v.string(),
        type: v.union(
          v.literal("percentage"),
          v.literal("fixed"),
          v.literal("freeShipping")
        ),
        value: v.number(),
        minPurchase: v.number(),
        maxDiscount: v.optional(v.number()),
        validUntil: v.number(),
        usageLimit: v.optional(v.number()),
        usedCount: v.number(),
        description: v.string(),
        applicableCategories: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, { promoCodes }) => {
    const imported = await runParallel(promoCodes, async (p) => {
      const existing = await ctx.db
        .query("promoCodes")
        .withIndex("by_code", (q) => q.eq("code", p.code))
        .first();
      if (existing) await ctx.db.patch(existing._id, { ...p, legacyId: p.code });
      else await ctx.db.insert("promoCodes", { ...p, legacyId: p.code });
    });
    return { imported };
  },
});

export const importEvents = internalMutation({
  args: { events: v.array(v.any()) },
  handler: async (ctx, { events }) => {
    const imported = await runParallel(events, async (e) => {
      const legacyId = String(e.id ?? e.legacyId);
      const existing = await ctx.db
        .query("events")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        title: String(e.title),
        description: String(e.description ?? ""),
        type: String(e.type ?? "popup"),
        imageUrl: String(e.imageUrl ?? e.image ?? ""),
        location: e.location ?? {},
        startDate: Number(e.startDate),
        endDate: Number(e.endDate ?? e.startDate),
        timezone: String(e.timezone ?? "America/New_York"),
        capacity: Number(e.capacity ?? 100),
        rsvpCount: Number(e.rsvpCount ?? 0),
        waitlistEnabled: Boolean(e.waitlistEnabled ?? true),
        isExclusive: Boolean(e.isExclusive ?? false),
        requiredTier: e.requiredTier,
        exclusiveProductIds: e.exclusiveProductIds ?? [],
        featuredProductIds: e.featuredProductIds ?? [],
        status: String(e.status ?? "upcoming"),
        featured: Boolean(e.featured ?? false),
        createdBy: String(e.createdBy ?? "admin"),
        createdAt: Number(e.createdAt ?? Date.now()),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("events", data);
    });
    return { imported };
  },
});

export const importStores = internalMutation({
  args: { stores: v.array(v.any()) },
  handler: async (ctx, { stores }) => {
    const imported = await runParallel(stores, async (s) => {
      const legacyId = String(s.id ?? s.legacyId);
      const existing = await ctx.db
        .query("stores")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        name: String(s.name),
        type: String(s.type ?? "flagship"),
        address: String(s.address ?? ""),
        city: String(s.city ?? ""),
        state: String(s.state ?? ""),
        zip: String(s.zip ?? ""),
        country: String(s.country ?? "United States"),
        coordinates: s.coordinates ?? { lat: 0, lng: 0 },
        hours: s.hours ?? {},
        hasPickup: Boolean(s.hasPickup ?? false),
        exclusiveProductIds: s.exclusiveProductIds ?? [],
        phone: String(s.phone ?? ""),
        email: String(s.email ?? ""),
        isActive: Boolean(s.isActive ?? true),
        imageUrl: s.imageUrl,
        createdAt: Number(s.createdAt ?? Date.now()),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("stores", data);
    });
    return { imported };
  },
});

export const importBundles = internalMutation({
  args: {
    bundles: v.array(
      v.object({
        legacyId: v.string(),
        name: v.string(),
        description: v.string(),
        tagline: v.string(),
        image: v.string(),
        productIds: v.array(v.string()),
        discountPercent: v.number(),
        featured: v.boolean(),
        category: v.string(),
        createdAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { bundles }) => {
    const imported = await runParallel(bundles, async (b) => {
      const existing = await ctx.db
        .query("bundles")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", b.legacyId))
        .first();
      const data = { ...b, createdAt: b.createdAt ?? Date.now() };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("bundles", data);
    });
    return { imported };
  },
});

export const importInventory = internalMutation({
  args: { items: v.array(v.any()) },
  handler: async (ctx, { items }) => {
    const imported = await runParallel(items, async (item) => {
      const productId = String(item.productId ?? item.id ?? item.legacyId);
      const existing = await ctx.db
        .query("inventory")
        .withIndex("by_product", (q) => q.eq("productId", productId))
        .first();
      const data = {
        legacyId: productId,
        productId,
        productName: String(item.productName ?? ""),
        sku: item.sku,
        currentStock: Number(item.currentStock ?? 100),
        reservedStock: Number(item.reservedStock ?? 0),
        lowStockThreshold: Number(item.lowStockThreshold ?? 10),
        reorderPoint: Number(item.reorderPoint ?? 15),
        reorderQuantity: Number(item.reorderQuantity ?? 50),
        updatedAt: Date.now(),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("inventory", data);
    });
    return { imported };
  },
});

export const importReviews = internalMutation({
  args: { reviews: v.array(v.any()) },
  handler: async (ctx, { reviews }) => {
    const imported = await runParallel(reviews, async (r) => {
      const legacyId = String(r.id ?? r.legacyId);
      const existing = await ctx.db
        .query("reviews")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        productId: String(r.productId),
        userId: String(r.userId),
        userEmail: String(r.userEmail ?? ""),
        userName: String(r.userName ?? ""),
        rating: Number(r.rating),
        title: String(r.title ?? ""),
        comment: String(r.comment ?? ""),
        verifiedPurchase: Boolean(r.verifiedPurchase),
        helpful: Number(r.helpful ?? 0),
        notHelpful: Number(r.notHelpful ?? 0),
        adminReply: r.adminReply,
        featured: Boolean(r.featured),
        status: String(r.status ?? "approved"),
        createdAt: Number(r.createdAt ?? Date.now()),
        updatedAt: Number(r.updatedAt ?? Date.now()),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("reviews", data);
    });
    return { imported };
  },
});

export const importLoyalty = internalMutation({
  args: { profiles: v.array(v.any()) },
  handler: async (ctx, { profiles }) => {
    const imported = await runParallel(profiles, async (p) => {
      const userId = String(p.userId ?? p.id);
      const existing = await ctx.db
        .query("loyalty")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      const data = { userId, profile: p, updatedAt: Date.now() };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("loyalty", data);
    });
    return { imported };
  },
});

export const importUserDocs = internalMutation({
  args: {
    collection: v.string(),
    docs: v.array(v.any()),
  },
  handler: async (ctx, { collection, docs }) => {
    const imported = await runParallel(docs, async (d) => {
      const userId = String(d.userId ?? d.id);
      const now = Date.now();
      if (collection === "wishlists") {
        const existing = await ctx.db
          .query("wishlists")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        const data = { userId, items: d.items ?? [], updatedAt: now };
        if (existing) await ctx.db.patch(existing._id, data);
        else await ctx.db.insert("wishlists", data);
      } else if (collection === "userProfiles") {
        const existing = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        const data = { userId, profile: d, updatedAt: now };
        if (existing) await ctx.db.patch(existing._id, data);
        else await ctx.db.insert("userProfiles", data);
      } else if (collection === "userAchievements") {
        const existing = await ctx.db
          .query("userAchievements")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        const row = { userId, data: d, updatedAt: now };
        if (existing) await ctx.db.patch(existing._id, row);
        else await ctx.db.insert("userAchievements", row);
      }
    });
    return { imported };
  },
});

export const importAnalyticsEvents = internalMutation({
  args: { events: v.array(v.any()) },
  handler: async (ctx, { events }) => {
    const imported = await runParallel(events, async (e) => {
      await ctx.db.insert("analyticsEvents", {
        category: String(e.category),
        payload: e.payload ?? e,
        createdAt: Number(e.createdAt ?? Date.now()),
      });
    });
    return { imported };
  },
});

export const importAnalyticsMetrics = internalMutation({
  args: { metrics: v.array(v.any()) },
  handler: async (ctx, { metrics }) => {
    const imported = await runParallel(metrics, async (m) => {
      const existing = await ctx.db
        .query("analyticsMetrics")
        .withIndex("by_type_date", (q) =>
          q.eq("metricType", String(m.metricType)).eq("date", String(m.date))
        )
        .first();
      const data = {
        metricType: String(m.metricType),
        date: String(m.date),
        count: Number(m.count ?? 0),
        updatedAt: Number(m.updatedAt ?? Date.now()),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("analyticsMetrics", data);
    });
    return { imported };
  },
});

export const importAnalyticsUserProfiles = internalMutation({
  args: { profiles: v.array(v.any()) },
  handler: async (ctx, { profiles }) => {
    const imported = await runParallel(profiles, async (p) => {
      const userId = String(p.userId);
      const existing = await ctx.db
        .query("analyticsUserProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      const data = {
        userId,
        properties: p.properties ?? p,
        updatedAt: Date.now(),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("analyticsUserProfiles", data);
    });
    return { imported };
  },
});

export const importLiveActivities = internalMutation({
  args: { activities: v.array(v.any()) },
  handler: async (ctx, { activities }) => {
    const imported = await runParallel(activities, async (a) => {
      await ctx.db.insert("liveActivities", {
        type: String(a.type ?? "view"),
        productId: String(a.productId ?? ""),
        productName: String(a.productName ?? ""),
        productImage: a.productImage,
        userName: String(a.userName ?? "Guest"),
        userId: a.userId,
        createdAt: Number(a.createdAt ?? Date.now()),
      });
    });
    return { imported };
  },
});

export const importInfluencers = internalMutation({
  args: { influencers: v.array(v.any()) },
  handler: async (ctx, { influencers }) => {
    const imported = await runParallel(influencers, async (i) => {
      const legacyId = String(i.id ?? i.legacyId);
      const existing = await ctx.db
        .query("influencers")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        userId: String(i.userId),
        username: String(i.username ?? legacyId).toLowerCase(),
        displayName: String(i.displayName ?? i.name ?? ""),
        bio: String(i.bio ?? ""),
        avatar: String(i.avatar ?? ""),
        coverImage: i.coverImage,
        socialLinks: i.socialLinks ?? {},
        commissionRate: Number(i.commissionRate ?? 10),
        tier: String(i.tier ?? "bronze"),
        isActive: Boolean(i.isActive ?? true),
        isVerified: Boolean(i.isVerified ?? false),
        curatedProducts: i.curatedProducts ?? [],
        featuredProducts: i.featuredProducts ?? [],
        totalEarnings: Number(i.totalEarnings ?? 0),
        pendingEarnings: Number(i.pendingEarnings ?? 0),
        totalSales: Number(i.totalSales ?? 0),
        totalClicks: Number(i.totalClicks ?? 0),
        totalConversions: Number(i.totalConversions ?? 0),
        conversionRate: Number(i.conversionRate ?? 0),
        joinedAt: Number(i.joinedAt ?? Date.now()),
        lastActiveAt: Number(i.lastActiveAt ?? Date.now()),
        payoutInfo: i.payoutInfo,
        liveStreamUrl: i.liveStreamUrl,
        isLive: Boolean(i.isLive ?? false),
        followers: Number(i.followers ?? 0),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("influencers", data);
    });
    return { imported };
  },
});

export const importInfluencerSales = internalMutation({
  args: { sales: v.array(v.any()) },
  handler: async (ctx, { sales }) => {
    const imported = await runParallel(sales, async (s) => {
      const legacyId = String(s.id ?? s.legacyId);
      const existing = await ctx.db
        .query("influencerSales")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        influencerId: String(s.influencerId),
        orderId: String(s.orderId),
        orderTotal: Number(s.orderTotal ?? 0),
        commission: Number(s.commission ?? 0),
        products: s.products ?? [],
        customerEmail: String(s.customerEmail ?? ""),
        status: String(s.status ?? "pending"),
        createdAt: Number(s.createdAt ?? Date.now()),
        paidAt: s.paidAt ? Number(s.paidAt) : undefined,
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("influencerSales", data);
    });
    return { imported };
  },
});

export const importInfluencerClicks = internalMutation({
  args: { clicks: v.array(v.any()) },
  handler: async (ctx, { clicks }) => {
    const imported = await runParallel(clicks, async (c) => {
      await ctx.db.insert("influencerClicks", {
        legacyId: String(c.id ?? c.legacyId),
        influencerId: String(c.influencerId),
        productId: c.productId,
        source: String(c.source ?? "direct"),
        converted: Boolean(c.converted ?? false),
        orderId: c.orderId,
        createdAt: Number(c.createdAt ?? Date.now()),
      });
    });
    return { imported };
  },
});

export const importInfluencerApplications = internalMutation({
  args: { applications: v.array(v.any()) },
  handler: async (ctx, { applications }) => {
    const imported = await runParallel(applications, async (a) => {
      const legacyId = String(a.id ?? a.legacyId);
      const existing = await ctx.db
        .query("influencerApplications")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        userId: String(a.userId),
        email: String(a.email ?? ""),
        name: String(a.name ?? ""),
        username: String(a.username ?? "").toLowerCase(),
        bio: String(a.bio ?? ""),
        socialLinks: a.socialLinks ?? {},
        followerCount: Number(a.followerCount ?? 0),
        reason: String(a.reason ?? ""),
        status: String(a.status ?? "pending"),
        submittedAt: Number(a.submittedAt ?? Date.now()),
        reviewedAt: a.reviewedAt ? Number(a.reviewedAt) : undefined,
        reviewedBy: a.reviewedBy,
        notes: a.notes,
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("influencerApplications", data);
    });
    return { imported };
  },
});

export const importBehaviorProfiles = internalMutation({
  args: { profiles: v.array(v.any()) },
  handler: async (ctx, { profiles }) => {
    const imported = await runParallel(profiles, async (p) => {
      const userId = String(p.userId);
      const existing = await ctx.db
        .query("behaviorProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      const data = { userId, profile: p.profile ?? p, updatedAt: Date.now() };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("behaviorProfiles", data);
    });
    return { imported };
  },
});

export const importBehaviorSessions = internalMutation({
  args: { sessions: v.array(v.any()) },
  handler: async (ctx, { sessions }) => {
    const imported = await runParallel(sessions, async (s) => {
      const sessionId = String(s.sessionId);
      const existing = await ctx.db
        .query("behaviorSessions")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .first();
      const data = {
        sessionId,
        userId: s.userId,
        status: String(s.status ?? "completed"),
        data: s.data ?? s,
        updatedAt: Number(s.updatedAt ?? Date.now()),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("behaviorSessions", data);
    });
    return { imported };
  },
});

export const importEmailCampaignLogs = internalMutation({
  args: { logs: v.array(v.any()) },
  handler: async (ctx, { logs }) => {
    const imported = await runParallel(logs, async (l) => {
      await ctx.db.insert("emailCampaignLogs", {
        type: String(l.type ?? "unknown"),
        recipientCount: Number(l.recipientCount ?? l.successCount ?? 0),
        subject: l.subject ?? l.type,
        metadata: l.metadata ?? {
          successCount: l.successCount,
          failureCount: l.failureCount,
          recipients: l.recipients,
          results: l.results,
        },
        createdAt: Number(l.createdAt ?? Date.now()),
      });
    });
    return { imported };
  },
});

export const importDesignContests = internalMutation({
  args: { contests: v.array(v.any()) },
  handler: async (ctx, { contests }) => {
    const imported = await runParallel(contests, async (c) => {
      const legacyId = String(c.id ?? c.legacyId);
      const existing = await ctx.db
        .query("designContests")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        title: String(c.title ?? ""),
        description: String(c.description ?? ""),
        designA: c.designA ?? {},
        designB: c.designB ?? {},
        status: String(c.status ?? "draft"),
        startDate: Number(c.startDate ?? Date.now()),
        endDate: Number(c.endDate ?? Date.now()),
        createdAt: Number(c.createdAt ?? Date.now()),
        createdBy: String(c.createdBy ?? "admin"),
        totalVotes: Number(c.totalVotes ?? 0),
        winner: c.winner,
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("designContests", data);
    });
    return { imported };
  },
});

export const importPricingRules = internalMutation({
  args: { rules: v.array(v.any()) },
  handler: async (ctx, { rules }) => {
    const now = Date.now();
    const imported = await runParallel(rules, async (r) => {
      const legacyId = String(r.id ?? r.legacyId);
      const existing = await ctx.db
        .query("pricingRules")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        type: String(r.type ?? "percentage"),
        productId: r.productId,
        category: r.category,
        discountPercent: r.discountPercent,
        discountAmount: r.discountAmount,
        multiplier: r.multiplier,
        minQuantity: r.minQuantity,
        startTime: r.startTime,
        endTime: r.endTime,
        isActive: Boolean(r.isActive ?? true),
        priority: Number(r.priority ?? 0),
        conditions: r.conditions,
        createdAt: Number(r.createdAt ?? now),
        updatedAt: Number(r.updatedAt ?? now),
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("pricingRules", data);
    });
    return { imported };
  },
});

export const importNewsletterSubscribers = internalMutation({
  args: { subscribers: v.array(v.any()) },
  handler: async (ctx, { subscribers }) => {
    const imported = await runParallel(subscribers, async (s) => {
      const legacyId = String(s.id ?? s.legacyId);
      const email = String(s.email ?? "").toLowerCase();
      const existing = await ctx.db
        .query("newsletterSubscribers")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      const data = {
        legacyId,
        email,
        source: String(s.source ?? "website"),
        status: String(s.status ?? "active"),
        subscribedAt: Number(s.subscribedAt ?? Date.now()),
        unsubscribedAt: s.unsubscribedAt,
        tags: s.tags ?? [],
        firstName: s.firstName,
        lastName: s.lastName,
        promoCodeSent: s.promoCodeSent,
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("newsletterSubscribers", data);
    });
    return { imported };
  },
});

export const importNewsletterCampaigns = internalMutation({
  args: { campaigns: v.array(v.any()) },
  handler: async (ctx, { campaigns }) => {
    const imported = await runParallel(campaigns, async (c) => {
      const legacyId = String(c.id ?? c.legacyId);
      const existing = await ctx.db
        .query("newsletterCampaigns")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId))
        .first();
      const data = {
        legacyId,
        subject: String(c.subject ?? ""),
        previewText: String(c.previewText ?? ""),
        content: String(c.content ?? ""),
        status: String(c.status ?? "draft"),
        scheduledFor: c.scheduledFor,
        sentAt: c.sentAt,
        recipientCount: Number(c.recipientCount ?? 0),
        openCount: Number(c.openCount ?? 0),
        clickCount: Number(c.clickCount ?? 0),
        createdAt: Number(c.createdAt ?? Date.now()),
        createdBy: String(c.createdBy ?? "admin"),
        tags: c.tags ?? [],
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("newsletterCampaigns", data);
    });
    return { imported };
  },
});

export const importAbandonedCarts = internalMutation({
  args: { carts: v.array(v.any()) },
  handler: async (ctx, { carts }) => {
    const imported = await runParallel(carts, async (c) => {
      const cartKey = String(c.cartKey ?? c.id ?? c.legacyId);
      const existing = await ctx.db
        .query("abandonedCarts")
        .withIndex("by_cart_key", (q) => q.eq("cartKey", cartKey))
        .first();
      const data = {
        cartKey,
        sessionId: String(c.sessionId ?? cartKey),
        userId: c.userId,
        email: c.email,
        items: c.items ?? [],
        total: Number(c.total ?? 0),
        recovered: Boolean(c.recovered ?? false),
        remindersSent: Number(c.remindersSent ?? 0),
        lastReminderAt: c.lastReminderAt,
        createdAt: Number(c.createdAt ?? Date.now()),
        updatedAt: Number(c.updatedAt ?? Date.now()),
        abandonedAt: Number(c.abandonedAt ?? c.updatedAt ?? Date.now()),
        recoveredAt: c.recoveredAt,
      };
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("abandonedCarts", data);
    });
    return { imported };
  },
});

export const importUserExtras = internalMutation({
  args: {
    collection: v.string(),
    docs: v.array(v.any()),
  },
  handler: async (ctx, { collection, docs }) => {
    const now = Date.now();
    const imported = await runParallel(docs, async (d) => {
      const userId = String(d.userId ?? d.id);
      if (collection === "spinWheelResults") {
        const existing = await ctx.db
          .query("spinWheelResults")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        const row = { userId, result: d.result ?? d, updatedAt: now };
        if (existing) await ctx.db.patch(existing._id, row);
        else await ctx.db.insert("spinWheelResults", row);
      } else if (collection === "userMeasurements") {
        const existing = await ctx.db
          .query("userMeasurements")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        const row = { userId, measurements: d.measurements ?? d, updatedAt: now };
        if (existing) await ctx.db.patch(existing._id, row);
        else await ctx.db.insert("userMeasurements", row);
      } else if (collection === "stockNotifications") {
        const existing = await ctx.db
          .query("stockNotifications")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        const row = {
          userId,
          subscriptions: d.subscriptions ?? d.items ?? [],
          updatedAt: now,
        };
        if (existing) await ctx.db.patch(existing._id, row);
        else await ctx.db.insert("stockNotifications", row);
      }
    });
    return { imported };
  },
});
