"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { db, collection, doc, setDoc, deleteDoc, serverTimestamp, firebaseConfigured } from "@/lib/firebase";
import { onSnapshot, orderBy, query } from "firebase/firestore";

// Check Firebase configuration - use the flag from firebase.ts
const isFirebaseReady = () => firebaseConfigured;

export interface ColorVariant {
  name: string;
  hex: string;
  image: string;
  inStock: boolean;
}

export interface SizeStock {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number; // Original price for showing discounts
  category: string;
  description: string;
  shortDescription?: string;
  image: string;
  images?: string[]; // Additional gallery images
  sizes?: string[];
  sizeStock?: SizeStock[]; // Stock per size
  colors?: ColorVariant[];
  inStock?: boolean;
  sku?: string;
  weight?: number; // in grams
  material?: string;
  careInstructions?: string;
  tags?: string[];
  featured?: boolean;
  isNew?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, "id">) => Promise<string | null>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  getProduct: (id: string) => Product | undefined;
}

const serializeProductForComparison = (product: Product) => {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = product;
  return JSON.stringify(rest, (_, value) => value instanceof Date ? value.toISOString() : value);
};

const productsEqual = (a: Product, b: Product) => serializeProductForComparison(a) === serializeProductForComparison(b);

const ProductContext = createContext<ProductContextType>({
  products: [],
  loading: true,
  error: null,
  addProduct: async () => null,
  updateProduct: async () => false,
  deleteProduct: async () => false,
  getProduct: () => undefined,
});

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  // Firebase is the source of truth - start with empty array
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingProducts, setPendingProducts] = useState<Record<string, Product>>({});

  const productsRef = useRef<Product[]>(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const pendingProductsRef = useRef<Record<string, Product>>(pendingProducts);
  useEffect(() => {
    pendingProductsRef.current = pendingProducts;
  }, [pendingProducts]);

  // Load products from Firebase - Firebase is the source of truth
  useEffect(() => {
    const loadFromFirebase = async () => {
      try {
        if (!isFirebaseReady()) {
          console.error("Firebase not configured - no products will be available");
          setError("Firebase not configured");
          setLoading(false);
          return;
        }

        // Set up real-time listener for products
        const productsCollectionRef = collection(db, "products");
        const q = query(productsCollectionRef, orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const productList = snapshot.docs.map(docSnap => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
              };
            }) as unknown as Product[];
            
            // Merge with pending products for optimistic updates
            const pending = pendingProductsRef.current;
            const resolvedIds: string[] = [];

            const mergedProducts = productList.map(product => {
              const pendingProduct = pending[product.id];
              if (pendingProduct) {
                if (productsEqual(product, pendingProduct)) {
                  resolvedIds.push(product.id);
                  return product;
                }
                return pendingProduct;
              }
              return product;
            });

            // Add any pending products not yet in Firebase
            Object.values(pending).forEach(pendingProduct => {
              if (!mergedProducts.some(p => p.id === pendingProduct.id)) {
                mergedProducts.unshift(pendingProduct);
              }
            });

            // Clear resolved pending products
            if (resolvedIds.length > 0) {
              setPendingProducts(prev => {
                const next = { ...prev };
                resolvedIds.forEach(id => {
                  delete next[id];
                });
                return next;
              });
            }

            setProducts(mergedProducts);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching products:", err);
            setError("Failed to load products");
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error("Firebase check failed:", err);
        setError("Failed to connect to Firebase");
        setLoading(false);
      }
    };

    loadFromFirebase();
  }, []);

  const addProduct = useCallback(async (productData: Omit<Product, "id">): Promise<string | null> => {
    try {
      if (!isFirebaseReady()) {
        console.error("Firebase not configured - cannot add product");
        setError("Firebase not configured");
        return null;
      }

      const newDocRef = doc(collection(db, "products"));
      const newId = newDocRef.id;
      
      // Optimistic update
      const newProduct = { 
        ...productData, 
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Product;
      
      setProducts(prev => [newProduct, ...prev]);

      setPendingProducts(prev => ({
        ...prev,
        [newId]: newProduct,
      }));

      await setDoc(newDocRef, {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newId;
    } catch (err) {
      console.error("Error adding product:", err);
      setError("Failed to add product");
      // Revert optimistic update if needed (onSnapshot will handle it usually)
      return null;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>): Promise<boolean> => {
    try {
      if (!isFirebaseReady()) {
        console.error("Firebase not configured - cannot update product");
        setError("Firebase not configured");
        return false;
      }

      console.log("Updating product in Firebase:", id, data);
      
      // Optimistic update: update local state immediately for better UX
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date() } : p));

      setPendingProducts(prev => {
        const baseProduct = prev[id] || productsRef.current.find(p => p.id === id);
        if (!baseProduct) {
          return prev;
        }
        return {
          ...prev,
          [id]: {
            ...baseProduct,
            ...data,
            updatedAt: new Date(),
          } as Product,
        };
      });

      const productRef = doc(db, "products", id);
      // Use setDoc with merge to handle both existing and new documents
      await setDoc(productRef, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      console.log("Product updated successfully in Firebase");
      return true;
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Failed to update product");
      // Revert optimistic update on error - reload from Firebase will happen via onSnapshot
      return false;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (!isFirebaseReady()) {
        console.error("Firebase not configured - cannot delete product");
        setError("Firebase not configured");
        return false;
      }

      await deleteDoc(doc(db, "products", id));
      return true;
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product");
      return false;
    }
  }, []);

  const getProduct = useCallback((id: string): Product | undefined => {
    return products.find(p => p.id === id);
  }, [products]);

  return (
    <ProductContext.Provider value={{ 
      products, 
      loading, 
      error, 
      addProduct, 
      updateProduct, 
      deleteProduct,
      getProduct 
    }}>
      {children}
    </ProductContext.Provider>
  );
};
