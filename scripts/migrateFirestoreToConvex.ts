/**
 * Firestore → Convex data migration (uses internal mutations via Convex CLI).
 *
 * Usage:
 *   npm run migrate:convex
 *   npm run migrate:convex -- --products-only
 *   npm run migrate:convex -- --deploy-prod
 *
 * Targets dev deployment by default (canny-porcupine-52). Override:
 *   CONVEX_URL=https://... npm run migrate:convex
 *
 * With --deploy-prod: also runs `npx convex deploy` and imports to prod URL
 * (CONVEX_PROD_URL or glorious-trout-382 if set in env).
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as path from "path";

const BATCH = 25;
const DEV_CONVEX_URL =
  "https://canny-porcupine-52.eu-west-1.convex.cloud";
const DEFAULT_PROD_CONVEX_URL =
  process.env.CONVEX_PROD_URL ??
  "https://glorious-trout-382.eu-west-1.convex.cloud";

const DEFAULT_PROMOS = [
  {
    legacyId: "WELCOME10",
    code: "WELCOME10",
    type: "percentage" as const,
    value: 10,
    minPurchase: 50,
    maxDiscount: 25,
    validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000,
    usageLimit: 1000,
    usedCount: 0,
    description: "10% off your first order",
  },
  {
    legacyId: "FREESHIP",
    code: "FREESHIP",
    type: "freeShipping" as const,
    value: 0,
    minPurchase: 75,
    validUntil: Date.now() + 180 * 24 * 60 * 60 * 1000,
    usedCount: 0,
    description: "Free shipping on orders over $75",
  },
];

function toMs(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return Date.now();
}

function initFirebase() {
  if (getApps().length) return getFirestore();
  const keyPath = path.join(__dirname, "serviceAccountKey.json");
  initializeApp({ credential: cert(keyPath) });
  return getFirestore();
}

function convexRun(
  functionPath: string,
  args: Record<string, unknown>,
  convexUrl: string
) {
  const dir = mkdtempSync(join(tmpdir(), "cipher-migrate-"));
  const file = join(dir, "args.json");
  writeFileSync(file, JSON.stringify(args));

  try {
    const cmd = `npx convex run --url "${convexUrl}" ${functionPath} "$(cat '${file}')"`;
    const out = execSync(cmd, {
      encoding: "utf8",
      cwd: path.join(__dirname, ".."),
      shell: "/bin/bash",
      maxBuffer: 50 * 1024 * 1024,
    });
    return out.trim();
  } finally {
    try {
      unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
}

function batchImport<T>(
  label: string,
  items: T[],
  fn: string,
  key: string,
  convexUrl: string,
  extra: Record<string, unknown> = {}
) {
  if (items.length === 0) {
    console.log(`  ${label}: none in Firestore`);
    return;
  }
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    const result = convexRun(fn, { ...extra, [key]: chunk }, convexUrl);
    console.log(
      `  ${label} ${Math.min(i + chunk.length, items.length)}/${items.length} → ${result}`
    );
  }
}

async function migrateProducts(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("products").get();
  console.log(`Found ${snap.size} products in Firestore`);

  const products = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      legacyId: doc.id,
      name: String(d.name ?? "Product"),
      price: Number(d.price ?? 0),
      comparePrice: d.comparePrice,
      category: String(d.category ?? "Apparel"),
      description: String(d.description ?? ""),
      shortDescription: d.shortDescription,
      image: String(d.image ?? ""),
      images: d.images,
      sizes: d.sizes,
      sizeStock: d.sizeStock,
      colors: d.colors,
      inStock: d.inStock,
      sku: d.sku,
      weight: d.weight,
      material: d.material,
      careInstructions: d.careInstructions,
      tags: d.tags,
      featured: d.featured,
      isNew: d.isNew,
      createdAt: toMs(d.createdAt),
      updatedAt: toMs(d.updatedAt),
    };
  });

  batchImport("Products", products, "migrations:importProducts", "products", convexUrl);
}

async function migrateOrders(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("orders").get();
  console.log(`Found ${snap.size} orders in Firestore`);

  const orders = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      legacyId: doc.id,
      userId: String(d.userId ?? ""),
      userEmail: d.userEmail,
      items: d.items ?? [],
      subtotal: Number(d.subtotal ?? d.total ?? 0),
      shipping: Number(d.shipping ?? 0),
      tax: Number(d.tax ?? 0),
      total: Number(d.total ?? 0),
      status: String(d.status ?? "pending"),
      shippingAddress: d.shippingAddress ?? {},
      paymentMethod: String(d.paymentMethod ?? "unknown"),
      createdAt: toMs(d.createdAt),
      updatedAt: toMs(d.updatedAt),
    };
  });

  batchImport("Orders", orders, "migrations:importOrders", "orders", convexUrl);
}

async function migrateBlogs(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("blogs").get();
  const blogs = snap.docs.map((doc) => {
    const d = doc.data();
    const status =
      d.status === "published" || d.published
        ? "published"
        : d.status === "scheduled"
          ? "scheduled"
          : "draft";
    return {
      legacyId: doc.id,
      title: String(d.title ?? ""),
      slug: String(d.slug ?? doc.id),
      excerpt: String(d.excerpt ?? ""),
      content: String(d.content ?? ""),
      coverImage: String(d.coverImage ?? d.image ?? ""),
      category: String(d.category ?? "Culture"),
      tags: Array.isArray(d.tags) ? d.tags : [],
      author: d.author ?? { name: "CIPHER", avatar: "" },
      status,
      published: status === "published",
      publishedAt: d.publishedAt ? toMs(d.publishedAt) : undefined,
      scheduledFor: d.scheduledFor ? toMs(d.scheduledFor) : undefined,
      readTime: Number(d.readTime ?? 3),
      views: Number(d.views ?? 0),
      likes: Number(d.likes ?? 0),
      createdAt: toMs(d.createdAt),
      updatedAt: toMs(d.updatedAt),
    };
  });
  batchImport("Blogs", blogs, "migrations:importBlogs", "blogs", convexUrl);
}

async function migratePromoCodes(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("promoCodes").get();
  type PromoImport = {
    legacyId: string;
    code: string;
    type: "percentage" | "fixed" | "freeShipping";
    value: number;
    minPurchase: number;
    maxDiscount?: number;
    validUntil: number;
    usageLimit?: number;
    usedCount: number;
    description: string;
    applicableCategories?: string[];
  };
  let promoCodes: PromoImport[] = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      legacyId: doc.id,
      code: String(d.code ?? doc.id).toUpperCase(),
      type: (d.type ?? "percentage") as "percentage" | "fixed" | "freeShipping",
      value: Number(d.value ?? 0),
      minPurchase: Number(d.minPurchase ?? 0),
      maxDiscount: d.maxDiscount,
      validUntil: toMs(d.validUntil ?? Date.now() + 86400000 * 90),
      usageLimit: d.usageLimit,
      usedCount: Number(d.usedCount ?? 0),
      description: String(d.description ?? ""),
      applicableCategories: d.applicableCategories,
    };
  });

  if (promoCodes.length === 0) {
    console.log("  No Firestore promos — seeding defaults");
    promoCodes = DEFAULT_PROMOS as PromoImport[];
  }

  batchImport(
    "Promo codes",
    promoCodes,
    "migrations:importPromoCodes",
    "promoCodes",
    convexUrl
  );
}

async function migrateEvents(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("events").get();
  const events = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startDate: toMs(doc.data().startDate),
    endDate: toMs(doc.data().endDate ?? doc.data().startDate),
    createdAt: toMs(doc.data().createdAt),
  }));
  batchImport("Events", events, "migrations:importEvents", "events", convexUrl);
}

async function migrateStores(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("stores").get();
  const stores = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toMs(doc.data().createdAt),
  }));
  batchImport("Stores", stores, "migrations:importStores", "stores", convexUrl);
}

async function migrateBundles(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("bundles").get();
  const bundles = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      legacyId: doc.id,
      name: String(d.name ?? ""),
      description: String(d.description ?? ""),
      tagline: String(d.tagline ?? ""),
      image: String(d.image ?? ""),
      productIds: d.productIds ?? [],
      discountPercent: Number(d.discountPercent ?? 10),
      featured: Boolean(d.featured ?? false),
      category: String(d.category ?? "essentials"),
      createdAt: toMs(d.createdAt),
    };
  });
  batchImport(
    "Bundles",
    bundles,
    "migrations:importBundles",
    "bundles",
    convexUrl
  );
}

async function runMigration(convexUrl: string, productsOnly: boolean) {
  console.log(`\n=== Importing to ${convexUrl} ===`);
  const db = initFirebase();

  await migrateProducts(db, convexUrl);
  if (productsOnly) return;

  await migrateOrders(db, convexUrl);
  await migrateBlogs(db, convexUrl);
  await migratePromoCodes(db, convexUrl);
  await migrateEvents(db, convexUrl);
  await migrateStores(db, convexUrl);
  await migrateBundles(db, convexUrl);
  await migrateInventory(db, convexUrl);
  await migrateReviews(db, convexUrl);
  await migrateLoyalty(db, convexUrl);
  await migrateUserDocs(db, convexUrl, "wishlists");
  await migrateUserDocs(db, convexUrl, "userProfiles");
  await migrateUserDocs(db, convexUrl, "userAchievements");
  await migrateDesignContests(db, convexUrl);
  await migratePricingRules(db, convexUrl);
  await migrateNewsletter(db, convexUrl);
  await migrateAbandonedCarts(db, convexUrl);
  await migrateAnalytics(db, convexUrl);
  await migrateLiveActivities(db, convexUrl);
  await migrateInfluencers(db, convexUrl);
  await migrateBehavior(db, convexUrl);
  await migrateEmailCampaigns(db, convexUrl);
  await migrateUserExtras(db, convexUrl);
}

/** Firestore analytics/events/{category} subcollections */
async function migrateAnalytics(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const categories = [
    "pageviews",
    "sessions",
    "ecommerce",
    "searches",
    "errors",
    "events",
    "conversions",
    "identifications",
    "timings",
    "pageExits",
    "beacons",
  ];
  const events: Array<{ category: string; payload: unknown; createdAt: number }> =
    [];

  for (const category of categories) {
    const snap = await db.collection("analytics").doc("events").collection(category).get();
    console.log(`  analytics/events/${category}: ${snap.size} docs`);
    for (const doc of snap.docs) {
      const data = doc.data();
      events.push({
        category,
        payload: data,
        createdAt: toMs(data.timestamp ?? data.createdAt ?? data.startTime),
      });
    }
  }
  batchImport(
    "Analytics events",
    events,
    "migrations:importAnalyticsEvents",
    "events",
    convexUrl
  );

  const metricsSnap = await db.collection("analytics").doc("metrics").listCollections();
  const metrics: Array<{ metricType: string; date: string; count: number; updatedAt: number }> =
    [];
  for (const col of metricsSnap) {
    const metricType = col.id;
    const dateSnap = await col.get();
    for (const dateDoc of dateSnap.docs) {
      const d = dateDoc.data();
      metrics.push({
        metricType,
        date: dateDoc.id,
        count: Number(d.count ?? 0),
        updatedAt: toMs(d.lastUpdated ?? d.updatedAt),
      });
    }
  }
  batchImport(
    "Analytics metrics",
    metrics,
    "migrations:importAnalyticsMetrics",
    "metrics",
    convexUrl
  );

  const profilesSnap = await db.collection("analytics").doc("users").collection("profiles").get();
  const profiles = profilesSnap.docs.map((doc) => ({
    userId: doc.id,
    properties: doc.data(),
  }));
  batchImport(
    "Analytics user profiles",
    profiles,
    "migrations:importAnalyticsUserProfiles",
    "profiles",
    convexUrl
  );
}

