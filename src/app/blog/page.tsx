"use client";
import { useState, useMemo } from "react";
import { useBlog } from "@/context/BlogContext";
import Image from "next/image";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { 
  MagnifyingGlass, 
  Clock, 
  Eye, 
  Heart,
  ArrowRight,
  CalendarBlank,
  SpinnerGap,
} from "@phosphor-icons/react";

export default function BlogPage() {
  const { getPublishedPosts, categories, loading } = useBlog();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const posts = getPublishedPosts();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = activeCategory === "all" || post.category === activeCategory;
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="bg-black text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
              THE CIPHER JOURNAL
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Style insights, trend reports, and behind-the-scenes stories from the world of streetwear.
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 transition"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-gray-200 sticky top-16 bg-white z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 overflow-x-auto py-4 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`text-sm tracking-wider whitespace-nowrap transition ${
                activeCategory === "all" 
                  ? "text-black font-medium" 
                  : "text-gray-500 hover:text-black"
              }`}
            >
              ALL POSTS
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-sm tracking-wider whitespace-nowrap transition ${
                  activeCategory === category 
                    ? "text-black font-medium" 
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20">
            <SpinnerGap className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading articles...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">No articles found</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="text-sm underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16"
              >
                <Link href={`/blog/${featuredPost.slug}`} className="group block">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <Image
                        src={featuredPost.coverImage}
                        alt={featuredPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 px-3 py-1 bg-black text-white text-xs tracking-wider">
                        FEATURED
                      </div>
                    </div>
                    <div className="py-4">
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="tracking-wider">{featuredPost.category.toUpperCase()}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {featuredPost.readTime} min read
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4 group-hover:underline underline-offset-8">
                        {featuredPost.title}
                      </h2>
                      <p className="text-gray-600 mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {featuredPost.author.avatar && (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden">
                              <Image
                                src={featuredPost.author.avatar}
                                alt={featuredPost.author.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{featuredPost.author.name}</p>
                            <p className="text-xs text-gray-500">
                              {featuredPost.publishedAt?.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {featuredPost.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {featuredPost.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            )}

            {/* Grid of Posts */}
            {otherPosts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/blog/${post.slug}`} className="group block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-4">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="tracking-wider">{post.category.toUpperCase()}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime} min
                        </span>
                      </div>
                      <h3 className="text-xl font-medium mb-2 group-hover:underline underline-offset-4">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {post.author.avatar && (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden">
                              <Image
                                src={post.author.avatar}
                                alt={post.author.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="text-gray-600">{post.author.name}</span>
                        </div>
                        <span className="text-gray-400 flex items-center gap-1">
                          <CalendarBlank className="w-3 h-3" />
                          {post.publishedAt?.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Newsletter CTA */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-light tracking-tight mb-4">
            STAY IN THE LOOP
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Get the latest style tips, trend reports, and exclusive content delivered to your inbox.
          </p>
          <form className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 focus:border-black focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white text-sm tracking-wider hover:bg-gray-800 transition flex items-center gap-2"
            >
              SUBSCRIBE <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
