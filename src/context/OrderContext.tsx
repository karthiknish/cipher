"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { db, collection, doc, setDoc, updateDoc, serverTimestamp, addDoc } from "@/lib/firebase";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useAuth } from "./AuthContext";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface OrderContextType {
  orders: Order[];
  allOrders: Order[]; // For admin
  loading: boolean;
  error: string | null;
  createOrder: (orderData: Omit<Order, "id" | "createdAt" | "userId" | "userEmail">) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<boolean>;
  getOrder: (id: string) => Order | undefined;
  loadAllOrders: () => Promise<void>; // For admin
}

const OrderContext = createContext<OrderContextType>({
  orders: [],
  allOrders: [],
  loading: true,
  error: null,
  createOrder: async () => null,
  updateOrderStatus: async () => false,
  getOrder: () => undefined,
  loadAllOrders: async () => {},
});

export const useOrders = () => useContext(OrderContext);

// Local storage key
const LOCAL_ORDERS_KEY = "cipher_orders";

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
  const allOrdersLoadedRef = useRef(false);
  const tokenRefreshAttemptedRef = useRef(false);

  // Load orders from localStorage for non-Firebase mode
  const loadLocalOrders = (): Order[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(LOCAL_ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const saveLocalOrders = (orderList: Order[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orderList));
  };

  // Check Firebase and load orders
  useEffect(() => {
    const checkFirebaseAndLoad = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !db || typeof db !== 'object' || !('type' in db)) {
          setIsFirebaseConfigured(false);
          // Load from localStorage
          const localOrders = loadLocalOrders();
          if (user) {
            setOrders(localOrders.filter(o => o.userId === user.uid));
          }
          setLoading(false);
          return;
        }

        setIsFirebaseConfigured(true);

        if (!user) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Set up real-time listener for user's orders
        const ordersRef = collection(db, "orders");
        const q = query(
          ordersRef, 
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q,
          (snapshot) => {
            const orderList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Order[];
            setOrders(orderList);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching orders:", err);
            setError("Failed to load orders");
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
  }, [user]);

  const loadAllOrders = useCallback(async () => {
    // Prevent multiple calls
    if (allOrdersLoadedRef.current) {
      return;
    }
    
    if (!isFirebaseConfigured) {
      // Load all from localStorage
      setAllOrders(loadLocalOrders());
      allOrdersLoadedRef.current = true;
      return;
    }

    // Only attempt token refresh once per session to avoid infinite loop
    if (user && !tokenRefreshAttemptedRef.current) {
      tokenRefreshAttemptedRef.current = true;
      try {
        await user.getIdToken(true);
      } catch (err) {
        // Token refresh failed - likely expired refresh token
        // Continue with cached token, user may need to re-login
        console.warn("Token refresh failed. User may need to re-login.");
      }
    }

    // Mark as loaded to prevent re-subscription
    allOrdersLoadedRef.current = true;

    // Set up listener for all orders (admin)
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"));

    onSnapshot(q,
      (snapshot) => {
        const orderList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Order[];
        setAllOrders(orderList);
      },
      (err) => {
        console.error("Error fetching all orders:", err);
        // Fall back to localStorage if permissions fail
        if (err.code === "permission-denied") {
          console.warn("Permission denied for all orders, falling back to localStorage");
          setAllOrders(loadLocalOrders());
        }
      }
    );
  }, [isFirebaseConfigured, user]);

  const createOrder = async (orderData: Omit<Order, "id" | "createdAt" | "userId" | "userEmail">): Promise<string | null> => {
    if (!user) {
      setError("Must be logged in to create order");
      return null;
    }

    try {
      const newOrder: Order = {
        ...orderData,
        id: "",
        userId: user.uid,
        userEmail: user.email || "",
        createdAt: new Date(),
      };

      if (!isFirebaseConfigured) {
        // Local mode
        const newId = `order_${Date.now()}`;
        newOrder.id = newId;
        const localOrders = loadLocalOrders();
        const updatedOrders = [newOrder, ...localOrders];
        saveLocalOrders(updatedOrders);
        setOrders(prev => [newOrder, ...prev]);
        return newId;
      }

      const ordersRef = collection(db, "orders");
      const docRef = await addDoc(ordersRef, {
        ...newOrder,
        createdAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (err) {
      console.error("Error creating order:", err);
      setError("Failed to create order");
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]): Promise<boolean> => {
    try {
      if (!isFirebaseConfigured) {
        // Local mode
        const localOrders = loadLocalOrders();
        const updatedOrders = localOrders.map(o => 
          o.id === orderId ? { ...o, status, updatedAt: new Date() } : o
        );
        saveLocalOrders(updatedOrders);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        return true;
      }

      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Error updating order:", err);
      setError("Failed to update order");
      return false;
    }
  };

  const getOrder = (id: string): Order | undefined => {
    return orders.find(o => o.id === id) || allOrders.find(o => o.id === id);
  };

  return (
    <OrderContext.Provider value={{
      orders,
      allOrders,
      loading,
      error,
      createOrder,
      updateOrderStatus,
      getOrder,
      loadAllOrders,
    }}>
      {children}
    </OrderContext.Provider>
  );
};