async function migrateLiveActivities(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("liveActivities").get();
  const activities = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      type: String(d.type ?? "view"),
      productId: String(d.productId ?? ""),
      productName: String(d.productName ?? ""),
      productImage: d.productImage,
      userName: String(d.userName ?? "Guest"),
      userId: d.userId,
      createdAt: toMs(d.timestamp ?? d.createdAt),
    };
  });
  batchImport(
    "Live activities",
    activities,
    "migrations:importLiveActivities",
    "activities",
    convexUrl
  );
}

async function migrateInfluencers(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const infSnap = await db.collection("influencers").get();
  const influencers = infSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport(
    "Influencers",
    influencers,
    "migrations:importInfluencers",
    "influencers",
    convexUrl
  );

  const salesSnap = await db.collection("influencerSales").get();
  const sales = salesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport(
    "Influencer sales",
    sales,
    "migrations:importInfluencerSales",
    "sales",
    convexUrl
  );

  const clicksSnap = await db.collection("influencerClicks").get();
  const clicks = clicksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport(
    "Influencer clicks",
    clicks,
    "migrations:importInfluencerClicks",
    "clicks",
    convexUrl
  );

  const appsSnap = await db.collection("influencerApplications").get();
  const applications = appsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport(
    "Influencer applications",
    applications,
    "migrations:importInfluencerApplications",
    "applications",
    convexUrl
  );
}

