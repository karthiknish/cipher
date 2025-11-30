"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useProducts, Product } from "@/context/ProductContext";
import { useOrders, Order } from "@/context/OrderContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  Package, 
  DollarSign, 
  Tag, 
  Search,
  Loader2,
  ShieldAlert,
  LayoutDashboard,
  ShoppingBag,
  ChevronDown
} from "lucide-react";

const CATEGORIES = ["Hoodies", "Tees", "Pants", "Outerwear", "Accessories"];

// Admin email whitelist
const ADMIN_EMAILS = ["admin@cipher.com", "karthik@cipher.com"];

const STATUS_OPTIONS: Order["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { allOrders, loadAllOrders, updateOrderStatus } = useOrders();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Omit<Product, "id">>({
    name: "",
    price: 0,
    category: "Tees",
    description: "",
    image: "",
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
  });

  // Check if user is admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  // Load all orders when viewing orders tab
  useEffect(() => {
    if (activeTab === "orders" && isAdmin) {
      loadAllOrders();
    }
  }, [activeTab, isAdmin, loadAllOrders]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Filter products by search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter orders by search
  const filteredOrders = allOrders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: 0,
      category: "Tees",
      description: "",
      image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Product",
      sizes: ["S", "M", "L", "XL"],
      inStock: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      image: product.image,
      sizes: product.sizes || ["S", "M", "L", "XL"],
      inStock: product.inStock ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingProduct) {
      await updateProduct(editingProduct.id, formData);
    } else {
      await addProduct(formData);
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteProduct(productId);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    await updateOrderStatus(orderId, newStatus);
  };

  // Loading state
  if (authLoading || productsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You don&apos;t have permission to access the admin panel. 
          Please contact an administrator if you believe this is an error.
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-3xl md:text-4xl font-light tracking-tight">ADMIN PANEL</h1>
          </div>
          <p className="text-white/60">Manage products and orders</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 p-6">
            <Package className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{products.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">PRODUCTS</p>
          </div>
          <div className="bg-gray-50 p-6">
            <Tag className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{CATEGORIES.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">CATEGORIES</p>
          </div>
          <div className="bg-gray-50 p-6">
            <ShoppingBag className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{allOrders.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">TOTAL ORDERS</p>
          </div>
          <div className="bg-gray-50 p-6">
            <DollarSign className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">
              ${allOrders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 tracking-wider">TOTAL REVENUE</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-4 text-sm tracking-wider font-medium transition ${
              activeTab === "products" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            PRODUCTS
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 text-sm tracking-wider font-medium transition ${
              activeTab === "orders" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            ORDERS
          </button>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "products" ? "Search products..." : "Search orders..."}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
            />
          </div>
          {activeTab === "products" && (
            <button
              onClick={openAddModal}
              className="bg-black text-white px-6 py-3 text-sm tracking-wider font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition"
            >
              <Plus className="w-4 h-4" /> ADD PRODUCT
            </button>
          )}
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">PRODUCT</th>
                    <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">CATEGORY</th>
                    <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">PRICE</th>
                    <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">STATUS</th>
                    <th className="text-right py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <motion.tr 
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 bg-gray-100 relative overflow-hidden flex-shrink-0">
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-gray-100 px-3 py-1 text-xs tracking-wider">
                          {product.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium">${product.price}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 text-xs ${product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {product.inStock ? "IN STOCK" : "OUT OF STOCK"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 hover:bg-gray-100 text-gray-600 hover:text-black transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-50 text-gray-600 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No products found</p>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-gray-200">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No orders found</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 tracking-wider">ORDER #{order.id}</p>
                      <p className="text-sm">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p className="text-xs text-gray-500">{order.userEmail}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order["status"])}
                          className={`appearance-none pr-8 pl-3 py-2 text-xs tracking-wider cursor-pointer ${STATUS_COLORS[order.status]}`}
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>
                              {status.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                      <span className="font-medium">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2">
                        <div className="w-8 h-10 bg-gray-200 relative overflow-hidden">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">Size: {item.size} x {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                    <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-light tracking-tight">
                  {editingProduct ? "EDIT PRODUCT" : "ADD PRODUCT"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">PRODUCT NAME</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">PRICE ($)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">CATEGORY</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">DESCRIPTION</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition resize-none"
                    placeholder="Product description"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">IMAGE URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                      className="w-5 h-5 border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm">In Stock</span>
                  </label>
                </div>

                {/* Preview */}
                {formData.image && (
                  <div className="bg-gray-50 p-4">
                    <p className="text-xs tracking-wider text-gray-400 mb-2">PREVIEW</p>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gray-200 relative overflow-hidden">
                        <Image 
                          src={formData.image} 
                          alt="Preview" 
                          fill 
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/600x800/1a1a1a/ffffff?text=Error";
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{formData.name || "Product Name"}</p>
                        <p className="text-sm text-gray-500">${formData.price}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> SAVING...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> {editingProduct ? "UPDATE PRODUCT" : "ADD PRODUCT"}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
