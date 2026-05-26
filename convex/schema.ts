import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Shared validators for nested product fields */
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

export default defineSchema({
  /** Catalog — migrated from Firestore `products` */
  products: defineTable({
    legacyId: v.optional(v.string()),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_created_at", ["createdAt"]),

  /** Auth roles — migrated from Firestore `users` */
  users: defineTable({
    legacyId: v.string(),
    email: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_legacy_id", ["legacyId"]),

  orders: defineTable({
    legacyId: v.optional(v.string()),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_legacy_id", ["legacyId"])
    .index("by_created_at", ["createdAt"]),

  abandonedCarts: defineTable({
    cartKey: v.string(),
    sessionId: v.string(),
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
    items: v.array(v.any()),
    total: v.number(),
    recovered: v.boolean(),
    remindersSent: v.number(),
    lastReminderAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    abandonedAt: v.number(),
    recoveredAt: v.optional(v.number()),
  }).index("by_cart_key", ["cartKey"]),

  blogs: defineTable({
    legacyId: v.optional(v.string()),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.string(),
    coverImage: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    author: v.object({
      name: v.string(),
      avatar: v.string(),
    }),
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
    authorId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_legacy_id", ["legacyId"])
    .index("by_created_at", ["createdAt"]),

  bundles: defineTable({
    legacyId: v.optional(v.string()),
    name: v.string(),
    description: v.string(),
    tagline: v.string(),
    image: v.string(),
    productIds: v.array(v.string()),
    discountPercent: v.number(),
    featured: v.boolean(),
    category: v.string(),
    createdAt: v.number(),
  }).index("by_legacy_id", ["legacyId"]),

  promoCodes: defineTable({
    legacyId: v.optional(v.string()),
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
    .index("by_code", ["code"])
    .index("by_legacy_id", ["legacyId"]),

  events: defineTable({
    legacyId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    type: v.string(),
    imageUrl: v.string(),
    location: v.any(),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.string(),
    capacity: v.number(),
    rsvpCount: v.number(),
    waitlistEnabled: v.boolean(),
    isExclusive: v.boolean(),
    requiredTier: v.optional(v.string()),
    exclusiveProductIds: v.array(v.string()),
    featuredProductIds: v.array(v.string()),
    status: v.string(),
    featured: v.boolean(),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_start_date", ["startDate"]),

  stores: defineTable({
    legacyId: v.optional(v.string()),
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
    createdAt: v.number(),
  }).index("by_legacy_id", ["legacyId"]),

  eventRsvps: defineTable({
    legacyId: v.optional(v.string()),
    eventId: v.string(),
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    status: v.string(),
    createdAt: v.number(),
    checkedInAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_legacy_id", ["legacyId"]),

  wishlists: defineTable({
    userId: v.string(),
    items: v.array(v.any()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userProfiles: defineTable({
    userId: v.string(),
    profile: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  inventory: defineTable({
    legacyId: v.optional(v.string()),
    productId: v.string(),
    productName: v.string(),
    sku: v.optional(v.string()),
    currentStock: v.number(),
    reservedStock: v.number(),
    lowStockThreshold: v.number(),
    reorderPoint: v.number(),
    reorderQuantity: v.number(),
    lastRestocked: v.optional(v.number()),
    lastSold: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_legacy_id", ["legacyId"]),

  stockMovements: defineTable({
    productId: v.string(),
    type: v.string(),
    quantity: v.number(),
    previousStock: v.number(),
    newStock: v.number(),
    orderId: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_product", ["productId"]),

  reviews: defineTable({
    legacyId: v.optional(v.string()),
    productId: v.string(),
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
    media: v.optional(v.array(v.any())),
    images: v.optional(v.array(v.string())),
    verifiedPurchase: v.boolean(),
    helpful: v.number(),
    notHelpful: v.number(),
    adminReply: v.optional(v.any()),
    featured: v.boolean(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_legacy_id", ["legacyId"]),

  reviewVotes: defineTable({
    userId: v.string(),
    reviewId: v.string(),
    vote: v.string(),
  }).index("by_user_review", ["userId", "reviewId"]),

  loyalty: defineTable({
    userId: v.string(),
    profile: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  pricingRules: defineTable({
    legacyId: v.optional(v.string()),
    type: v.string(),
    productId: v.optional(v.string()),
    category: v.optional(v.string()),
    discountPercent: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    multiplier: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    isActive: v.boolean(),
    priority: v.number(),
    conditions: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_legacy_id", ["legacyId"]),

  newsletterSubscribers: defineTable({
    legacyId: v.optional(v.string()),
    email: v.string(),
    source: v.string(),
    status: v.string(),
    subscribedAt: v.number(),
    unsubscribedAt: v.optional(v.number()),
    tags: v.array(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    promoCodeSent: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_legacy_id", ["legacyId"]),

  newsletterCampaigns: defineTable({
    legacyId: v.optional(v.string()),
    subject: v.string(),
    previewText: v.string(),
    content: v.string(),
    status: v.string(),
    scheduledFor: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    recipientCount: v.number(),
    openCount: v.number(),
    clickCount: v.number(),
    createdAt: v.number(),
    createdBy: v.string(),
    tags: v.array(v.string()),
  }).index("by_legacy_id", ["legacyId"]),

  designContests: defineTable({
    legacyId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    designA: v.any(),
    designB: v.any(),
    status: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    createdAt: v.number(),
    createdBy: v.string(),
    totalVotes: v.number(),
    winner: v.optional(v.string()),
  }).index("by_legacy_id", ["legacyId"]),

  userAchievements: defineTable({
    userId: v.string(),
    data: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userMeasurements: defineTable({
    userId: v.string(),
    measurements: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  stockNotifications: defineTable({
    userId: v.string(),
    subscriptions: v.array(v.any()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  spinWheelResults: defineTable({
    userId: v.string(),
    result: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  analyticsEvents: defineTable({
    category: v.string(),
    payload: v.any(),
    createdAt: v.number(),
  })
    .index("by_category_created", ["category", "createdAt"])
    .index("by_created_at", ["createdAt"]),

  analyticsMetrics: defineTable({
    metricType: v.string(),
    date: v.string(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_type_date", ["metricType", "date"]),

  analyticsUserProfiles: defineTable({
    userId: v.string(),
    properties: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  liveActivities: defineTable({
    type: v.string(),
    productId: v.string(),
    productName: v.string(),
    productImage: v.optional(v.string()),
    userName: v.string(),
    userId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),

  productViewers: defineTable({
    productId: v.string(),
    sessionId: v.string(),
    lastActive: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_product_session", ["productId", "sessionId"]),

  influencers: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.string(),
    username: v.string(),
    displayName: v.string(),
    bio: v.string(),
    avatar: v.string(),
    coverImage: v.optional(v.string()),
    socialLinks: v.any(),
    commissionRate: v.number(),
    tier: v.string(),
    isActive: v.boolean(),
    isVerified: v.boolean(),
    curatedProducts: v.array(v.string()),
    featuredProducts: v.array(v.string()),
    totalEarnings: v.number(),
    pendingEarnings: v.number(),
    totalSales: v.number(),
    totalClicks: v.number(),
    totalConversions: v.number(),
    conversionRate: v.number(),
    joinedAt: v.number(),
    lastActiveAt: v.number(),
    payoutInfo: v.optional(v.any()),
    liveStreamUrl: v.optional(v.string()),
    isLive: v.boolean(),
    followers: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"])
    .index("by_legacy_id", ["legacyId"]),

  influencerSales: defineTable({
    legacyId: v.optional(v.string()),
    influencerId: v.string(),
    orderId: v.string(),
    orderTotal: v.number(),
    commission: v.number(),
    products: v.any(),
    customerEmail: v.string(),
    status: v.string(),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
  })
    .index("by_influencer", ["influencerId"])
    .index("by_legacy_id", ["legacyId"]),

  influencerClicks: defineTable({
    legacyId: v.optional(v.string()),
    influencerId: v.string(),
    productId: v.optional(v.string()),
    source: v.string(),
    converted: v.boolean(),
    orderId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_influencer", ["influencerId"]),

  influencerApplications: defineTable({
    legacyId: v.optional(v.string()),
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.string(),
    bio: v.string(),
    socialLinks: v.any(),
    followerCount: v.number(),
    reason: v.string(),
    status: v.string(),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_legacy_id", ["legacyId"]),

  behaviorProfiles: defineTable({
    userId: v.string(),
    profile: v.any(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  behaviorSessions: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.string()),
    status: v.string(),
    data: v.any(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_status", ["status"]),

  emailCampaignLogs: defineTable({
    type: v.string(),
    recipientCount: v.number(),
    subject: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