async function migrateBehavior(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const profilesSnap = await db
    .collection("customerBehavior")
    .doc("profiles")
    .collection("users")
    .get();
  const profiles = profilesSnap.docs.map((doc) => ({
    userId: doc.id,
    profile: doc.data(),
  }));
  batchImport(
    "Behavior profiles",
    profiles,
    "migrations:importBehaviorProfiles",
    "profiles",
    convexUrl
  );

  const sessions: Array<{
    sessionId: string;
    userId?: string;
    status: string;
    data: unknown;
    updatedAt: number;
  }> = [];

  for (const status of ["active", "completed"]) {
    const snap = await db
      .collection("customerBehavior")
      .doc("sessions")
      .collection(status)
      .get();
    console.log(`  customerBehavior/sessions/${status}: ${snap.size}`);
    for (const doc of snap.docs) {
      const d = doc.data();
      sessions.push({
        sessionId: doc.id,
        userId: d.userId,
        status,
        data: d,
        updatedAt: toMs(d.endTime ?? d.startTime ?? d.updatedAt),
      });
    }
  }
  batchImport(
    "Behavior sessions",
    sessions,
    "migrations:importBehaviorSessions",
    "sessions",
    convexUrl
  );

  const behaviorAnalytics: Array<{ category: string; payload: unknown; createdAt: number }> =
    [];
  const analyticsRoot = db.collection("customerBehavior").doc("analytics");
  const analyticsCols = await analyticsRoot.listCollections();
  for (const col of analyticsCols) {
    const category = `behavior:${col.id}`;
    const snap = await col.get();
    for (const doc of snap.docs) {
      behaviorAnalytics.push({
        category,
        payload: doc.data(),
        createdAt: toMs(doc.data().timestamp),
      });
    }
  }
  if (behaviorAnalytics.length > 0) {
    batchImport(
      "Behavior analytics events",
      behaviorAnalytics,
      "migrations:importAnalyticsEvents",
      "events",
      convexUrl
    );
  }
}

