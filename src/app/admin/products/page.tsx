"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SpinnerGap, ShieldWarning, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { ProductsTab } from "../components/ProductsTab";
import AdminLayout from "../components/AdminLayout";

function ProductsPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { products, loading: productsLoading, deleteProduct } = useProducts();
  const toast = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteProduct(productId);
    toast.success("Product deleted successfully");
  };

  if (authLoading || productsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldWarning className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You don&apos;t have permission to access the admin panel.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="bg-black text-white px-8 py-4 text-sm tracking-wider hover:bg-gray-900 transition"
        >
          RETURN HOME
        </button>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Products" 
      activeTab="products"
      actions={
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs tracking-wider hover:bg-gray-100 transition"
        >
          <Plus className="w-4 h-4" /> ADD PRODUCT
        </Link>
      }
    >
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
          />
        </div>
      </div>
      <ProductsTab products={filteredProducts} onDelete={handleDelete} />
    </AdminLayout>
  );
}

function ProductsPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}
