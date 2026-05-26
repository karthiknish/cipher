import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  tags?: string[];
}

const FALLBACK_CATALOG = `1. id: "1" - Cipher Hoodie ($89) - Premium heavyweight cotton hoodie
2. id: "2" - Street Tee ($45) - Oversized organic cotton tee
3. id: "3" - Cargo Pants ($95) - Functional cargo pants`;

/**
 * Build style-agent product catalog text from Convex (falls back to static list).
 */
export async function buildStyleAgentCatalog(): Promise<string> {
  try {
    const products = await fetchQuery(api.products.list, {});
    if (!products.length) return FALLBACK_CATALOG;

    const lines = products.map((p, index) => {
      const name = String(p.name || "Product").slice(0, 80);
      const price = typeof p.price === "number" ? p.price : 0;
      const category = String(p.category || "Apparel").slice(0, 40);
      const desc = String(p.shortDescription || p.description || "").slice(0, 120);
      const tags = Array.isArray(p.tags) ? p.tags.slice(0, 5).join(", ") : "";
      return `${index + 1}. id: "${p.id}" - ${name} ($${price}) - ${category}. ${desc}${tags ? ` Tags: ${tags}` : ""}`;
    });

    return lines.join("\n");
  } catch (error) {
    console.error("[server-products] Failed to load catalog from Convex:", error);
    return FALLBACK_CATALOG;
  }
}
