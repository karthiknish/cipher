"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBlog, BlogPost } from "@/context/BlogContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { 
  SpinnerGap, 
  ShieldWarning, 
  Plus,
  Pencil,
  Trash,
  Eye,
  EyeSlash,
  Image as ImageIcon,
  Calendar,
  Clock,
  X,
  Check,
  MagnifyingGlass,
  Funnel,
  ArrowUp,
  Article,
  ChartLineUp,
  Heart,
} from "@phosphor-icons/react";
import AdminLayout from "../components/AdminLayout";
import PexelsImagePicker from "@/components/PexelsImagePicker";

// Dynamically import BlogEditor to avoid SSR issues with TipTap
const BlogEditor = dynamic(() => import("@/components/BlogEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] border border-gray-200 flex items-center justify-center">
      <SpinnerGap className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
});

function BlogPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { posts, categories, createPost, updatePost, deletePost, publishPost, unpublishPost } = useBlog();
  const toast = useToast();
  const router = useRouter();
  
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!editingPost) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, editingPost]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesStatus = filterStatus === "all" || post.status === filterStatus;
      const matchesCategory = filterCategory === "all" || post.category === filterCategory;
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [posts, filterStatus, filterCategory, searchQuery]);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCoverImage("");
    setCategory(categories[0] || "");
    setTags("");
    setStatus("draft");
    setEditingPost(null);
  };

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt);
      setContent(post.content);
      setCoverImage(post.coverImage);
      setCategory(post.category);
      setTags(post.tags.join(", "));
      setStatus(post.status === "published" ? "published" : "draft");
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    const postData = {
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
      excerpt: excerpt || content.replace(/<[^>]+>/g, "").substring(0, 150) + "...",
      content,
      coverImage: coverImage || "https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg",
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author: {
        name: user?.displayName || "CIPHER Team",
        avatar: user?.photoURL || "",
      },
      status: status as "draft" | "published",
      publishedAt: status === "published" ? new Date() : null,
      scheduledFor: null,
      readTime: Math.ceil(content.replace(/<[^>]+>/g, "").split(/\s+/).length / 200),
    };

    try {
      if (editingPost) {
        await updatePost(editingPost.id, postData);
        toast.success("Post updated successfully");
      } else {
        await createPost(postData);
        toast.success("Post created successfully");
      }
      closeEditor();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(postId);
      toast.success("Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      if (post.status === "published") {
        await unpublishPost(post.id);
        toast.info("Post unpublished");
      } else {
        await publishPost(post.id);
        toast.success("Post published!");
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update post status");
    }
  };

  if (authLoading) {
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

  // Stats
  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    drafts: posts.filter((p) => p.status === "draft").length,
    totalViews: posts.reduce((sum, p) => sum + p.views, 0),
  };

  return (
    <AdminLayout 
      title="Blog Management" 
      activeTab="blog"
      actions={
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs tracking-wider hover:bg-gray-100 transition"
        >
          <Plus className="w-4 h-4" /> NEW POST
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <Article className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Posts</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <Pencil className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-2xl font-bold">{stats.drafts}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <ChartLineUp className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:border-black focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Funnel className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 border border-gray-200 focus:border-black focus:outline-none text-sm"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 focus:border-black focus:outline-none text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">POST</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">CATEGORY</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">STATUS</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">STATS</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">DATE</th>
              <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-12 bg-gray-100 flex-shrink-0 overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-[200px]">{post.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{post.excerpt}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs bg-gray-100">{post.category}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium ${
                    post.status === "published" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {post.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {post.likes}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-xs text-gray-500">
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.publishedAt 
                        ? post.publishedAt.toLocaleDateString() 
                        : post.createdAt.toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime} min read
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                      className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditor(post)}
                      className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition"
                      title={post.status === "published" ? "Unpublish" : "Publish"}
                    >
                      {post.status === "published" ? (
                        <EyeSlash className="w-4 h-4" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 hover:bg-gray-100 text-gray-500 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Article className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No posts found</p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white w-full max-w-5xl mx-4 my-auto">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">
                {editingPost ? "Edit Post" : "Create New Post"}
              </h2>
              <div className="flex items-center gap-3">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                  className="px-3 py-2 border border-gray-200 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 text-sm tracking-wider hover:bg-gray-800 transition"
                >
                  <Check className="w-4 h-4" />
                  {editingPost ? "UPDATE" : "SAVE"}
                </button>
                <button 
                  onClick={closeEditor}
                  className="p-2 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="p-6 space-y-6">
              {/* Cover Image */}
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">COVER IMAGE</label>
                <div 
                  className="relative h-48 bg-gray-100 border-2 border-dashed border-gray-300 hover:border-black transition cursor-pointer group overflow-hidden"
                  onClick={() => setShowImagePicker(true)}
                >
                  {coverImage ? (
                    <>
                      <Image src={coverImage} alt="Cover" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white text-sm">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to select cover image from Pexels</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black focus:outline-none text-xl font-medium"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">URL SLUG</label>
                <div className="flex items-center">
                  <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 text-gray-500 text-sm">
                    /blog/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-slug"
                    className="flex-1 px-4 py-3 border border-gray-200 focus:border-black focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black focus:outline-none text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">TAGS</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="fashion, style, tips (comma-separated)"
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">EXCERPT</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of the post (optional - will be auto-generated if empty)"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black focus:outline-none text-sm resize-none"
                />
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">CONTENT</label>
                <BlogEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your blog post..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pexels Image Picker */}
      <PexelsImagePicker
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(imageUrl) => {
          setCoverImage(imageUrl);
          setShowImagePicker(false);
        }}
        currentImage={coverImage}
      />
    </AdminLayout>
  );
}

function BlogPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogPageLoading />}>
      <BlogPageContent />
    </Suspense>
  );
}
