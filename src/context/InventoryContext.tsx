import { createContext, use, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export interface ProductInventory {
  productId: string;
  productName: string;
  sku?: string;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestocked?: Date;
  lastSold?: Date;
  updatedAt?: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: "restock" | "sale" | "adjustment" | "return" | "reserved" | "released";
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

interface InventoryContextType {
  inventory: Record<string, ProductInventory>;
  loading: boolean;
  isAdmin: boolean;
  getProductStock: (productId: string) => number;
  getAvailableStock: (productId: string) => number;
  isLowStock: (productId: string) => boolean;
  isOutOfStock: (productId: string) => boolean;
  getLowStockProducts: () => ProductInventory[];
  getOutOfStockProducts: () => ProductInventory[];
  updateStock: (productId: string, newStock: number, notes?: string) => Promise<boolean>;
  restockProduct: (productId: string, quantity: number, notes?: string) => Promise<boolean>;
  adjustStock: (productId: string, adjustment: number, notes?: string) => Promise<boolean>;
  setLowStockThreshold: (productId: string, threshold: number) => Promise<boolean>;
  setReorderSettings: (productId: string, reorderPoint: number, reorderQuantity: number) => Promise<boolean>;
  bulkRestock: (items: { productId: string; quantity: number }[]) => Promise<boolean>;
  initializeInventory: (productId: string, productName: string, initialStock?: number) => Promise<boolean>;
  reserveStock: (productId: string, quantity: number) => Promise<boolean>;
  releaseReservedStock: (productId: string, quantity: number) => Promise<boolean>;
  confirmSale: (productId: string, quantity: number, orderId: string) => Promise<boolean>;
  getInventoryAlert: (productId: string) => { productId: string; stock: number; viewerCount: number } | null;
  trackProductView: (productId: string) => void;
  simulatePurchase: (productId: string) => void;
}

const DEFAULT_LOW_STOCK_THRESHOLD = 10;
const DEFAULT_REORDER_POINT = 15;
const DEFAULT_REORDER_QUANTITY = 50;
const DEFAULT_INITIAL_STOCK = 100;

const InventoryContext = createContext<InventoryContextType>({
  inventory: {},
  loading: true,
  isAdmin: false,
  getProductStock: () => 0,
  getAvailableStock: () => 0,
  isLowStock: () => false,
  isOutOfStock: () => true,
  getLowStockProducts: () => [],
  getOutOfStockProducts: () => [],
  updateStock: async () => false,
  restockProduct: async () => false,
  adjustStock: async () => false,
  setLowStockThreshold: async () => false,
  setReorderSettings: async () => false,
  bulkRestock: async () => false,
  initializeInventory: async () => false,
  reserveStock: async () => false,
  releaseReservedStock: async () => false,
  confirmSale: async () => false,
  getInventoryAlert: () => null,
  trackProductView: () => {},
  simulatePurchase: () => {},
});

export const useInventory = () => use(InventoryContext);

function mapRow(row: {
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
}): ProductInventory {
  return {
    productId: row.productId,
    productName: row.productName,
    sku: row.sku,
    currentStock: row.currentStock,
    reservedStock: row.reservedStock,
    lowStockThreshold: row.lowStockThreshold,
    reorderPoint: row.reorderPoint,
    reorderQuantity: row.reorderQuantity,
    lastRestocked: row.lastRestocked ? new Date(row.lastRestocked) : undefined,
    lastSold: row.lastSold ? new Date(row.lastSold) : undefined,
    updatedAt: new Date(row.updatedAt),
  };
}

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  const convexList = useQuery(api.inventory.list);
  const updateStockMut = useMutation(api.inventory.updateStock);
  const restockMut = useMutation(api.inventory.restock);
  const adjustMut = useMutation(api.inventory.adjust);
  const setThresholdsMut = useMutation(api.inventory.setThresholds);
  const bulkRestockMut = useMutation(api.inventory.bulkRestock);
  const initMut = useMutation(api.inventory.initialize);
  const reserveMut = useMutation(api.inventory.reserve);
  const releaseMut = useMutation(api.inventory.releaseReserved);
  const confirmSaleMut = useMutation(api.inventory.confirmSale);

  const [activeViewers, setActiveViewers] = useState<Record<string, number>>({});
  const isAdmin = userRole?.isAdmin ?? false;

  const inventory = useMemo(() => {
    const map: Record<string, ProductInventory> = {};
    if (convexList) {
      for (const row of convexList) {
        const inv = mapRow(row);
        map[inv.productId] = inv;
      }
    }
    return map;
  }, [convexList]);

  const loading = convexList === undefined;

  const getProductStock = useCallback(
    (productId: string) =>
      inventory[productId]?.currentStock ?? DEFAULT_INITIAL_STOCK,
    [inventory]
  );

  const getAvailableStock = useCallback(
    (productId: string) => {
      const inv = inventory[productId];
      if (!inv) return DEFAULT_INITIAL_STOCK;
      return Math.max(0, inv.currentStock - inv.reservedStock);
    },
    [inventory]
  );

  const isLowStock = useCallback(
    (productId: string) => {
      const inv = inventory[productId];
      if (!inv) return false;
      return inv.currentStock <= inv.lowStockThreshold && inv.currentStock > 0;
    },
    [inventory]
  );

  const isOutOfStock = useCallback(
    (productId: string) => {
      const inv = inventory[productId];
      if (!inv) return false;
      return inv.currentStock <= 0;
    },
    [inventory]
  );

  const getLowStockProducts = useCallback(
    () =>
      Object.values(inventory).filter(
        (inv) =>
          inv.currentStock <= inv.lowStockThreshold && inv.currentStock > 0
      ),
    [inventory]
  );

  const getOutOfStockProducts = useCallback(
    () => Object.values(inventory).filter((inv) => inv.currentStock <= 0),
    [inventory]
  );

  const updateStock = useCallback(
    async (productId: string, newStock: number, notes?: string) => {
      if (!isAdmin) return false;
      try {
        await updateStockMut({ productId, newStock, notes });
        return true;
      } catch {
        return false;
      }
    },
    [isAdmin, updateStockMut]
  );

  const restockProduct = useCallback(
    async (productId: string, quantity: number, notes?: string) => {
      if (!isAdmin || quantity <= 0) return false;
      try {
        await restockMut({ productId, quantity, notes });
        return true;
      } catch {
        return false;
      }
    },
    [isAdmin, restockMut]
  );

  const adjustStock = useCallback(
    async (productId: string, adjustment: number, notes?: string) => {
      if (!isAdmin) return false;
      try {
        await adjustMut({ productId, adjustment, notes });
        return true;
      } catch {
        return false;
      }
    },
    [isAdmin, adjustMut]
  );

  const setLowStockThreshold = useCallback(
    async (productId: string, threshold: number) => {
      if (!isAdmin) return false;
      try {
        await setThresholdsMut({ productId, lowStockThreshold: threshold });
        return true;
      } catch {
        return false;
      }
    },
    [isAdmin, setThresholdsMut]
  );

  const setReorderSettings = useCallback(
    async (productId: string, reorderPoint: number, reorderQuantity: number) => {
      if (!isAdmin) return false;
      try {
        await setThresholdsMut({ productId, reorderPoint, reorderQuantity });
        return true;
      } catch {
        return false;
      }
    },
    [isAdmin, setThresholdsMut]
  );

  const bulkRestock = useCallback(
    async (items: { productId: string; quantity: number }[]) => {
      if (!isAdmin) return false;
      try {
        await bulkRestockMut({ items });
        return true;
      } catch {
        return false;
      }
    },
    [isAdmin, bulkRestockMut]
  );

  const initializeInventory = useCallback(
    async (productId: string, productName: string, initialStock = DEFAULT_INITIAL_STOCK) => {
      try {
        await initMut({ productId, productName, initialStock });
        return true;
      } catch {
        return false;
      }
    },
    [initMut]
  );

  const reserveStock = useCallback(
    async (productId: string, quantity: number) => {
      try {
        return (await reserveMut({ productId, quantity })) ?? false;
      } catch {
        return false;
      }
    },
    [reserveMut]
  );

  const releaseReservedStock = useCallback(
    async (productId: string, quantity: number) => {
      try {
        return (await releaseMut({ productId, quantity })) ?? false;
      } catch {
        return false;
      }
    },
    [releaseMut]
  );

  const confirmSale = useCallback(
    async (productId: string, quantity: number, orderId: string) => {
      try {
        return (await confirmSaleMut({ productId, quantity, orderId })) ?? false;
      } catch {
        return false;
      }
    },
    [confirmSaleMut]
  );

  const getInventoryAlert = useCallback(
    (productId: string) => ({
      productId,
      stock: inventory[productId]?.currentStock ?? DEFAULT_INITIAL_STOCK,
      viewerCount: (activeViewers[productId] || 0) + Math.floor(Math.random() * 5) + 3,
    }),
    [inventory, activeViewers]
  );

  const trackProductView = useCallback((productId: string) => {
    setActiveViewers((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
    setTimeout(() => {
      setActiveViewers((prev) => ({
        ...prev,
        [productId]: Math.max(0, (prev[productId] || 0) - 1),
      }));
    }, 30000 + Math.random() * 60000);
  }, []);

  const simulatePurchase = useCallback((productId: string) => {
    void confirmSaleMut({
      productId,
      quantity: 1,
      orderId: `sim-${Date.now()}`,
    });
  }, [confirmSaleMut]);

  const contextValue = useMemo(
    () => ({
        inventory,
        loading,
        isAdmin,
        getProductStock,
        getAvailableStock,
        isLowStock,
        isOutOfStock,
        getLowStockProducts,
        getOutOfStockProducts,
        updateStock,
        restockProduct,
        adjustStock,
        setLowStockThreshold,
        setReorderSettings,
        bulkRestock,
        initializeInventory,
        reserveStock,
        releaseReservedStock,
        confirmSale,
        getInventoryAlert,
        trackProductView,
        simulatePurchase,
      }),
    [adjustStock, bulkRestock, confirmSale, getAvailableStock, getInventoryAlert, getLowStockProducts, getOutOfStockProducts, getProductStock, initializeInventory, inventory, isAdmin, isLowStock, isOutOfStock, loading, releaseReservedStock, reserveStock, restockProduct, setLowStockThreshold, setReorderSettings, simulatePurchase, trackProductView, updateStock]
  );

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};
