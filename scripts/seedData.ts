/**
 * Firebase Seed Data Script
 * 
 * Run with: npx tsx scripts/seedData.ts
 * 
 * This script seeds initial data for:
 * - Events
 * - Stores
 * - Style Challenges
 * - Achievements
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ serviceAccountKey.json not found in scripts/ directory");
  console.log("Please download it from Firebase Console > Project Settings > Service Accounts");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ============================================================================
// SEED DATA
// ============================================================================

const EVENTS = [
  {
    title: "CIPHER Pop-Up NYC",
    description: "Exclusive 3-day pop-up in SoHo featuring our new collection, live DJ sets, and limited edition drops available only at this event.",
    type: "popup",
    startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 17 * 24 * 60 * 60 * 1000)),
    location: {
      name: "SoHo Gallery Space",
      address: "123 Mercer St",
      city: "New York",
      state: "NY",
      zip: "10012",
      coordinates: { lat: 40.7223, lng: -73.9987 },
    },
    imageUrl: "/images/events/event_popup_nyc_1765007440899.png",
    capacity: 150,
    rsvpCount: 87,
    isFeatured: true,
    isExclusive: false,
    exclusiveProducts: ["limited-hoodie-001", "exclusive-tee-002"],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    title: "Streetwear Meetup LA",
    description: "Connect with fellow streetwear enthusiasts, trade rare pieces, and get early access to upcoming drops.",
    type: "meetup",
    startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)),
    location: {
      name: "The Hive LA",
      address: "456 Fairfax Ave",
      city: "Los Angeles",
      state: "CA",
      zip: "90036",
      coordinates: { lat: 34.0837, lng: -118.3615 },
    },
    imageUrl: "/images/events/event_meetup_la_1765007456974.png",
    capacity: 75,
    rsvpCount: 52,
    isFeatured: false,
    isExclusive: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    title: "VIP Gold Member Launch",
    description: "Exclusive preview of our Winter 2025 collection for Gold and Platinum members only. Champagne, personal styling, and 20% off.",
    type: "launch",
    startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)),
    endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000)),
    location: {
      name: "CIPHER Flagship",
      address: "789 5th Ave",
      city: "New York",
      state: "NY",
      zip: "10022",
      coordinates: { lat: 40.7614, lng: -73.9776 },
    },
    imageUrl: "/images/events/event_vip_launch_1765007471883.png",
    capacity: 50,
    rsvpCount: 38,
    isFeatured: false,
    isExclusive: true,
    requiredTier: "gold",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

const STORES = [
  {
    name: "CIPHER Flagship NYC",
    type: "flagship",
    address: "789 5th Avenue",
    city: "New York",
    state: "NY",
    zip: "10022",
    coordinates: { lat: 40.7614, lng: -73.9776 },
    phone: "(212) 555-0100",
    email: "nyc@cipher.com",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    hours: {
      monday: { open: "10:00", close: "20:00" },
      tuesday: { open: "10:00", close: "20:00" },
      wednesday: { open: "10:00", close: "20:00" },
      thursday: { open: "10:00", close: "21:00" },
      friday: { open: "10:00", close: "21:00" },
      saturday: { open: "10:00", close: "21:00" },
      sunday: { open: "11:00", close: "19:00" },
    },
    hasPickup: true,
    isActive: true,
    exclusiveProductIds: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    name: "CIPHER LA",
    type: "flagship",
    address: "456 Melrose Ave",
    city: "Los Angeles",
    state: "CA",
    zip: "90046",
    coordinates: { lat: 34.0836, lng: -118.3584 },
    phone: "(310) 555-0200",
    email: "la@cipher.com",
    imageUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=80",
    hours: {
      monday: { open: "11:00", close: "20:00" },
      tuesday: { open: "11:00", close: "20:00" },
      wednesday: { open: "11:00", close: "20:00" },
      thursday: { open: "11:00", close: "21:00" },
      friday: { open: "11:00", close: "21:00" },
      saturday: { open: "10:00", close: "21:00" },
      sunday: { open: "11:00", close: "19:00" },
    },
    hasPickup: true,
    isActive: true,
    exclusiveProductIds: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

const CHALLENGES = [
  {
    title: "Street Style Master",
    description: "Create a complete streetwear look using at least 3 CIPHER items. Share your outfit and get featured!",
    type: "outfit",
    difficulty: "medium",
    points: 500,
    startDate: admin.firestore.Timestamp.fromDate(new Date()),
    endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    requirements: {
      minItems: 3,
      categories: ["Tops", "Bottoms", "Accessories"],
    },
    prizes: ["500 loyalty points", "Featured on homepage", "10% off next order"],
    participantCount: 0,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    title: "Monochrome Challenge",
    description: "Put together an all-black or all-white outfit. Extra points for creative layering!",
    type: "outfit",
    difficulty: "easy",
    points: 250,
    startDate: admin.firestore.Timestamp.fromDate(new Date()),
    endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    requirements: {
      minItems: 2,
      colorScheme: ["black", "white"],
    },
    prizes: ["250 loyalty points", "Story feature"],
    participantCount: 0,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "first_purchase",
    name: "First Steps",
    description: "Make your first purchase",
    icon: "ShoppingBag",
    category: "shopping",
    tier: "bronze",
    points: 100,
    isHidden: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: "big_spender",
    name: "Big Spender",
    description: "Spend over $500 total",
    icon: "CurrencyDollar",
    category: "shopping",
    tier: "gold",
    points: 500,
    isHidden: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: "review_master",
    name: "Review Master",
    description: "Write 10 product reviews",
    icon: "Star",
    category: "engagement",
    tier: "silver",
    points: 300,
    isHidden: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Purchase from a launch within the first hour",
    icon: "Lightning",
    category: "special",
    tier: "platinum",
    points: 750,
    isHidden: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: "loyal_customer",
    name: "Loyal Customer",
    description: "Make purchases in 3 consecutive months",
    icon: "Heart",
    category: "loyalty",
    tier: "gold",
    points: 400,
    isHidden: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedEvents() {
  console.log("\n📅 Seeding Events...");
  const batch = db.batch();
  
  for (const event of EVENTS) {
    const ref = db.collection("events").doc();
    batch.set(ref, event);
    console.log(`  ✓ ${event.title}`);
  }
  
  await batch.commit();
  console.log(`  ✅ ${EVENTS.length} events created`);
}

async function seedStores() {
  console.log("\n🏪 Seeding Stores...");
  const batch = db.batch();
  
  for (const store of STORES) {
    const ref = db.collection("stores").doc();
    batch.set(ref, store);
    console.log(`  ✓ ${store.name}`);
  }
  
  await batch.commit();
  console.log(`  ✅ ${STORES.length} stores created`);
}

async function seedChallenges() {
  console.log("\n🏆 Seeding Style Challenges...");
  const batch = db.batch();
  
  for (const challenge of CHALLENGES) {
    const ref = db.collection("style_challenges").doc();
    batch.set(ref, challenge);
    console.log(`  ✓ ${challenge.title}`);
  }
  
  await batch.commit();
  console.log(`  ✅ ${CHALLENGES.length} challenges created`);
}

async function seedAchievements() {
  console.log("\n🎖️ Seeding Achievement Definitions...");
  const batch = db.batch();
  
  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    const ref = db.collection("achievement_definitions").doc(achievement.id);
    batch.set(ref, achievement);
    console.log(`  ✓ ${achievement.name}`);
  }
  
  await batch.commit();
  console.log(`  ✅ ${ACHIEVEMENT_DEFINITIONS.length} achievements created`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🌱 Starting Firebase Data Seeding...\n");
  console.log("=".repeat(50));
  
  try {
    await seedEvents();
    await seedStores();
    await seedChallenges();
    await seedAchievements();
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ All data seeded successfully!\n");
  } catch (error) {
    console.error("\n❌ Error seeding data:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
