import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

type InvCtx = QueryCtx | MutationCtx;

function docToInventory(doc: {
  _id: string;
  productId: string;
  productName: string;
  sku?: string;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestocked?: number;
  lastSold?: number;
  updatedAt: number;
}) {
  return {
    productId: doc.productId,
    productName: doc.productName,
    sku: doc.sku,
    currentStock: doc.currentStock,
    reservedStock: doc.reservedStock,
    lowStockThreshold: doc.lowStockThreshold,
    reorderPoint: doc.reorderPoint,
    reorderQuantity: doc.reorderQuantity,
    lastRestocked: doc.lastRestocked,
    lastSold: doc.lastSold,
    updatedAt: doc.updatedAt,
  };
}

async function findByProductId(ctx: InvCtx, productId: string) {
  return await ctx.db
    .query("inventory")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .first();
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("inventory").collect();
    return docs.map(docToInventory);
  },
});

async function recordMovement(
  ctx: MutationCtx,
  args: {
    productId: string;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    orderId?: string;
    notes?: string;
    createdBy?: string;
  }
) {
  await ctx.db.insert("stockMovements", {
    ...args,
    createdAt: Date.now(),
  });
}

export const initialize = mutation({
  args: {
    productId: v.string(),
    productName: v.string(),
    initialStock: v.optional(v.number()),
  },
  handler: async (ctx, { productId, productName, initialStock = 100 }) => {
    const existing = await findByProductId(ctx, productId);
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { productName, updatedAt: now });
      return true;
    }
    await ctx.db.insert("inventory", {
      productId,
      legacyId: productId,
      productName,
      currentStock: initialStock,
      reservedStock: 0,
      lowStockThreshold: 10,
      reorderPoint: 15,
      reorderQuantity: 50,
      updatedAt: now,
    });
    await recordMovement(ctx, {
      productId,
      type: "restock",
      quantity: initialStock,
      previousStock: 0,
      newStock: initialStock,
      notes: "Initial inventory",
    });
    return true;
  },
});

export const updateStock = mutation({
  args: {
    productId: v.string(),
    newStock: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { productId, newStock, notes }) => {
    await requireAdmin(ctx);
    const inv = await findByProductId(ctx, productId);
    if (!inv) throw new Error("Inventory not found");
    const previousStock = inv.currentStock;
    await ctx.db.patch(inv._id, { currentStock: newStock, updatedAt: Date.now() });
    await recordMovement(ctx, {
      productId,
      type: "adjustment",
      quantity: newStock - previousStock,
      previousStock,
      newStock,
      notes,
    });
    return true;
  },
});

export const restock = mutation({
  args: {
    productId: v.string(),
    quantity: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { productId, quantity, notes }) => {
    await requireAdmin(ctx);
    const inv = await findByProductId(ctx, productId);
    if (!inv) throw new Error("Inventory not found");
    const previousStock = inv.currentStock;
    const newStock = previousStock + quantity;
    const now = Date.now();
    await ctx.db.patch(inv._id, {
      currentStock: newStock,
      lastRestocked: now,
      updatedAt: now,
    });
    await recordMovement(ctx, {
      productId,
      type: "restock",
      quantity,
      previousStock,
      newStock,
      notes: notes ?? `Restocked ${quantity} units`,
    });
    return true;
  },
});

export const adjust = mutation({
  args: {
    productId: v.string(),
    adjustment: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { productId, adjustment, notes }) => {
    await requireAdmin(ctx);
    const inv = await findByProductId(ctx, productId);
    if (!inv) throw new Error("Inventory not found");
    const previousStock = inv.currentStock;
    const newStock = Math.max(0, previousStock + adjustment);
    await ctx.db.patch(inv._id, { currentStock: newStock, updatedAt: Date.now() });
    await recordMovement(ctx, {
      productId,
      type: "adjustment",
      quantity: adjustment,
      previousStock,
      newStock,
      notes,
    });
    return true;
  },
});

export const setThresholds = mutation({
  args: {
    productId: v.string(),
    lowStockThreshold: v.optional(v.number()),
    reorderPoint: v.optional(v.number()),
    reorderQuantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const inv = await findByProductId(ctx, args.productId);
    if (!inv) throw new Error("Inventory not found");
    const patch: Record<string, number> = { updatedAt: Date.now() };
    if (args.lowStockThreshold !== undefined)
      patch.lowStockThreshold = args.lowStockThreshold;
    if (args.reorderPoint !== undefined) patch.reorderPoint = args.reorderPoint;
    if (args.reorderQuantity !== undefined)
      patch.reorderQuantity = args.reorderQuantity;
    await ctx.db.patch(inv._id, patch);
    return true;
  },
});

export const bulkRestock = mutation({
  args: {
    items: v.array(v.object({ productId: v.string(), quantity: v.number() })),
  },
  handler: async (ctx, { items }) => {
    await requireAdmin(ctx);
    await Promise.all(
      items.map(async (item) => {
        const inv = await findByProductId(ctx, item.productId);
        if (!inv) return;
        const previousStock = inv.currentStock;
        const newStock = previousStock + item.quantity;
        const now = Date.now();
        await ctx.db.patch(inv._id, {
          currentStock: newStock,
          lastRestocked: now,
          updatedAt: now,
        });
        await recordMovement(ctx, {
          productId: item.productId,
          type: "restock",
          quantity: item.quantity,
          previousStock,
          newStock,
          notes: "Bulk restock",
        });
      })
    );
    return true;
  },
});

export const reserve = mutation({
  args: { productId: v.string(), quantity: v.number() },
  handler: async (ctx, { productId, quantity }) => {
    const inv = await findByProductId(ctx, productId);
    if (!inv || inv.currentStock - inv.reservedStock < quantity) return false;
    await ctx.db.patch(inv._id, {
      reservedStock: inv.reservedStock + quantity,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const releaseReserved = mutation({
  args: { productId: v.string(), quantity: v.number() },
  handler: async (ctx, { productId, quantity }) => {
    const inv = await findByProductId(ctx, productId);
    if (!inv) return false;
    await ctx.db.patch(inv._id, {
      reservedStock: Math.max(0, inv.reservedStock - quantity),
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const confirmSale = mutation({
  args: {
    productId: v.string(),
    quantity: v.number(),
    orderId: v.string(),
  },
  handler: async (ctx, { productId, quantity, orderId }) => {
    const inv = await findByProductId(ctx, productId);
    if (!inv) return false;
    const previousStock = inv.currentStock;
    const newStock = Math.max(0, previousStock - quantity);
    const now = Date.now();
    await ctx.db.patch(inv._id, {
      currentStock: newStock,
      reservedStock: Math.max(0, inv.reservedStock - quantity),
      lastSold: now,
      updatedAt: now,
    });
    await recordMovement(ctx, {
      productId,
      type: "sale",
      quantity: -quantity,
      previousStock,
      newStock,
      orderId,
      notes: `Order #${orderId}`,
    });
    return true;
  },
});
