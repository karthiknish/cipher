"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [inventory, setInventory] = useState<Record<string, ProductInventory>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeViewers, setActiveViewers] = useState<Record<string, number>>({});

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const token = await user.getIdTokenResult();
        setIsAdmin(token.claims.admin === true);
      } else {
        setCurrentUserId(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to inventory changes from Firebase
  useEffect(() => {
    const inventoryRef = collection(db, "inventory");
    
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const inventoryData: Record<string, ProductInventory> = {};
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        inventoryData[docSnap.id] = {
          productId: docSnap.id,
          productName: data.productName || "",
          sku: data.sku,
          currentStock: data.currentStock ?? DEFAULT_INITIAL_STOCK,
          reservedStock: data.reservedStock || 0,
          lowStockThreshold: data.lowStockThreshold || DEFAULT_LOW_STOCK_THRESHOLD,
          reorderPoint: data.reorderPoint || DEFAULT_REORDER_POINT,
          reorderQuantity: data.reorderQuantity || DEFAULT_REORDER_QUANTITY,
          lastRestocked: data.lastRestocked?.toDate?.(),
          lastSold: data.lastSold?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
        };
      });
      
      setInventory(inventoryData);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch inventory:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getProductStock = useCallback((productId: string): number => {
    return inventory[productId]?.currentStock ?? DEFAULT_INITIAL_STOCK;
  }, [inventory]);

  const getAvailableStock = useCallback((productId: string): number => {
    const inv = inventory[productId];
    if (!inv) return DEFAULT_INITIAL_STOCK;
    return Math.max(0, inv.currentStock - inv.reservedStock);
  }, [inventory]);

  const isLowStock = useCallback((productId: string): boolean => {
    const inv = inventory[productId];
    if (!inv) return false;
    return inv.currentStock <= inv.lowStockThreshold && inv.currentStock > 0;
  }, [inventory]);

  const isOutOfStock = useCallback((productId: string): boolean => {
    const inv = inventory[productId];
    if (!inv) return false;
    return inv.currentStock <= 0;
  }, [inventory]);

  const getLowStockProducts = useCallback((): ProductInventory[] => {
    return Object.values(inventory).filter(
      inv => inv.currentStock <= inv.lowStockThreshold && inv.currentStock > 0
    );
  }, [inventory]);

  const getOutOfStockProducts = useCallback((): ProductInventory[] => {
    return Object.values(inventory).filter(inv => inv.currentStock <= 0);
  }, [inventory]);

  const recordMovement = async (
    productId: string,
    type: StockMovement["type"],
    quantity: number,
    previousStock: number,
    newStock: number,
    orderId?: string,
    notes?: string
  ) => {
    try {
      const movementRef = doc(collection(db, "stockMovements"));
      await setDoc(movementRef, {
        productId,
        type,
        quantity,
        previousStock,
        newStock,
        orderId: orderId || null,
        notes: notes || null,
        createdAt: serverTimestamp(),
        createdBy: currentUserId || null,
      });
    } catch (error) {
      console.error("Failed to record stock movement:", error);
    }
  };

  const updateStock = useCallback(async (
    productId: string,
    newStock: number,
    notes?: string
  ): Promise<boolean> => {
    if (!isAdmin) return false;
    
    try {
      const previousStock = inventory[productId]?.currentStock || 0;
      const inventoryRef = doc(db, "inventory", productId);
      
      await updateDoc(inventoryRef, {
        currentStock: newStock,
        updatedAt: serverTimestamp(),
      });
      
      await recordMovement(productId, "adjustment", newStock - previousStock, previousStock, newStock, undefined, notes);
      return true;
    } catch (error) {
      console.error("Failed to update stock:", error);
      return false;
    }
  }, [isAdmin, inventory, currentUserId]);

  const restockProduct = useCallback(async (
    productId: string,
    quantity: number,
    notes?: string
  ): Promise<boolean> => {
    if (!isAdmin || quantity <= 0) return false;
    
    try {
      const previousStock = inventory[productId]?.currentStock || 0;
      const newStock = previousStock + quantity;
      const inventoryRef = doc(db, "inventory", productId);
      
      await updateDoc(inventoryRef, {
        currentStock: newStock,
        lastRestocked: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      await recordMovement(productId, "restock", quantity, previousStock, newStock, undefined, notes || `Restocked ${quantity} units`);
      return true;
    } catch (error) {
      console.error("Failed to restock product:", error);
      return false;
    }
  }, [isAdmin, inventory, currentUserId]);

  const adjustStock = useCallback(async (
    productId: string,
    adjustment: number,
    notes?: string
  ): Promise<boolean> => {
    if (!isAdmin) return false;
    
    try {
      const previousStock = inventory[productId]?.currentStock || 0;
      const newStock = Math.max(0, previousStock + adjustment);
      const inventoryRef = doc(db, "inventory", productId);
      
      await updateDoc(inventoryRef, {
        currentStock: newStock,
        updatedAt: serverTimestamp(),
      });
      
      await recordMovement(productId, "adjustment", adjustment, previousStock, newStock, undefined, notes);
      return true;
    } catch (error) {
      console.error("Failed to adjust stock:", error);
      return false;
    }
  }, [isAdmin, inventory, currentUserId]);

  const setLowStockThreshold = useCallback(async (productId: string, threshold: number): Promise<boolean> => {
    if (!isAdmin) return false;
    try {
      await updateDoc(doc(db, "inventory", productId), { lowStockThreshold: threshold, updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error("Failed to set low stock threshold:", error);
      return false;
    }
  }, [isAdmin]);

  const setReorderSettings = useCallback(async (productId: string, reorderPoint: number, reorderQuantity: number): Promise<boolean> => {
    if (!isAdmin) return false;
    try {
      await updateDoc(doc(db, "inventory", productId), { reorderPoint, reorderQuantity, updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error("Failed to set reorder settings:", error);
      return false;
    }
  }, [isAdmin]);

  const bulkRestock = useCallback(async (items: { productId: string; quantity: number }[]): Promise<boolean> => {
    if (!isAdmin) return false;
    try {
      const batch = writeBatch(db);
      for (const item of items) {
        const previousStock = inventory[item.productId]?.currentStock || 0;
        batch.update(doc(db, "inventory", item.productId), {
          currentStock: previousStock + item.quantity,
          lastRestocked: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      for (const item of items) {
        const previousStock = inventory[item.productId]?.currentStock || 0;
        await recordMovement(item.productId, "restock", item.quantity, previousStock, previousStock + item.quantity, undefined, "Bulk restock");
      }
      return true;
    } catch (error) {
      console.error("Failed to bulk restock:", error);
      return false;
    }
  }, [isAdmin, inventory, currentUserId]);

  const initializeInventory = useCallback(async (productId: string, productName: string, initialStock: number = DEFAULT_INITIAL_STOCK): Promise<boolean> => {
    try {
      const inventoryRef = doc(db, "inventory", productId);
      const existing = await getDoc(inventoryRef);
      
      if (existing.exists()) {
        await updateDoc(inventoryRef, { productName, updatedAt: serverTimestamp() });
      } else {
        await setDoc(inventoryRef, {
          productName,
          currentStock: initialStock,
          reservedStock: 0,
          lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
          reorderPoint: DEFAULT_REORDER_POINT,
          reorderQuantity: DEFAULT_REORDER_QUANTITY,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await recordMovement(productId, "restock", initialStock, 0, initialStock, undefined, "Initial inventory");
      }
      return true;
    } catch (error) {
      console.error("Failed to initialize inventory:", error);
      return false;
    }
  }, [currentUserId]);

  const reserveStock = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const inv = inventory[productId];
      if (!inv || inv.currentStock - inv.reservedStock < quantity) return false;
      await updateDoc(doc(db, "inventory", productId), { reservedStock: inv.reservedStock + quantity, updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error("Failed to reserve stock:", error);
      return false;
    }
  }, [inventory]);

  const releaseReservedStock = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const inv = inventory[productId];
      if (!inv) return false;
      await updateDoc(doc(db, "inventory", productId), { reservedStock: Math.max(0, inv.reservedStock - quantity), updatedAt: serverTimestamp() });
      return true;
    } catch (error) {
      console.error("Failed to release reserved stock:", error);
      return false;
    }
  }, [inventory]);

  const confirmSale = useCallback(async (productId: string, quantity: number, orderId: string): Promise<boolean> => {
    try {
      const inv = inventory[productId];
      if (!inv) return false;
      const previousStock = inv.currentStock;
      const newStock = Math.max(0, previousStock - quantity);
      await updateDoc(doc(db, "inventory", productId), {
        currentStock: newStock,
        reservedStock: Math.max(0, inv.reservedStock - quantity),
        lastSold: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordMovement(productId, "sale", -quantity, previousStock, newStock, orderId, `Order #${orderId}`);
      return true;
    } catch (error) {
      console.error("Failed to confirm sale:", error);
      return false;
    }
  }, [inventory, currentUserId]);

  const getInventoryAlert = useCallback((productId: string) => {
    const inv = inventory[productId];
    return {
      productId,
      stock: inv?.currentStock ?? DEFAULT_INITIAL_STOCK,
      viewerCount: (activeViewers[productId] || 0) + Math.floor(Math.random() * 5) + 3,
    };
  }, [inventory, activeViewers]);

  const trackProductView = useCallback((productId: string) => {
    setActiveViewers(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    setTimeout(() => {
      setActiveViewers(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) - 1) }));
    }, 30000 + Math.random() * 60000);
  }, []);

  const simulatePurchase = useCallback((productId: string) => {
    setInventory(prev => {
      const inv = prev[productId];
      if (!inv) return prev;
      return { ...prev, [productId]: { ...inv, currentStock: Math.max(0, inv.currentStock - 1) } };
    });
  }, []);

  return (
    <InventoryContext.Provider
      value={{
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
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
