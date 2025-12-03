"use client";
import { useEffect, useState } from "react";
import { useBlog } from "@/context/BlogContext";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Clock, 
  Eye, 
  Heart,
  ShareNetwork,
  BookmarkSimple,
  XLogo,
  FacebookLogo,
  LinkedinLogo,
  Link as LinkIcon,
  CalendarBlank,
  Tag,
  SpinnerGap,
} from "@phosphor-icons/react";
import { useToast } from "@/context/ToastContext";

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { getPost, incrementViews, likePost, getPublishedPosts } = useBlog();
  
  const [hasLiked, setHasLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const post = getPost(params.slug as string);
  const relatedPosts = getPublishedPosts()
    .filter(p => p.id !== post?.id && p.category === post?.category)
    .slice(0, 3);

  // Increment views on mount
  useEffect(() => {
    if (post) {
      incrementViews(post.id);
    }
  }, [post?.id]);

  const handleLike = () => {
    if (post && !hasLiked) {
      likePost(post.id);
      setHasLiked(true);
      toast.success("Thanks for the love! ❤️");
    }
  };

  const handleShare = (platform: string) => {
    if (!post) return;
    
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Check out "${post.title}" on CIPHER`;

    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        break;
    }
    setShowShareMenu(false);
  };

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Loading article...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Journal
        </Link>
      </div>

      {/* Hero */}
      <article className="container mx-auto px-4 max-w-4xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-6">
            <span className="tracking-wider bg-gray-100 px-3 py-1">
              {post.category.toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime} min read
            </span>
            <span className="flex items-center gap-1">
              <CalendarBlank className="w-3 h-3" />
              {post.publishedAt?.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-light tracking-tight mb-8 leading-tight">
            {post.title}
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {post.excerpt}
          </p>

          {/* Author */}
          <div className="flex items-center justify-center gap-4">
            {post.author.avatar && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-left">
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-gray-500">Author</p>
            </div>
          </div>
        </motion.header>

        {/* Cover Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative aspect-[16/9] mb-12 overflow-hidden"
        >
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-12 pb-12 border-b border-gray-200">
            <Tag className="w-4 h-4 text-gray-400" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="flex items-center justify-between py-6 mb-12 border-y border-gray-200">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition ${
                hasLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart className={`w-6 h-6 ${hasLiked ? "fill-current" : ""}`} weight={hasLiked ? "fill" : "regular"} />
              <span className="text-sm font-medium">{post.likes + (hasLiked ? 1 : 0)}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-500">
              <Eye className="w-6 h-6" />
              <span className="text-sm font-medium">{post.views}</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 text-gray-500 hover:text-black transition"
            >
              <ShareNetwork className="w-5 h-5" />
              <span className="text-sm">Share</span>
            </button>

            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 shadow-lg z-10">
                <button
                  onClick={() => handleShare("twitter")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition"
                >
                  <XLogo className="w-4 h-4" />
                  <span className="text-sm">Twitter</span>
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition"
                >
                  <FacebookLogo className="w-4 h-4" />
                  <span className="text-sm">Facebook</span>
                </button>
                <button
                  onClick={() => handleShare("linkedin")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition"
                >
                  <LinkedinLogo className="w-4 h-4" />
                  <span className="text-sm">LinkedIn</span>
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition border-t border-gray-100"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-sm">Copy Link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Author Bio */}
        <div className="bg-gray-50 p-8 mb-16">
          <div className="flex items-start gap-6">
            {post.author.avatar && (
              <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-xs tracking-wider text-gray-500 mb-1">WRITTEN BY</p>
              <h3 className="text-xl font-medium mb-2">{post.author.name}</h3>
              <p className="text-gray-600 text-sm">
                Exploring the intersection of fashion, culture, and self-expression. 
                Passionate about sustainable style and the stories behind the clothes we wear.
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-light tracking-tight mb-8 text-center">
              MORE IN {post.category.toUpperCase()}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id} 
                  href={`/blog/${relatedPost.slug}`}
                  className="group block bg-white"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={relatedPost.coverImage}
                      alt={relatedPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {relatedPost.readTime} min read
                    </p>
                    <h3 className="font-medium group-hover:underline underline-offset-4">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <h2 className="text-2xl font-light tracking-tight mb-4">
            ENJOYED THIS ARTICLE?
          </h2>
          <p className="text-gray-600 mb-8">
            Subscribe to get the latest style insights and exclusive content delivered straight to your inbox.
          </p>
          <form className="flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 focus:border-black focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white text-sm tracking-wider hover:bg-gray-800 transition"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
