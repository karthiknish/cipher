"use client";
import { createContext, use, useState, useCallback, ReactNode, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./AuthContext";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  color?: string;
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
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface OrderContextType {
  orders: Order[];
  allOrders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (
    orderData: Omit<Order, "id" | "createdAt" | "userId" | "userEmail">
  ) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<boolean>;
  getOrder: (id: string) => Order | undefined;
  loadAllOrders: () => Promise<void>;
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

export const useOrders = () => use(OrderContext);

function mapConvexOrder(o: {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: Order["status"];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: number | Date;
  updatedAt?: number | Date;
}): Order {
  return {
    ...o,
    shippingAddress: o.shippingAddress as ShippingAddress,
    createdAt:
      o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt),
    updatedAt: o.updatedAt
      ? o.updatedAt instanceof Date
        ? o.updatedAt
        : new Date(o.updatedAt)
      : undefined,
  };
}

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [adminOrdersEnabled, setAdminOrdersEnabled] = useState(false);

  const convexOrders = useQuery(
    api.orders.listMine,
    user ? {} : "skip"
  );
  const convexAllOrders = useQuery(
    api.orders.listAll,
    adminOrdersEnabled ? {} : "skip"
  );

  const createOrderMutation = useMutation(api.orders.create);
  const updateStatusMutation = useMutation(api.orders.updateStatus);

  const orders =
    convexOrders === undefined
      ? []
      : convexOrders.map((o) =>
          mapConvexOrder({
            ...o,
            items: o.items as OrderItem[],
            shippingAddress: o.shippingAddress as ShippingAddress,
          })
        );

  const allOrders =
    convexAllOrders === undefined
      ? []
      : convexAllOrders.map((o) =>
          mapConvexOrder({
            ...o,
            items: o.items as OrderItem[],
            shippingAddress: o.shippingAddress as ShippingAddress,
          })
        );

  const loading = user ? convexOrders === undefined : false;

  const loadAllOrders = useCallback(async () => {
    setAdminOrdersEnabled(true);
  }, []);

  const createOrder = async (
    orderData: Omit<Order, "id" | "createdAt" | "userId" | "userEmail">
  ): Promise<string | null> => {
    if (!user) {
      setError("Must be logged in to create order");
      return null;
    }

    try {
      setError(null);
      const id = await createOrderMutation({
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        total: orderData.total,
        status: orderData.status,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
      });
      return id;
    } catch (err) {
      console.error("Error creating order:", err);
      setError("Failed to create order");
      return null;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"]
  ): Promise<boolean> => {
    try {
      setError(null);
      await updateStatusMutation({ id: orderId, status });
      return true;
    } catch (err) {
      console.error("Error updating order:", err);
      setError("Failed to update order");
      return false;
    }
  };

  const getOrder = (id: string): Order | undefined => {
    return orders.find((o) => o.id === id) || allOrders.find((o) => o.id === id);
  };

  const contextValue = useMemo(
    () => ({
        orders,
        allOrders,
        loading,
        error,
        createOrder,
        updateOrderStatus,
        getOrder,
        loadAllOrders,
      }),
    [allOrders, createOrder, error, getOrder, loadAllOrders, loading, orders, updateOrderStatus]
  );

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};
