"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useWishlist } from "@/context/WishlistContext";
import { signOut } from "@/lib/firebase";
import { Menu, X, User, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user } = useAuth();
  const { cart } = useCart();
  const toast = useToast();
  const { wishlist } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const navLinks = [
    { href: "/shop", label: "SHOP" },
    { href: "/contact", label: "CONTACT" },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.info("Signed out successfully");
    setUserMenuOpen(false);
  };

  return (
    <nav className="bg-white text-black sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-2"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop Navigation - Left */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs tracking-[0.15em] hover:opacity-60 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Logo - Center */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-[0.3em]">
            CIPHER
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-6">
            {/* Wishlist */}
            <Link href="/wishlist" className="relative hover:opacity-60 transition-opacity">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hover:opacity-60 transition-opacity"
                  aria-label="Account"
                >
                  <User className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-4 w-48 bg-white border border-gray-100 shadow-lg"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                      >
                        MY PROFILE
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                      >
                        MY WISHLIST
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                      >
                        MY ORDERS
                      </Link>
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                      >
                        ADMIN PANEL
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-3 text-xs tracking-wider hover:bg-gray-50 transition-colors text-red-600"
                      >
                        SIGN OUT
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block text-xs tracking-[0.15em] hover:opacity-60 transition-opacity"
              >
                LOGIN
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative hover:opacity-60 transition-opacity">
              <span className="text-xs tracking-[0.15em]">CART</span>
              {cartCount > 0 && (
                <span className="ml-1 text-xs">({cartCount})</span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-gray-100"
            >
              <div className="py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm tracking-wider hover:opacity-60 transition-opacity"
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      MY PROFILE
                    </Link>
                    <Link                      href="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      MY WISHLIST
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      MY ORDERS
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      ADMIN
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="block text-sm tracking-wider text-red-600 hover:opacity-60 transition-opacity"
                    >
                      SIGN OUT
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm tracking-wider hover:opacity-60 transition-opacity"
                  >
                    LOGIN
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
