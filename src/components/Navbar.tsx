"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useWishlist } from "@/context/WishlistContext";
import { useProducts } from "@/context/ProductContext";
import { signOut } from "@/lib/firebase";
import { List, X, User, Heart, MagnifyingGlass, ArrowRight, Tag, Clock, Gift, CaretDown, Trophy, ShoppingBag, UserCircle, Fire } from "@phosphor-icons/react";
import { useSpinWheel } from "@/context/SpinWheelContext";
import { motion, AnimatePresence } from "@/lib/motion";

export default function Navbar() {
  const { user, userRole } = useAuth();
  const { cart } = useCart();
  const toast = useToast();
  const { wishlist } = useWishlist();
  const { products } = useProducts();
  const { canSpinToday, result, setShowWheel, requiresLogin } = useSpinWheel();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cipher-recent-searches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Close search on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [searchOpen]);

  // Prevent body scroll when search is open
  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  // Filter products based on search query
  const searchResults = searchQuery.trim().length >= 2
    ? products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 8)
    : [];

  // Popular categories for quick search
  const popularCategories = ["Hoodies", "Tees", "Pants", "Outerwear", "Accessories"];

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("cipher-recent-searches", JSON.stringify(updated));

    // Navigate to shop with search query
    router.push(`/shop?search=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleProductClick = (productId: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/shop/${productId}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("cipher-recent-searches");
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const navLinks = [
    { href: "/shop", label: "SHOP" },
    { href: "/features", label: "FEATURES" },
    { href: "/bundles", label: "BUNDLES" },
    { href: "/challenges", label: "CHALLENGES" },
    { href: "/creators", label: "CREATORS" },
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
            {mobileMenuOpen ? <X className="w-5 h-5" weight="bold" /> : <List className="w-5 h-5" weight="bold" />}
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
            {/* Spin to Win */}
            <button
              onClick={() => setShowWheel(true)}
              className="relative hover:opacity-60 transition-opacity group"
              aria-label="Spin to Win"
              title={requiresLogin ? "Sign in to spin!" : canSpinToday ? "Spin to Win!" : (result ? "View your reward" : "Come back tomorrow!")}
            >
              <Gift className="w-5 h-5" />
              {(requiresLogin || canSpinToday) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {!requiresLogin && !canSpinToday && result && result.segment.type !== "tryAgain" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[8px] rounded-full flex items-center justify-center">✓</span>
              )}
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hover:opacity-60 transition-opacity"
              aria-label="Search"
            >
              <MagnifyingGlass className="w-5 h-5" />
            </button>

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
                      className="absolute right-0 mt-4 w-56 bg-white border border-gray-100 shadow-lg rounded-lg overflow-hidden"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* My Activity Section */}
                      <div className="py-1">
                        <p className="px-4 py-2 text-[10px] tracking-widest text-gray-400 font-medium">MY ACTIVITY</p>
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                        >
                          <UserCircle className="w-4 h-4 text-gray-400" />
                          PROFILE
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                          ORDERS
                        </Link>
                        <Link
                          href="/wishlist"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-gray-400" />
                          WISHLIST
                        </Link>
                        <Link
                          href="/achievements"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                        >
                          <Trophy className="w-4 h-4 text-gray-400" />
                          ACHIEVEMENTS
                        </Link>
                        <Link
                          href="/challenges"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                        >
                          <Fire className="w-4 h-4 text-gray-400" />
                          CHALLENGES
                        </Link>
                      </div>

                      {/* Admin Section */}
                      {userRole?.isAdmin && (
                        <div className="border-t border-gray-100 py-1">
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-wider hover:bg-gray-50 transition-colors"
                          >
                            <span className="w-4 h-4 flex items-center justify-center text-gray-400 text-[10px]">⚙️</span>
                            ADMIN PANEL
                          </Link>
                        </div>
                      )}

                      {/* Sign Out */}
                      <div className="border-t border-gray-100">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-xs tracking-wider hover:bg-red-50 transition-colors text-red-600"
                        >
                          <X className="w-4 h-4" />
                          SIGN OUT
                        </button>
                      </div>
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
                    {/* Activity Section Header */}
                    <p className="text-[10px] tracking-widest text-gray-400 font-medium mt-4 mb-2">MY ACTIVITY</p>
                    <Link 
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      <UserCircle className="w-4 h-4 text-gray-400" />
                      PROFILE
                    </Link>
                    <Link 
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      ORDERS
                    </Link>
                    <Link 
                      href="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      <Heart className="w-4 h-4 text-gray-400" />
                      WISHLIST
                    </Link>
                    <Link 
                      href="/achievements"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      <Trophy className="w-4 h-4 text-gray-400" />
                      ACHIEVEMENTS
                    </Link>
                    <Link 
                      href="/challenges"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-sm tracking-wider hover:opacity-60 transition-opacity"
                    >
                      <Fire className="w-4 h-4 text-gray-400" />
                      CHALLENGES
                    </Link>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-100 my-3"></div>
                    
                    {userRole?.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-sm tracking-wider hover:opacity-60 transition-opacity"
                      >
                        <span className="w-4 h-4 flex items-center justify-center text-gray-400 text-[10px]">⚙️</span>
                        ADMIN
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-sm tracking-wider text-red-600 hover:opacity-60 transition-opacity"
                    >
                      <X className="w-4 h-4" />
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

      {/* Full Screen Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white z-[100]"
          >
            {/* Search Header */}
            <div className="border-b border-gray-100">
              <div className="container mx-auto px-4">
                <div className="flex items-center gap-4 h-20">
                  <MagnifyingGlass className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch(searchQuery);
                      }
                    }}
                    placeholder="Search for products..."
                    className="flex-1 text-xl md:text-2xl font-light outline-none placeholder:text-gray-300"
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="p-2 hover:bg-gray-100 transition rounded-full"
                    aria-label="Close search"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search Content */}
            <div className="container mx-auto px-4 py-8 overflow-y-auto max-h-[calc(100vh-80px)]">
              {/* Search Results */}
              {searchQuery.trim().length >= 2 ? (
                <div>
                  {searchResults.length > 0 ? (
                    <>
                      <p className="text-xs tracking-wider text-gray-500 mb-6">
                        {searchResults.length} RESULT{searchResults.length !== 1 ? "S" : ""} FOR "{searchQuery.toUpperCase()}"
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {searchResults.map((product) => (
                          <motion.button
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleProductClick(product.id)}
                            className="group text-left"
                          >
                            <div className="relative aspect-[3/4] bg-gray-100 mb-3 overflow-hidden">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {product.isNew && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] tracking-wider">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium group-hover:underline">{product.name}</p>
                            <p className="text-sm text-gray-500">${product.price}</p>
                          </motion.button>
                        ))}
                      </div>
                      {searchResults.length === 8 && (
                        <button
                          onClick={() => handleSearch(searchQuery)}
                          className="mt-8 flex items-center gap-2 text-sm tracking-wider hover:gap-4 transition-all"
                        >
                          VIEW ALL RESULTS <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <MagnifyingGlass className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500">No products found for "{searchQuery}"</p>
                      <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-12">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs tracking-wider text-gray-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> RECENT SEARCHES
                        </p>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-gray-400 hover:text-black transition"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-3">
                        {recentSearches.map((query, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(query);
                              handleSearch(query);
                            }}
                            className="flex items-center gap-3 w-full text-left hover:bg-gray-50 p-2 -mx-2 transition group"
                          >
                            <MagnifyingGlass className="w-4 h-4 text-gray-400" />
                            <span className="flex-1">{query}</span>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Categories */}
                  <div>
                    <p className="text-xs tracking-wider text-gray-500 flex items-center gap-2 mb-4">
                      <Tag className="w-4 h-4" /> POPULAR CATEGORIES
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSearchQuery(category);
                            handleSearch(category);
                          }}
                          className="px-4 py-2 border border-gray-200 text-sm tracking-wider hover:border-black hover:bg-black hover:text-white transition"
                        >
                          {category.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trending Products */}
                  {products.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-xs tracking-wider text-gray-500 mb-6">TRENDING NOW</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {products
                          .filter(p => p.featured || p.isNew)
                          .slice(0, 4)
                          .map((product) => (
                            <motion.button
                              key={product.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => handleProductClick(product.id)}
                              className="group text-left"
                            >
                              <div className="relative aspect-[3/4] bg-gray-100 mb-3 overflow-hidden">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <p className="text-sm font-medium group-hover:underline">{product.name}</p>
                              <p className="text-sm text-gray-500">${product.price}</p>
                            </motion.button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <p className="text-xs text-gray-400">
                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-500 mx-1">ESC</kbd> to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
