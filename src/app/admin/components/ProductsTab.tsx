"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Package, Pencil, Trash } from "@phosphor-icons/react";
import { Product } from "@/context/ProductContext";

interface ProductsTabProps {
  products: Product[];
  onDelete: (productId: string) => void;
}

export function ProductsTab({ products, onDelete }: ProductsTabProps) {
  return (
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
            {products.map((product) => (
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
                  <span className={`px-2 py-1 text-xs ${product.inStock ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {product.inStock ? "IN STOCK" : "OUT OF STOCK"}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="p-2 hover:bg-gray-100 text-gray-600 hover:text-black transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 hover:bg-rose-50 text-gray-600 hover:text-rose-500 transition"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No products found</p>
        </div>
      )}
    </div>
  );
}