async function migrateEmailCampaigns(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("email_campaigns").get();
  const logs = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      type: String(d.type ?? "unknown"),
      recipientCount: Number(d.recipientCount ?? d.successCount ?? 0),
      subject: d.type,
      metadata: {
        successCount: d.successCount,
        failureCount: d.failureCount,
        recipients: d.recipients,
        results: d.results,
      },
      createdAt: toMs(d.createdAt),
    };
  });
  batchImport(
    "Email campaigns",
    logs,
    "migrations:importEmailCampaignLogs",
    "logs",
    convexUrl
  );
}

async function migrateUserExtras(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const spinSnap = await db.collection("spinWheelResults").get();
  const spinDocs = spinSnap.docs.map((doc) => ({
    userId: doc.id,
    result: doc.data(),
  }));
  batchImport(
    "Spin wheel",
    spinDocs,
    "migrations:importUserExtras",
    "docs",
    convexUrl,
    { collection: "spinWheelResults" }
  );

  const measureSnap = await db.collection("userMeasurements").get();
  const measureDocs = measureSnap.docs.map((doc) => ({
    userId: doc.id,
    measurements: doc.data(),
  }));
  batchImport(
    "User measurements",
    measureDocs,
    "migrations:importUserExtras",
    "docs",
    convexUrl,
    { collection: "userMeasurements" }
  );

  const stockSnap = await db.collection("stockNotifications").get();
  const stockDocs = stockSnap.docs.map((doc) => ({
    userId: doc.id,
    subscriptions: doc.data().subscriptions ?? [],
  }));
  batchImport(
    "Stock notifications",
    stockDocs,
    "migrations:importUserExtras",
    "docs",
    convexUrl,
    { collection: "stockNotifications" }
  );
}

