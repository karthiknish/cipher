import { Doc } from "../_generated/dataModel";

export type ProductDoc = Doc<"products">;

/** Client-facing product id (Firestore doc id or Convex id string). */
export function publicProductId(doc: ProductDoc): string {
  return doc.legacyId ?? doc._id;
}

function toTimestamp(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

export function docToClientProduct(doc: ProductDoc) {
  return {
    id: publicProductId(doc),
    name: doc.name,
    price: doc.price,
    comparePrice: doc.comparePrice,
    category: doc.category,
    description: doc.description,
    shortDescription: doc.shortDescription,
    image: doc.image,
    images: doc.images,
    sizes: doc.sizes,
    sizeStock: doc.sizeStock,
    colors: doc.colors,
    inStock: doc.inStock,
    sku: doc.sku,
    weight: doc.weight,
    material: doc.material,
    careInstructions: doc.careInstructions,
    tags: doc.tags,
    featured: doc.featured,
    isNew: doc.isNew,
    createdAt: toTimestamp(doc.createdAt),
    updatedAt: toTimestamp(doc.updatedAt),
  };
}
