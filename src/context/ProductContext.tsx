"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db, collection, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from "@/lib/firebase";
import { onSnapshot, orderBy, query } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  sizes?: string[];
  inStock?: boolean;
  createdAt?: Date;
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

// Default products for when Firebase is not configured
const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "Cipher Hoodie", price: 89, category: "Hoodies", description: "Premium heavyweight cotton hoodie with embroidered logo. Features a relaxed fit with ribbed cuffs and hem.", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Hoodie", sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: "2", name: "Street Tee", price: 45, category: "Tees", description: "Oversized fit tee made from organic cotton. Soft hand feel with minimal branding.", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Tee", sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: "3", name: "Cargo Pants", price: 95, category: "Pants", description: "Functional cargo pants with multiple pockets and adjustable fit. Made from durable ripstop fabric.", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Pants", sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: "4", name: "Cap", price: 35, category: "Accessories", description: "Classic 6-panel cap with adjustable strap. Embroidered logo on front.", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Cap", sizes: ["One Size"], inStock: true },
  { id: "5", name: "Oversized Tee", price: 55, category: "Tees", description: "Vintage wash oversized tee with dropped shoulders. Pre-shrunk cotton.", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Oversized", sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: "6", name: "Tactical Vest", price: 120, category: "Outerwear", description: "Utility vest with modular attachments. Multiple pockets for everyday carry.", image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Vest", sizes: ["S", "M", "L", "XL"], inStock: true },
];

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
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);

  // Check if Firebase is configured and load products
  useEffect(() => {
    const checkFirebaseAndLoad = async () => {
      try {
        // Check if Firebase is properly configured
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !db || typeof db !== 'object' || !('type' in db)) {
          console.log("Firebase not configured, using default products");
          setIsFirebaseConfigured(false);
          setLoading(false);
          return;
        }

        setIsFirebaseConfigured(true);
        
        // Set up real-time listener for products
        const productsRef = collection(db, "products");
        const q = query(productsRef, orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            if (snapshot.empty) {
              // If no products in Firebase, use defaults
              setProducts(DEFAULT_PRODUCTS);
            } else {
              const productList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Product[];
              setProducts(productList);
            }
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching products:", err);
            setError("Failed to load products");
            setProducts(DEFAULT_PRODUCTS);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error("Firebase check failed:", err);
        setIsFirebaseConfigured(false);
        setLoading(false);
      }
    };

    checkFirebaseAndLoad();
  }, []);

  const addProduct = async (productData: Omit<Product, "id">): Promise<string | null> => {
    try {
      if (!isFirebaseConfigured) {
        // Local mode: add to state
        const newId = Date.now().toString();
        const newProduct = { ...productData, id: newId };
        setProducts(prev => [newProduct, ...prev]);
        return newId;
      }

      const newDocRef = doc(collection(db, "products"));
      await setDoc(newDocRef, {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newDocRef.id;
    } catch (err) {
      console.error("Error adding product:", err);
      setError("Failed to add product");
      return null;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>): Promise<boolean> => {
    try {
      if (!isFirebaseConfigured) {
        // Local mode: update state
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
        return true;
      }

      const productRef = doc(db, "products", id);
      await updateDoc(productRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Failed to update product");
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      if (!isFirebaseConfigured) {
        // Local mode: remove from state
        setProducts(prev => prev.filter(p => p.id !== id));
        return true;
      }

      await deleteDoc(doc(db, "products", id));
      return true;
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product");
      return false;
    }
  };

  const getProduct = (id: string): Product | undefined => {
    return products.find(p => p.id === id);
  };

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
