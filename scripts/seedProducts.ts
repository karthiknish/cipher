/**
 * Script to seed Firebase with default products
 * Run with: npx ts-node --project tsconfig.scripts.json scripts/seedProducts.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccountPath),
});

const db = getFirestore();

// Products to seed
const PRODUCTS = [
  { 
    name: "Cipher Hoodie", 
    price: 89, 
    category: "Hoodies", 
    description: "Premium heavyweight cotton hoodie with embroidered logo. Features a relaxed fit with ribbed cuffs and hem.", 
    image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Hoodie", 
    sizes: ["S", "M", "L", "XL"], 
    colors: [
      { name: "Black", hex: "#1a1a1a", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Hoodie+Black", inStock: true },
      { name: "Charcoal", hex: "#36454f", image: "https://placehold.co/600x800/36454f/ffffff?text=Hoodie+Charcoal", inStock: true },
      { name: "Navy", hex: "#000080", image: "https://placehold.co/600x800/000080/ffffff?text=Hoodie+Navy", inStock: true },
      { name: "Cream", hex: "#fffdd0", image: "https://placehold.co/600x800/fffdd0/1a1a1a?text=Hoodie+Cream", inStock: false },
    ],
    inStock: true,
    featured: true,
    isNew: false,
  },
  { 
    name: "Street Tee", 
    price: 45, 
    category: "Tees", 
    description: "Oversized fit tee made from organic cotton. Soft hand feel with minimal branding.", 
    image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Tee", 
    sizes: ["S", "M", "L", "XL"], 
    colors: [
      { name: "Black", hex: "#1a1a1a", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Tee+Black", inStock: true },
      { name: "White", hex: "#ffffff", image: "https://placehold.co/600x800/ffffff/1a1a1a?text=Tee+White", inStock: true },
      { name: "Gray", hex: "#808080", image: "https://placehold.co/600x800/808080/ffffff?text=Tee+Gray", inStock: true },
    ],
    inStock: true,
    featured: false,
    isNew: true,
  },
  { 
    name: "Cargo Pants", 
    price: 95, 
    category: "Pants", 
    description: "Functional cargo pants with multiple pockets and adjustable fit. Made from durable ripstop fabric.", 
    image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Pants", 
    sizes: ["S", "M", "L", "XL"], 
    colors: [
      { name: "Black", hex: "#1a1a1a", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Cargo+Black", inStock: true },
      { name: "Olive", hex: "#556b2f", image: "https://placehold.co/600x800/556b2f/ffffff?text=Cargo+Olive", inStock: true },
      { name: "Khaki", hex: "#c3b091", image: "https://placehold.co/600x800/c3b091/1a1a1a?text=Cargo+Khaki", inStock: true },
    ],
    inStock: true,
    featured: true,
    isNew: false,
  },
  { 
    name: "Cap", 
    price: 35, 
    category: "Accessories", 
    description: "Classic 6-panel cap with adjustable strap. Embroidered logo on front.", 
    image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Cap", 
    sizes: ["One Size"], 
    colors: [
      { name: "Black", hex: "#1a1a1a", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Cap+Black", inStock: true },
      { name: "White", hex: "#ffffff", image: "https://placehold.co/600x800/ffffff/1a1a1a?text=Cap+White", inStock: true },
    ],
    inStock: true,
    featured: false,
    isNew: false,
  },
  { 
    name: "Oversized Tee", 
    price: 55, 
    category: "Tees", 
    description: "Vintage wash oversized tee with dropped shoulders. Pre-shrunk cotton.", 
    image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Oversized", 
    sizes: ["S", "M", "L", "XL"], 
    colors: [
      { name: "Washed Black", hex: "#2c2c2c", image: "https://placehold.co/600x800/2c2c2c/ffffff?text=Oversized+Black", inStock: true },
      { name: "Washed Gray", hex: "#6e6e6e", image: "https://placehold.co/600x800/6e6e6e/ffffff?text=Oversized+Gray", inStock: true },
      { name: "Stone", hex: "#d4c4b0", image: "https://placehold.co/600x800/d4c4b0/1a1a1a?text=Oversized+Stone", inStock: true },
      { name: "Sage", hex: "#9dc183", image: "https://placehold.co/600x800/9dc183/1a1a1a?text=Oversized+Sage", inStock: true },
    ],
    inStock: true,
    featured: false,
    isNew: true,
  },
  { 
    name: "Tactical Vest", 
    price: 120, 
    category: "Outerwear", 
    description: "Utility vest with modular attachments. Multiple pockets for everyday carry.", 
    image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Vest", 
    sizes: ["S", "M", "L", "XL"], 
    colors: [
      { name: "Black", hex: "#1a1a1a", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Vest+Black", inStock: true },
      { name: "Olive", hex: "#556b2f", image: "https://placehold.co/600x800/556b2f/ffffff?text=Vest+Olive", inStock: true },
    ],
    inStock: true,
    featured: true,
    isNew: false,
  },
];

async function seedProducts() {
  console.log("Starting product seeding...\n");

  // First, delete all existing products
  console.log("Clearing existing products...");
  const existingProducts = await db.collection("products").get();
  const deletePromises = existingProducts.docs.map((doc) => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log(`Deleted ${existingProducts.size} existing products.\n`);

  // Add new products
  console.log("Adding products to Firebase...\n");
  
  for (const product of PRODUCTS) {
    const docRef = await db.collection("products").add({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✓ Added: ${product.name} (ID: ${docRef.id})`);
  }

  console.log(`\n✅ Successfully seeded ${PRODUCTS.length} products to Firebase!`);
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding products:", error);
    process.exit(1);
  });
