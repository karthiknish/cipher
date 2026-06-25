import { createContext, use, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

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
  comparePrice?: number;
  category: string;
  description: string;
  shortDescription?: string;
  image: string;
  images?: string[];
  sizes?: string[];
  sizeStock?: SizeStock[];
  colors?: ColorVariant[];
  inStock?: boolean;
  sku?: string;
  weight?: number;
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

const ProductContext = createContext<ProductContextType>({
  products: [],
  loading: true,
  error: null,
  addProduct: async () => null,
  updateProduct: async () => false,
  deleteProduct: async () => false,
  getProduct: () => undefined,
});

export const useProducts = () => use(ProductContext);

function stripMetaFields(data: Partial<Product>) {
  const { id: _id, createdAt: _c, updatedAt: _u, ...patch } = data;
  return patch;
}

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const convexProducts = useQuery(api.products.list);
  const createProduct = useMutation(api.products.create);
  const updateProductMutation = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);

  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loading = convexProducts === undefined;

  useEffect(() => {
    if (convexProducts === undefined) return;
    setProducts(
      convexProducts.map((p) => ({
        ...p,
        createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
      }))
    );
  }, [convexProducts]);

  const addProduct = useCallback(
    async (productData: Omit<Product, "id">): Promise<string | null> => {
      try {
        setError(null);
        const id = await createProduct({
          name: productData.name,
          price: productData.price,
          comparePrice: productData.comparePrice,
          category: productData.category,
          description: productData.description,
          shortDescription: productData.shortDescription,
          image: productData.image,
          images: productData.images,
          sizes: productData.sizes,
          sizeStock: productData.sizeStock,
          colors: productData.colors,
          inStock: productData.inStock,
          sku: productData.sku,
          weight: productData.weight,
          material: productData.material,
          careInstructions: productData.careInstructions,
          tags: productData.tags,
          featured: productData.featured,
          isNew: productData.isNew,
        });
        return id;
      } catch (err) {
        console.error("Error adding product:", err);
        setError("Failed to add product");
        return null;
      }
    },
    [createProduct]
  );

  const updateProduct = useCallback(
    async (id: string, data: Partial<Product>): Promise<boolean> => {
      try {
        setError(null);
        await updateProductMutation({ id, patch: stripMetaFields(data) });
        return true;
      } catch (err) {
        console.error("Error updating product:", err);
        setError("Failed to update product");
        return false;
      }
    },
    [updateProductMutation]
  );

  const deleteProduct = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        await removeProduct({ id });
        return true;
      } catch (err) {
        console.error("Error deleting product:", err);
        setError("Failed to delete product");
        return false;
      }
    },
    [removeProduct]
  );

  const getProduct = useCallback(
    (id: string): Product | undefined => products.find((p) => p.id === id),
    [products]
  );

  const contextValue = useMemo(
    () => ({
        products,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
      }),
    [addProduct, deleteProduct, error, getProduct, loading, products, updateProduct]
  );

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};