async function migrateInventory(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("inventory").get();
  const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport("Inventory", items, "migrations:importInventory", "items", convexUrl);
}

async function migrateReviews(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("reviews").get();
  const reviews = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toMs(doc.data().createdAt),
    updatedAt: toMs(doc.data().updatedAt),
  }));
  batchImport("Reviews", reviews, "migrations:importReviews", "reviews", convexUrl);
}

async function migrateLoyalty(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("loyalty").get();
  const profiles = snap.docs.map((doc) => ({
    userId: doc.id,
    ...doc.data(),
  }));
  batchImport("Loyalty", profiles, "migrations:importLoyalty", "profiles", convexUrl);
}

async function migrateDesignContests(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("designContests").get();
  const contests = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport(
    "Design contests",
    contests,
    "migrations:importDesignContests",
    "contests",
    convexUrl
  );
}

async function migratePricingRules(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("pricingRules").get();
  const rules = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport(
    "Pricing rules",
    rules,
    "migrations:importPricingRules",
    "rules",
    convexUrl
  );
}

async function migrateNewsletter(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const subSnap = await db.collection("newsletter_subscribers").get();
  const subscribers = subSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport(
    "Newsletter subscribers",
    subscribers,
    "migrations:importNewsletterSubscribers",
    "subscribers",
    convexUrl
  );

  const campSnap = await db.collection("newsletter_campaigns").get();
  const campaigns = campSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  batchImport(
    "Newsletter campaigns",
    campaigns,
    "migrations:importNewsletterCampaigns",
    "campaigns",
    convexUrl
  );
}

async function migrateAbandonedCarts(
  db: FirebaseFirestore.Firestore,
  convexUrl: string
) {
  const snap = await db.collection("abandonedCarts").get();
  const carts = snap.docs.map((doc) => ({
    id: doc.id,
    cartKey: doc.id,
    ...doc.data(),
  }));
  batchImport(
    "Abandoned carts",
    carts,
    "migrations:importAbandonedCarts",
    "carts",
    convexUrl
  );
}

async function migrateUserDocs(
  db: FirebaseFirestore.Firestore,
  convexUrl: string,
  collectionName: string
) {
  const snap = await db.collection(collectionName).get();
  const docs = snap.docs.map((doc) => ({ userId: doc.id, ...doc.data() }));
  batchImport(
    collectionName,
    docs,
    "migrations:importUserDocs",
    "docs",
    convexUrl,
    { collection: collectionName }
  );
}

async function main() {
  const productsOnly = process.argv.includes("--products-only");
  const deployProd = process.argv.includes("--deploy-prod");
  const prodOnly = process.argv.includes("--prod-only");
  const root = path.join(__dirname, "..");

  const devUrl =
    process.env.CONVEX_URL ??
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    DEV_CONVEX_URL;
  const prodUrl = process.env.CONVEX_PROD_URL ?? DEFAULT_PROD_CONVEX_URL;

  if (prodOnly) {
    console.log("Deploying to production Convex...");
    execSync("npx convex deploy --yes", { stdio: "inherit", cwd: root });
    await runMigration(prodUrl, productsOnly);
    console.log("\nDone. Production data updated.");
    return;
  }

  console.log("Pushing functions to dev deployment...");
  execSync("npx convex dev --once", { stdio: "inherit", cwd: root });

  await runMigration(devUrl, productsOnly);

  if (deployProd) {
    console.log("\nDeploying to production Convex...");
    execSync("npx convex deploy --yes", { stdio: "inherit", cwd: root });
    await runMigration(prodUrl, productsOnly);
  }

  console.log("\nDone. Verify /shop, /blog, /events, and admin pages.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
